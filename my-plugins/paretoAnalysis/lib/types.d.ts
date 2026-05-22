import { QueryFormData, QueryFormMetric, supersetTheme } from '@superset-ui/core';
/** Superset theme extended with AntD v5 tokens (not in @superset-ui/core types). */
export interface SupersetThemeExtended {
    colorBgContainer?: string;
    [key: string]: unknown;
}
/** Extended formData — camelCase keys come from Superset's lodash conversion. */
export interface SupersetFormDataExtended {
    adhocFilters?: Array<Record<string, unknown>>;
    adhoc_filters?: Array<Record<string, unknown>>;
    timeRange?: string;
    time_range?: string;
    [key: string]: unknown;
}
export type Zone = 'A' | 'B' | 'C';
export type SeriesKind = 'bars' | 'line';
export type Unit = 'rub' | 'pct';
export type DataState = 'loading' | 'error' | 'empty' | 'partial' | 'stale' | 'populated';
/** Раскладка одной подкатегории в drill-модалке. */
export interface BreakdownItem {
    name: string;
    rub: number;
}
/** Сырые данные одной категории (на входе в компонент). */
export interface ParetoItem {
    id: string;
    name: string;
    /** Факт за текущий период (в единицах metricUnit). */
    value: number;
    /** Выручка категории — для расчёта «потери от выручки %». Опционально. */
    revenueRub?: number | null;
    /** Факт за прошлый период — для ghost-bars и ранг-анкеров. Опционально. */
    valuePrev?: number | null;
    /** Опциональная раскладка подкатегорий для drill. */
    breakdown?: BreakdownItem[];
}
/** Данные после сортировки + расчёта cumulative % + ABC-зон + тегов. */
export interface ComputedParetoItem extends ParetoItem {
    /** Доля категории в общей сумме (0..100). */
    share: number;
    /** Кумулятивный процент на ВЫХОДЕ из категории (0..100). */
    cumPct: number;
    /** Зона по правилу: cumPct на входе < threshold → A, < 95 → B, иначе C. */
    zone: Zone;
    /** Ранг (1-based) в текущем периоде. */
    rank: number;
    /** Ранг в прошлом периоде, либо null. */
    rankPrev: number | null;
    /** Δ ранга = rankPrev − rank. >0 → поднялся (стало хуже). */
    rankDelta: number | null;
    /** Была ли категория в зоне A в прошлом периоде. */
    wasInA: boolean;
    /** Впервые в A (не была, стала). */
    isNewInA: boolean;
    /** Потери как % от своей выручки, либо null если revenueRub не задан. */
    lossPctOfRevenue: number | null;
}
export interface VitalFew {
    /** Кол-во категорий в зоне A. */
    countA: number;
    /** Всего категорий в выборке. */
    total: number;
    /** Какой % всех потерь покрывает зона A (0..100). */
    cumPctA: number;
    /** Сумма потерь зоны A (в единицах metric). */
    sumA: number;
}
export interface ComputedPareto {
    items: ComputedParetoItem[];
    total: number;
    vitalFew: VitalFew;
}
export interface ParetoCardFormData extends QueryFormData {
    dimension?: string | string[];
    metricValue?: QueryFormMetric;
    metricRevenue?: QueryFormMetric;
    metricPrev?: QueryFormMetric;
    headerText?: string;
    subtitleText?: string;
    metricLabel?: string;
    metricUnit?: string;
    metricGenitive?: string;
    breakdownTitle?: string;
    defaultThreshold?: number;
    chartAriaLabel?: string;
    mockModeEnabled?: boolean;
    mockPreset?: 'losses' | 'empty' | 'custom';
    mockCustomJson?: string;
}
export interface ParetoState {
    threshold: number;
    unit: Unit;
    topAOnly: boolean;
    prevOverlay: boolean;
    zoneFilter: Zone | null;
    selectedId: string | null;
    seriesVisible: {
        bars: boolean;
        line: boolean;
    };
    drillId: string | null;
}
export interface ParetoCardProps {
    width: number;
    height: number;
    items: ParetoItem[];
    headerText: string;
    subtitleText: string;
    metricLabel: string;
    metricUnit: string;
    metricGenitive: string;
    defaultThreshold: number;
    chartAriaLabel: string;
    breakdownTitle: string;
    dataState: DataState;
    isDarkMode: boolean;
    /** Superset AntD v5 theme pass-through (для будущих токенов). */
    theme: typeof supersetTheme;
    mockModeEnabled: boolean;
}
export interface ThemeTokens {
    bg: string;
    s: string;
    ink: string;
    g50: string;
    g100: string;
    g200: string;
    g300: string;
    g400: string;
    g500: string;
    g600: string;
    g700: string;
    up: string;
    dn: string;
    wn: string;
    upBg: string;
    dnBg: string;
    wnBg: string;
    cSky: string;
    cViolet: string;
    cTangerine: string;
    cFuchsia: string;
    cAmber: string;
    onAccent: string;
    fontSans: string;
    fontMono: string;
}
//# sourceMappingURL=types.d.ts.map