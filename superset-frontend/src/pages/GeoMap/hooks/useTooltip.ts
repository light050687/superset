import { useState, useCallback, useRef } from 'react';
import type { Map as MaplibreMap, MapMouseEvent } from 'maplibre-gl';
import type { TooltipState } from '../types';
import { formatNum } from '../utils/format';

const INITIAL: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  name: '',
  value: '',
  metricLabel: '',
};

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(INITIAL);
  const hoveredIdRef = useRef<number | null>(null);
  const handlersRef = useRef<{
    onMove: (e: MapMouseEvent) => void;
    onLeave: () => void;
  } | null>(null);

  const setup = useCallback((map: MaplibreMap, valueFieldLabel: string) => {
    // Remove previous handlers
    if (handlersRef.current) {
      try {
        map.off('mousemove', 'region-fill', handlersRef.current.onMove);
        map.off('mouseleave', 'region-fill', handlersRef.current.onLeave);
      } catch {
        /* empty */
      }
    }

    const onMove = (e: MapMouseEvent) => {
      const { features } = e as MapMouseEvent & {
        features?: Array<{
          id: number;
          properties: Record<string, string>;
        }>;
      };
      if (!features || features.length === 0) {
        setTooltip(INITIAL);
        return;
      }

      const f = features[0]!;
      const featureState = map.getFeatureState({
        source: 'regions',
        id: f.id,
      }) as {
        active?: boolean;
        value?: number;
      };

      if (!featureState.active) {
        setTooltip(INITIAL);
        return;
      }

      map.getCanvas().style.cursor = 'pointer';

      if (hoveredIdRef.current !== null && hoveredIdRef.current !== f.id) {
        map.setFeatureState(
          { source: 'regions', id: hoveredIdRef.current },
          { hover: false },
        );
      }
      hoveredIdRef.current = f.id;
      map.setFeatureState({ source: 'regions', id: f.id }, { hover: true });

      const name = f.properties.name || f.properties.name_en || '';
      const val =
        featureState.value != null ? formatNum(featureState.value) : '';

      setTooltip({
        visible: true,
        x: e.point.x + 12,
        y: e.point.y - 12,
        name,
        value: val,
        metricLabel: valueFieldLabel,
      });
    };

    const onLeave = () => {
      if (hoveredIdRef.current !== null) {
        try {
          map.setFeatureState(
            { source: 'regions', id: hoveredIdRef.current },
            { hover: false },
          );
        } catch {
          /* empty */
        }
        hoveredIdRef.current = null;
      }
      setTooltip(INITIAL);
      map.getCanvas().style.cursor = '';
    };

    handlersRef.current = { onMove, onLeave };

    try {
      map.on('mousemove', 'region-fill', onMove);
      map.on('mouseleave', 'region-fill', onLeave);
    } catch {
      /* empty */
    }
  }, []);

  const teardown = useCallback((map: MaplibreMap) => {
    if (handlersRef.current) {
      try {
        map.off('mousemove', 'region-fill', handlersRef.current.onMove);
        map.off('mouseleave', 'region-fill', handlersRef.current.onLeave);
      } catch {
        /* empty */
      }
      handlersRef.current = null;
    }
    hoveredIdRef.current = null;
    setTooltip(INITIAL);
  }, []);

  return { tooltip, setup, teardown };
}
