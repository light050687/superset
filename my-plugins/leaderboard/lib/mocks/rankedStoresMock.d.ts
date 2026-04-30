import type { CauseType, FormatMeta, FormatCode } from '../types';
/** Типы причин списаний (driver cell + ranked bars в модалке). */
export declare const CAUSE_TYPES: CauseType[];
/** Виды списаний (ranked bars в модалке). */
export declare const WRITEOFF_TYPES: string[];
/** Товарные сегменты для tree-accordion и modal сегмента. */
export declare const SEGMENTS: string[];
/** Форматы магазинов — используются как справочник для dropdown и маппинга цветов. */
export declare const FORMATS_META: Record<FormatCode, FormatMeta>;
/** Справочник дивизионов по формату. */
export declare const DIVISION_BY_FORMAT: Record<FormatCode, string>;
/** Список форматов в порядке отображения (для dropdown). */
export declare const FORMAT_ORDER: FormatCode[];
//# sourceMappingURL=rankedStoresMock.d.ts.map