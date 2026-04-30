import type { EChartsCoreOption } from 'echarts/core';
import { BuildOptionState, CategoryNode } from '../types';
import { Tokens } from '../themeTokens';
/**
 * Чистая функция: (state, tokens) → ECharts donut option.
 * Повторяет `buildOption()` из `ref/structure-donut-prototype.html` (строки 367–521)
 * с корректировками под Superset-рантайм (токены передаются из React, а не css var()).
 */
export interface DisplayItem {
    id: string;
    name: string;
    color: string;
    rub: number;
    count: number | null;
    hidden: boolean;
    origIdx: number;
}
/** Выбор видимого среза данных: root или drilled children */
export declare function getCurrentItems(state: Pick<BuildOptionState, 'categories' | 'level' | 'drilledId' | 'hidden'>): DisplayItem[];
/**
 * Шейды детей вычисляются на основе цвета родителя: альфа от 1.0 до 0.45.
 * Вызывается из transformProps после того, как родительские цвета уже резолвлены.
 */
export declare function applyChildShades(category: CategoryNode): void;
export declare function buildOption(args: {
    state: BuildOptionState;
    tokens: Tokens;
}): EChartsCoreOption;
//# sourceMappingURL=buildOption.d.ts.map