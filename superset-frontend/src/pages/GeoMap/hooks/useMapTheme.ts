import { useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { ThemeMode } from '../types';
import { loadStyle } from '../utils/styleLoader';

/**
 * Hook for theme switching: loads modified style, swaps it on the map,
 * preserves viewport, and fires callback when style is ready.
 */
export function useMapTheme() {
  const swapTheme = useCallback(
    async (map: MaplibreMap, newTheme: ThemeMode, onStyleReady: () => void) => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const style = await loadStyle(newTheme);

      map.once('styledata', () => {
        map.jumpTo({ center, zoom });
        requestAnimationFrame(onStyleReady);
      });

      map.setStyle(style);
    },
    [],
  );

  return { swapTheme };
}
