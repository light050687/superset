import { ChartProps } from '@superset-ui/core';
import { StructureDonutProps } from '../types';
/**
 * Преобразует ChartProps от Superset в props компонента StructureDonut.
 *
 * Шаги:
 *   1. Нормализация groupby-массивов.
 *   2. Определение dark/light темы → выбор набора токенов.
 *   3. Mock-путь: вернуть preset'овские данные.
 *   4. Empty-путь: нет метрики/колонки/данных.
 *   5. Real-data путь: group rows, resolve colors, compute totalRevenue, DataState.
 */
export default function transformProps(chartProps: ChartProps): StructureDonutProps;
//# sourceMappingURL=transformProps.d.ts.map