import { QueryFormMetric } from '@superset-ui/core';
import { FormatRow } from '../types';
/**
 * Строим sparkline для каждого ряда из timeseries-данных (queriesData[1]).
 *
 * Ожидаемый формат row-а: { __timestamp: number, <categoryColumn>: string, <metricLabel>: number }.
 * Если sparkline-запрос не возвращён (пустой второй query), массивы остаются пустыми.
 */
export declare function attachSparklines(rows: FormatRow[], sparkData: Record<string, unknown>[], categoryColumn: string, metricFact: QueryFormMetric | undefined, lastNPoints: number): FormatRow[];
//# sourceMappingURL=sparklineBuild.d.ts.map