import { useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Language } from '../types';
import { LANG_EXPR } from '../constants';

/**
 * Apply language labels to all symbol layers on the map.
 */
export function applyLanguage(map: MaplibreMap, lang: Language): void {
  const expr = LANG_EXPR[lang];
  if (!expr) return;

  const style = map.getStyle();
  if (!style) return;

  for (const layer of style.layers) {
    if (!('layout' in layer) || !layer.layout) continue;
    const layout = layer.layout as Record<string, unknown>;
    const tf = layout['text-field'];
    if (!tf) continue;

    const tfStr = typeof tf === 'string' ? tf : JSON.stringify(tf);
    if (!tfStr.includes('name') && !tfStr.includes('name:latin')) continue;
    if (tfStr.includes('housenumber') || tfStr.includes('{ele}')) continue;

    let nf: unknown = expr;
    if (layer.id === 'lbl-peak') {
      nf = [
        'concat',
        ['coalesce', ['get', 'name'], ['get', 'name:latin']],
        '\n',
        ['get', 'ele'],
        'м',
      ];
    }

    try {
      map.setLayoutProperty(layer.id, 'text-field', nf);
    } catch {
      // Layer may not exist in current style
    }
  }
}

export function useMapLanguage() {
  const apply = useCallback((map: MaplibreMap, lang: Language) => {
    applyLanguage(map, lang);
  }, []);

  return { applyLanguage: apply };
}
