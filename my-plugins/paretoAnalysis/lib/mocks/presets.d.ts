import { BreakdownItem, ParetoItem } from '../types';
/**
 * Данные взяты 1:1 из прототипа `ref/pareto-prototype.html` (строки 493..508).
 * 14 товарных категорий ритейла Samberi; value в млн ₽.
 *
 * При подключении реального источника этот пресет остаётся в качестве демо/fixture.
 */
export declare const LOSSES_ITEMS: ParetoItem[];
/**
 * Раскладка причин списаний по категории (для drill-модалки).
 * Ключ — id категории. Для id'шников без записи используется getBreakdown().
 */
export declare const LOSSES_BREAKDOWN: Record<string, BreakdownItem[]>;
/** Дефолтная раскладка для категорий без явного BREAKDOWN. */
export declare function getBreakdown(id: string, totalRub: number): BreakdownItem[];
/** Контракт пресета: items + cosmetic-метаданные, которые пойдут в UI. */
export interface PresetData {
    items: ParetoItem[];
    metricLabel: string;
    metricUnit: string;
    metricGenitive: string;
    headerText: string;
    breakdownTitle: string;
}
export declare const LOSSES_PRESET: PresetData;
export declare const EMPTY_PRESET: PresetData;
/**
 * Резолв mock-пресета по имени с возможностью кастомного JSON.
 * При неудачном парсинге кастом-JSON возвращает EMPTY_PRESET.
 */
export declare function getParetoPreset(preset: 'losses' | 'empty' | 'custom' | undefined, customJson?: string): PresetData;
//# sourceMappingURL=presets.d.ts.map