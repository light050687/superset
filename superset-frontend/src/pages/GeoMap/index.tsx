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
import { FC, useState, useCallback, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { ThemeMode, Language } from './types';
import { applyLanguage } from './hooks/useMapLanguage';
import { useMapTheme } from './hooks/useMapTheme';
import { useLayerGroups } from './hooks/useLayerGroups';
import MapCanvas from './MapCanvas';
import ControlBar from './ControlBar';
import ThemeToggle from './ThemeToggle';
import LayerPanel from './LayerPanel';
import { MapPageContainer } from './styles';

/**
 * Full-page GeoMap component for Superset.
 * Vector tile map with layer toggles, theme switching, and language selection.
 */
const GeoMap: FC<React.PropsWithChildren<unknown>> = () => {
  const [map, setMap] = useState<MaplibreMap | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [language, setLanguage] = useState<Language>('ru');

  const { swapTheme } = useMapTheme();
  const { groups, toggleGroup, applyAllVisibility } = useLayerGroups();

  const languageRef = useRef(language);
  languageRef.current = language;

  const handleMapReady = useCallback((mapInstance: MaplibreMap) => {
    setMap(mapInstance);
  }, []);

  const handleStyleReady = useCallback(() => {
    if (!map) return;
    applyAllVisibility(map);
  }, [map, applyAllVisibility]);

  const handleThemeToggle = useCallback(() => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (map) {
      void swapTheme(map, newTheme, () => {
        applyLanguage(map, languageRef.current);
        applyAllVisibility(map);
      });
    }
  }, [theme, map, swapTheme, applyAllVisibility]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (map) applyLanguage(map, lang);
    },
    [map],
  );

  const handleToggleGroup = useCallback(
    (groupId: string) => {
      toggleGroup(groupId, map);
    },
    [toggleGroup, map],
  );

  return (
    <MapPageContainer>
      <MapCanvas
        theme={theme}
        language={language}
        onMapReady={handleMapReady}
        onStyleReady={handleStyleReady}
      />
      <ControlBar language={language} onLanguageChange={handleLanguageChange} />
      <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
      <LayerPanel groups={groups} onToggleGroup={handleToggleGroup} />
    </MapPageContainer>
  );
};

export default GeoMap;
