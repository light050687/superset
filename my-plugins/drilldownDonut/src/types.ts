import { QueryFormData, QueryFormMetric, supersetTheme } from '@superset-ui/core';

// ═══════════════════════════════════════
// Core enumerations
// ═══════════════════════════════════════

/** Единица отображения значений */
export type Unit = 'rub' | 'pct';

/** Уровень иерархии: корневые категории или дети выбранной */
export type Level = 'root' | 'drilled';

/** 6 обязательных DataState из DS 2.0 */
export type DataState = 'loading' | 'error' | 'empty' | 'partial' | 'stale' | 'populated';

/** Ключи DS 2.0 accent-токенов (для палитры категорий) */
export type AccentKey = 'cSky' | 'cViolet' | 'cTangerine' | 'cFuchsia' | 'cAmber';

/** Массив accent-ключей по порядку автопалитры */
export const ACCENT_PALETTE: AccentKey[] = ['cSky', 'cViolet', 'cTangerine', 'cFuchsia', 'cAmber'];

// ═══════════════════════════════════════
// Superset runtime types
// ═══════════════════════════════════════

/** formData после lodash.camelCase (Superset преобразует все snake_case ключи controlPanel) */
export interface SupersetFormDataExtended {
  timeRange?: string;
  time_range?: string;
  granularitySqla?: string;
  granularity_sqla?: string;
  adhocFilters?: Array<Record<string, unknown>>;
  adhoc_filters?: Array<Record<string, unknown>>;
  mockModeEnabled?: boolean;
  mock_mode_enabled?: boolean;
  [key: string]: unknown;
}

/** queryData item с флагом кэша (Superset runtime) */
export interface QueryResultItem {
  data?: Record<string, unknown>[];
  is_cached?: boolean;
  error?: string;
  [key: string]: unknown;
}

/** Ant Design v5 tokens в supersetTheme */
export interface SupersetThemeExtended {
  colorBgContainer?: string;
  [key: string]: unknown;
}

// ═══════════════════════════════════════
// Domain model — двухуровневая иерархия категорий
// ═══════════════════════════════════════

/**
 * Ребёнок категории — подкатегория.
 * `isSynthetic: true` помечает узел «Без подкатегории» — агрегат строк c NULL subCol.
 */
export interface SubcategoryNode {
  id: string;          // `${parentId}/${name}`
  name: string;
  rub: number;         // значение value_metric
  count: number | null; // значение count_metric (null если метрика не задана)
  color: string;       // rgba-шейд родительского цвета
  isSynthetic?: boolean;
}

/** Корневой узел — категория верхнего уровня */
export interface CategoryNode {
  id: string;
  name: string;
  rub: number;
  count: number | null;
  color: string;       // hex из токенов
  accent: AccentKey;   // ключ, использованный при резолве — нужен для шейдов детей
  children: SubcategoryNode[]; // пустой массив если groupby_subcategory не задан
}

/** Override цвета конкретной категории (из controlPanel) */
export interface CategoryColorOverride {
  name: string;
  accent: AccentKey;
}

// ═══════════════════════════════════════
// Form data (controlPanel → buildQuery → transformProps)
// ═══════════════════════════════════════

/**
 * Form data из control panel в camelCase.
 * controlPanel.tsx использует snake_case (groupby_category, value_metric, …),
 * Superset auto-преобразует их в camelCase в chartProps.formData.
 * buildQuery.ts получает оригинальный snake_case.
 */
export interface StructureDonutFormData extends QueryFormData {
  // ── Данные ──
  groupbyCategory: string | string[];       // required (категория)
  groupbySubcategory?: string | string[];   // optional (подкатегория — включает drill)
  valueMetric: QueryFormMetric;             // required (сумма потерь в ₽)
  countMetric?: QueryFormMetric;            // optional (количество операций)
  revenueMetric?: QueryFormMetric;          // optional (знаменатель для %-режима)

  // ── Отображение ──
  headerText?: string;
  subtitleText?: string;
  padAngle: number;             // 0..4, дефолт 1.5
  borderRadius: number;         // 0..6, дефолт 2
  showOuterLabelsPct: boolean;  // показывать подписи на сегментах в %-режиме, дефолт true
  numberFormat?: string;        // дефолт RU_SMART

  // ── Цвета ──
  colorMap?: CategoryColorOverride[];

  // ── Mock-режим ──
  mockModeEnabled?: boolean;
  mockPreset?: 'losses' | 'empty' | 'custom';
  mockCustomJson?: string;
}

// ═══════════════════════════════════════
// Component props (transformProps → StructureDonut.tsx)
// ═══════════════════════════════════════

export interface StructureDonutProps {
  width: number;
  height: number;

  headerText: string;
  subtitleText: string;

  dataState: DataState;
  errorMessage?: string;

  categories: CategoryNode[];
  hasSubcategories: boolean;
  totalRevenue: number | null; // null → % использует сумму видимых сегментов

  padAngle: number;
  borderRadius: number;
  showOuterLabelsPct: boolean;
  rubDecimals: number; // 0..3, контроль знаков после запятой в hero-числе

  isDarkMode: boolean;
  theme: typeof supersetTheme;

  mockModeEnabled: boolean;
}

// ═══════════════════════════════════════
// buildOption helper state — передаётся как один объект в чистую функцию
// ═══════════════════════════════════════

export interface BuildOptionState {
  categories: CategoryNode[];
  hasSubcategories: boolean;
  totalRevenue: number | null;
  unit: Unit;
  level: Level;
  drilledId: string | null;
  selectedIdx: number | null;
  hidden: Set<string>;
  padAngle: number;
  borderRadius: number;
  showOuterLabelsPct: boolean;
  rubDecimals?: number;
}
