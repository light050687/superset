import { useState, useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { ChoroplethState, PaletteKey, LegendItem } from '../types';
import { PALETTES } from '../constants';
import { parseCSV, detectKeyAndValueFields } from '../utils/csv';
import { computeQuantileBreaks, classifyValue } from '../utils/quantile';
import { formatNum } from '../utils/format';

export function useChoropleth() {
  const [state, setState] = useState<ChoroplethState | null>(null);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);

  const loadFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      let columns: string[];
      let rows: Record<string, string>[];

      if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
        try {
          const data = JSON.parse(text) as unknown;
          const arr = Array.isArray(data)
            ? (data as Record<string, string>[])
            : (data as { features?: { properties: Record<string, string> }[] })
                  .features
              ? (
                  data as {
                    features: { properties: Record<string, string> }[];
                  }
                ).features.map(f => f.properties)
              : [data as Record<string, string>];
          rows = arr;
          columns = rows.length > 0 ? Object.keys(rows[0]!) : [];
        } catch {
          return;
        }
      } else {
        const parsed = parseCSV(text);
        columns = parsed.columns;
        rows = parsed.rows;
      }

      if (rows.length === 0) return;

      const detected = detectKeyAndValueFields(columns, rows);
      setState({
        data: rows,
        columns,
        keyField: detected.keyField,
        valueField: detected.valueField,
        palette: 'blue',
        opacity: 0.7,
        filename: file.name,
      });
    };
    reader.readAsText(file);
  }, []);

  const setKeyField = useCallback((field: string) => {
    setState(prev => (prev ? { ...prev, keyField: field } : prev));
  }, []);

  const setValueField = useCallback((field: string) => {
    setState(prev => (prev ? { ...prev, valueField: field } : prev));
  }, []);

  const setPalette = useCallback((palette: PaletteKey) => {
    setState(prev => (prev ? { ...prev, palette } : prev));
  }, []);

  const setOpacity = useCallback((opacity: number) => {
    setState(prev => (prev ? { ...prev, opacity } : prev));
  }, []);

  const clear = useCallback(() => {
    setState(null);
    setLegendItems([]);
  }, []);

  const clearMapStates = useCallback(
    (map: MaplibreMap, featureIds?: number[]) => {
      if (featureIds) {
        for (const id of featureIds) {
          try {
            map.removeFeatureState({ source: 'regions', id });
          } catch {
            /* empty */
          }
        }
      }
      try {
        map.setLayoutProperty('region-fill', 'visibility', 'none');
      } catch {
        /* empty */
      }
      try {
        map.setLayoutProperty('region-border', 'visibility', 'none');
      } catch {
        /* empty */
      }
    },
    [],
  );

  const applyToMap = useCallback(
    (map: MaplibreMap, findFeatureId: (key: unknown) => number | null) => {
      if (!state) {
        setLegendItems([]);
        return;
      }

      const paired: { fid: number; val: number }[] = [];
      for (const row of state.data) {
        const fid = findFeatureId(row[state.keyField]);
        const val = parseFloat(String(row[state.valueField] ?? ''));
        if (fid != null && !isNaN(val)) paired.push({ fid, val });
      }

      if (paired.length === 0) {
        setLegendItems([]);
        return;
      }

      const values = paired.map(p => p.val);
      const colors = PALETTES[state.palette].colors;
      const breaks = computeQuantileBreaks(values, colors.length);

      for (const { fid, val } of paired) {
        const bucket = classifyValue(val, breaks);
        map.setFeatureState(
          { source: 'regions', id: fid },
          {
            color: colors[bucket],
            opacity: state.opacity,
            value: val,
            active: true,
          },
        );
      }

      try {
        map.setLayoutProperty('region-fill', 'visibility', 'visible');
      } catch {
        /* empty */
      }
      try {
        map.setLayoutProperty('region-border', 'visibility', 'visible');
      } catch {
        /* empty */
      }

      const items = breaks.map((b, i) => ({
        color: colors[i]!,
        label:
          i < breaks.length - 1
            ? `${formatNum(breaks[i]!)} — ${formatNum(breaks[i + 1]!)}`
            : `${formatNum(breaks[i]!)}+`,
      }));
      setLegendItems(items);
    },
    [state],
  );

  return {
    state,
    legendItems,
    loadFromFile,
    setKeyField,
    setValueField,
    setPalette,
    setOpacity,
    clear,
    clearMapStates,
    applyToMap,
  };
}
