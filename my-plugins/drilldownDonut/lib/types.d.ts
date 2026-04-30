import { QueryFormData, QueryFormMetric, supersetTheme } from '@superset-ui/core';
/** Единица отображения значений */
export type Unit = 'rub' | 'pct';
/** Уровень иерархии: корневые категории или дети выбранной */
export type Level = 'root' | 'drilled';
/** 6 обязательных DataState из DS 2.0 */
export type DataState = 'loading' | 'error' | 'empty' | 'partial' | 'stale' | 'populated';
/** Ключи DS 2.0 accent-токенов (для палитры категорий) */
export type AccentKey = 'cSky' | 'cViolet' | 'cTangerine' | 'cFuchsia' | 'cAmber';
/** Массив accent-ключей по порядку автопалитры */
export declare const ACCENT_PALETTE: AccentKey[];
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
/**
 * Ребёнок категории — подкатегория.
 * `isSynthetic: true` помечает узел «Без подкатегории» — агрегат строк c NULL subCol.
 */
export interface SubcategoryNode {
    id: string;
    name: string;
    rub: number;
    count: number | null;
    color: string;
    isSynthetic?: boolean;
}
/** Корневой узел — категория верхнего уровня */
export interface CategoryNode {
    id: string;
    name: string;
    rub: number;
    count: number | null;
    color: string;
    accent: AccentKey;
    children: SubcategoryNode[];
}
/** Override цвета конкретной категории (из controlPanel) */
export interface CategoryColorOverride {
    name: string;
    accent: AccentKey;
}
/**
 * Form data из control panel в camelCase.
 * controlPanel.tsx использует snake_case (groupby_category, value_metric, …),
 * Superset auto-преобразует их в camelCase в chartProps.formData.
 * buildQuery.ts получает оригинальный snake_case.
 */
export interface StructureDonutFormData extends QueryFormData {
    groupbyCategory: string | string[];
    groupbySubcategory?: string | string[];
    valueMetric: QueryFormMetric;
    countMetric?: QueryFormMetric;
    revenueMetric?: QueryFormMetric;
    headerText?: string;
    subtitleText?: string;
    padAngle: number;
    borderRadius: number;
    showOuterLabelsPct: boolean;
    numberFormat?: string;
    colorMap?: CategoryColorOverride[];
    mockModeEnabled?: boolean;
    mockPreset?: 'losses' | 'empty' | 'custom';
    mockCustomJson?: string;
}
export interface StructureDonutProps {
    width: number;
    height: number;
    headerText: string;
    subtitleText: string;
    dataState: DataState;
    errorMessage?: string;
    categories: CategoryNode[];
    hasSubcategories: boolean;
    totalRevenue: number | null;
    padAngle: number;
    borderRadius: number;
    showOuterLabelsPct: boolean;
    isDarkMode: boolean;
    theme: typeof supersetTheme;
    mockModeEnabled: boolean;
}
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
}
//# sourceMappingURL=types.d.ts.map