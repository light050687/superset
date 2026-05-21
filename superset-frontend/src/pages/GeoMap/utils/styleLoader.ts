import type { StyleSpecification } from 'maplibre-gl';
import type { ThemeMode } from '../types';
import { TILE_BASE, CACHE_BASE, STRIPPED_LAYERS } from '../constants';

/**
 * Rewrite URL to proxy path for initial style/source URLs.
 */
export function rewriteUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+(\/.*)/, `${TILE_BASE}$1`);
}

/**
 * Fetch a MapLibre GL style and modify it in-memory.
 *
 * TileServer GL generates absolute URLs (http://localhost/data/...) in both
 * the style.json and TileJSON responses. Nginx proxies /data/ and /fonts/
 * directly to the tileserver, so MapLibre can use these URLs as-is.
 * We only need to rewrite the initial source.url (TileJSON endpoint)
 * to go through /geo-tileserver/ proxy for the first fetch.
 */
export async function loadStyle(theme: ThemeMode): Promise<StyleSpecification> {
  const styleName = theme === 'dark' ? 'samberi-dark' : 'samberi';
  const styleUrl = `${TILE_BASE}/styles/${styleName}/style.json`;
  const res = await fetch(styleUrl);
  if (!res.ok) {
    throw new Error(`Failed to load style: ${res.status} ${res.statusText}`);
  }
  const style = (await res.json()) as StyleSpecification;

  // Replace TileJSON source.url with direct source.tiles.
  // MapLibre Worker fetches tiles in a blob: context where it cannot
  // properly resolve proxied TileJSON → tile URLs. Instead we inline
  // the tile URL templates directly using /data/ proxy (served by nginx).
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const sources = style.sources as Record<string, Record<string, unknown>>;
  for (const [name, source] of Object.entries(sources)) {
    if (typeof source.url === 'string' && source.type === 'vector') {
      // Keep url for metadata but override tiles with proxied URLs
      source.url = rewriteUrl(source.url);
      source.tiles = [`${origin}/data/${name}/{z}/{x}/{y}.pbf`];
    } else if (typeof source.url === 'string') {
      source.url = rewriteUrl(source.url);
    }
  }

  // Rewrite glyphs/sprite to use /fonts/ and /sprites/ proxied by nginx
  if (typeof style.glyphs === 'string') {
    style.glyphs = style.glyphs.replace(/^https?:\/\/[^/]+/, origin);
  }
  if (typeof style.sprite === 'string') {
    style.sprite = style.sprite.replace(/^https?:\/\/[^/]+/, origin);
  }

  // Strip layers that will be re-injected
  style.layers = style.layers.filter(l => !STRIPPED_LAYERS.includes(l.id));

  // Set background color
  const bgLayer = style.layers.find(l => l.id === 'bg');
  if (bgLayer && 'paint' in bgLayer) {
    (bgLayer.paint as Record<string, unknown>)['background-color'] =
      theme === 'dark' ? '#2A2E37' : '#F3F3F3';
  }

  // Inject raster basemap source (Chrome D3D11 ANGLE fix)
  const basemapDataset = theme === 'dark' ? 'basemap-dark' : 'basemap';
  sources.basemap = {
    type: 'raster',
    tiles: [`${TILE_BASE}/data/${basemapDataset}/{z}/{x}/{y}.png`],
    tileSize: 256,
    maxzoom: 8,
  };

  // Insert basemap raster layer after background
  const bgIdx = style.layers.findIndex(l => l.id === 'bg');
  style.layers.splice(bgIdx + 1, 0, {
    id: 'basemap-raster',
    type: 'raster',
    source: 'basemap',
    maxzoom: 10,
    paint: { 'raster-opacity': 1 },
  } as StyleSpecification['layers'][number]);

  // Inject GeoJSON regions source for choropleth
  sources.regions = {
    type: 'geojson',
    data: `${CACHE_BASE}/geojson/regions.geojson`,
    promoteId: 'id',
  };

  // Insert region layers before first symbol layer
  const firstSymbolIdx = style.layers.findIndex(l => l.type === 'symbol');
  const insertIdx = firstSymbolIdx > 0 ? firstSymbolIdx : style.layers.length;

  style.layers.splice(insertIdx, 0, {
    id: 'region-fill',
    type: 'fill',
    source: 'regions',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': ['coalesce', ['feature-state', 'color'], 'rgba(0,0,0,0)'],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.9,
        ['coalesce', ['feature-state', 'opacity'], 0],
      ],
    },
  } as StyleSpecification['layers'][number]);

  style.layers.splice(insertIdx + 1, 0, {
    id: 'region-border',
    type: 'line',
    source: 'regions',
    layout: { visibility: 'none' },
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        theme === 'dark' ? '#fff' : '#000',
        theme === 'dark' ? '#555' : '#999',
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        2,
        1,
      ],
    },
  } as StyleSpecification['layers'][number]);

  return style;
}
