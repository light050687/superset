import { useState, useEffect, useCallback } from 'react';
import type { RegionIndex, GeoJSONFeatureCollection } from '../types';
import { CACHE_BASE } from '../constants';

export function useRegionIndex() {
  const [regionIndex, setRegionIndex] = useState<RegionIndex | null>(null);
  const [regionsGeoJSON, setRegionsGeoJSON] =
    useState<GeoJSONFeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = `${CACHE_BASE}/geojson/regions.geojson`;
        const res = await fetch(url);
        const data = (await res.json()) as GeoJSONFeatureCollection;
        if (cancelled) return;

        const index: RegionIndex = { byOktmo: {}, byName: {}, byIso: {} };
        for (const f of data.features) {
          const p = f.properties;
          if (p.oktmo) index.byOktmo[p.oktmo] = p.id;
          if (p.name) index.byName[p.name.toLowerCase()] = p.id;
          if (p.name_en) index.byName[p.name_en.toLowerCase()] = p.id;
          if (p.iso) index.byIso[p.iso.toLowerCase()] = p.id;
        }

        setRegionsGeoJSON(data);
        setRegionIndex(index);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load regions GeoJSON:', e);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const findFeatureId = useCallback(
    (keyValue: unknown): number | null => {
      if (!regionIndex || keyValue == null) return null;
      const s = String(keyValue).trim();
      const low = s.toLowerCase();
      return (
        regionIndex.byOktmo[s] ??
        regionIndex.byName[low] ??
        regionIndex.byIso[low] ??
        null
      );
    },
    [regionIndex],
  );

  return { regionIndex, regionsGeoJSON, findFeatureId };
}
