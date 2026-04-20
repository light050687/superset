/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { FC, useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ThemeMode, Language } from './types';
import { DEFAULT_CENTER, DEFAULT_ZOOM, CANVAS_CONTEXT_ATTRIBUTES } from './constants';
import { loadStyle } from './utils/styleLoader';
import { applyLanguage } from './hooks/useMapLanguage';
import { MapCanvasDiv } from './styles';

interface MapCanvasProps {
  theme: ThemeMode;
  language: Language;
  onMapReady: (map: MaplibreMap) => void;
  onStyleReady: () => void;
}

const MapCanvas: FC<React.PropsWithChildren<MapCanvasProps>> = ({
  theme,
  language,
  onMapReady,
  onStyleReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const initRef = useRef(false);

  const onStyleReadyRef = useRef(onStyleReady);
  onStyleReadyRef.current = onStyleReady;
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const languageRef = useRef(language);
  languageRef.current = language;

  const initMap = useCallback(async () => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const style = await loadStyle(themeRef.current);

    // canvasContextAttributes поддерживается maplibre-gl, но его
    // типы (v4.7) не описывают это поле. Cast через unknown безопасен —
    // в runtime опция принимается корректно.
    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      canvasContextAttributes: CANVAS_CONTEXT_ATTRIBUTES,
    } as unknown as maplibregl.MapOptions);

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.once('style.load', () => {
      mapRef.current = map;
      applyLanguage(map, languageRef.current);
      onMapReadyRef.current(map);
      onStyleReadyRef.current();
    });
  }, []);

  useEffect(() => {
    void initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, [initMap]);

  return <MapCanvasDiv ref={containerRef} />;
};

export default MapCanvas;
