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
import type { LayerGroupDefinition, Palette, PaletteKey } from './types';

// ─── Tile server URLs (always via nginx reverse proxy) ──────────────────────
// nginx proxies /geo-tileserver/ → tileserver:8090 and /geo-tiles/ → tile-cache:8082
// Direct access (port 8088) is NOT supported for geo-map — CSP blocks cross-origin
// fetches to localhost:8090. Always access via nginx (port 80).
export const TILE_BASE = '/geo-tileserver';
export const CACHE_BASE = '/geo-tiles';

// ─── Default map settings ───────────────────────────────────────────────────

export const DEFAULT_CENTER: [number, number] = [90, 62];
export const DEFAULT_ZOOM = 3;

export const CANVAS_CONTEXT_ATTRIBUTES = {
  antialias: false,
  powerPreference: 'high-performance' as const,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
};

// ─── Layers to strip from style before loading ──────────────────────────────

export const STRIPPED_LAYERS = [
  'land-fill',
  'ocean-grid',
  'basemap-raster',
  'region-fill',
  'region-border',
];

// ─── Layer groups ───────────────────────────────────────────────────────────

export const LAYER_GROUPS: LayerGroupDefinition[] = [
  {
    id: 'medical',
    icon: '🏥',
    label: 'Медицина',
    on: true,
    layers: ['poi-hospital', 'landuse-hospital'],
  },
  {
    id: 'education',
    icon: '🏫',
    label: 'Образование',
    on: true,
    layers: ['poi-school', 'landuse-school'],
  },
  {
    id: 'shops',
    icon: '🛒',
    label: 'Магазины и кафе',
    on: true,
    layers: ['poi-shop', 'poi-food'],
  },
  {
    id: 'transport',
    icon: '🚌',
    label: 'Транспорт',
    on: true,
    layers: [
      'poi-bus',
      'poi-metro-entrance',
      'poi-railway',
      'transit-metro',
      'transit-tram',
    ],
  },
  {
    id: 'tourism',
    icon: '🏨',
    label: 'Туризм и отели',
    on: true,
    layers: ['poi-tourism', 'poi-lodging'],
  },
  {
    id: 'religion',
    icon: '⛪',
    label: 'Религия',
    on: true,
    layers: ['poi-worship'],
  },
  {
    id: 'nature',
    icon: '🌳',
    label: 'Природа',
    on: true,
    layers: [
      'landcover-wood',
      'landcover-grass',
      'landcover-farm',
      'landuse-park',
      'park-fill',
    ],
  },
  {
    id: 'buildings',
    icon: '🏗️',
    label: 'Здания',
    on: true,
    layers: ['building', 'building-ln'],
  },
  {
    id: 'roads',
    icon: '🛣️',
    label: 'Дороги',
    on: true,
    layers: [
      'road-trunk',
      'road-pri',
      'road-sec',
      'road-tertiary',
      'road-minor',
      'road-service',
      'road-path',
      'road-surface-unpaved',
      'road-casing',
      'road-oneway',
      'railway',
      'aeroway-runway',
      'aeroway-taxiway',
      'lbl-road-major',
      'lbl-road-sec',
      'lbl-road-minor',
      'lbl-transit',
    ],
  },
  {
    id: 'industry',
    icon: '🏭',
    label: 'Промзоны',
    on: true,
    layers: ['landuse-ind', 'landuse-military', 'landuse-stadium'],
  },
  {
    id: 'housenumbers',
    icon: '🔢',
    label: 'Номера домов',
    on: false,
    layers: ['lbl-housenumber'],
  },
];

// ─── Color palettes ─────────────────────────────────────────────────────────

export const PALETTES: Record<PaletteKey, Palette> = {
  blue: {
    name: 'Синяя',
    colors: ['#E8F0FE', '#A8CCE8', '#5B9BD5', '#2B6CB0', '#1A3D6D'],
  },
  green: {
    name: 'Зелёная',
    colors: ['#E8F8E8', '#8FD88F', '#4CAF50', '#2E7D32', '#1B5E20'],
  },
  orange: {
    name: 'Оранжевая',
    colors: ['#FFF3E0', '#FFCC80', '#FF9800', '#E65100', '#BF360C'],
  },
  red: {
    name: 'Красная',
    colors: ['#FFEBEE', '#EF9A9A', '#F44336', '#C62828', '#7F0000'],
  },
  purple: {
    name: 'Фиолетовая',
    colors: ['#F3E5F5', '#CE93D8', '#9C27B0', '#6A1B9A', '#4A148C'],
  },
};

// ─── Language expressions ───────────────────────────────────────────────────

export const LANG_EXPR: Record<string, unknown[]> = {
  ru: ['coalesce', ['get', 'name'], ['get', 'name:latin']],
  en: ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']],
  local: ['coalesce', ['get', 'name:latin'], ['get', 'name']],
};
