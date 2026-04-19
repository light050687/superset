import { useState, useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { LAYER_GROUPS } from '../constants';

export interface LayerGroupState {
  id: string;
  icon: string;
  label: string;
  on: boolean;
  layers: string[];
}

export function useLayerGroups() {
  const [groups, setGroups] = useState<LayerGroupState[]>(() =>
    LAYER_GROUPS.map(g => ({ ...g })),
  );

  const toggleGroup = useCallback(
    (groupId: string, map: MaplibreMap | null) => {
      setGroups(prev =>
        prev.map(g => {
          if (g.id !== groupId) return g;
          const newOn = !g.on;
          const visibility = newOn ? 'visible' : 'none';
          if (map) {
            g.layers.forEach(layerId => {
              try {
                map.setLayoutProperty(layerId, 'visibility', visibility);
              } catch {
                // Layer may not exist
              }
            });
          }
          return { ...g, on: newOn };
        }),
      );
    },
    [],
  );

  const applyAllVisibility = useCallback(
    (map: MaplibreMap) => {
      groups.forEach(g => {
        const visibility = g.on ? 'visible' : 'none';
        g.layers.forEach(layerId => {
          try {
            map.setLayoutProperty(layerId, 'visibility', visibility);
          } catch {
            // Layer may not exist
          }
        });
      });
    },
    [groups],
  );

  return { groups, toggleGroup, applyAllVisibility };
}
