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

export type Language = 'ru' | 'en' | 'local';
export type ThemeMode = 'light' | 'dark';
export type PaletteKey = 'blue' | 'green' | 'orange' | 'red' | 'purple';

export interface LayerGroupDefinition {
  id: string;
  icon: string;
  label: string;
  on: boolean;
  layers: string[];
}

export interface Palette {
  name: string;
  colors: [string, string, string, string, string];
}

export interface ChoroplethState {
  data: Record<string, string>[];
  columns: string[];
  keyField: string;
  valueField: string;
  palette: PaletteKey;
  opacity: number;
  filename?: string;
}

export interface RegionIndex {
  byOktmo: Record<string, number>;
  byName: Record<string, number>;
  byIso: Record<string, number>;
}

export interface RegionFeatureProperties {
  id: number;
  name?: string;
  name_en?: string;
  oktmo?: string;
  iso?: string;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  value: string;
  metricLabel: string;
}

export interface LegendItem {
  color: string;
  label: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: RegionFeatureProperties;
  geometry: unknown;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
