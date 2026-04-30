/**
 * Aggregation engine for KPI Card detail drill-down.
 *
 * Takes raw numeric rows and groups/aggregates them into
 * hierarchical DetailGroup[] using the specified aggregation type.
 *
 * Re-runs on every hierarchy swap — grouping by "primary → secondary"
 * produces DIFFERENT aggregated values than "secondary → primary"
 * (e.g., average per segment ≠ average per store).
 */
import type { ComparisonColorScheme, DeltaStatus, DetailRow } from '../types';
export declare function getDeltaStatus(delta: number, colorScheme: ComparisonColorScheme): DeltaStatus;
export declare function computeDelta(current: number, reference: number, isPercentMode: boolean, deltaFormat: string, defaultFormatDelta: (n: number) => string): {
    formatted: string;
    status_value: number;
};
export declare function formatRow(name: string, metric: number, comp1: number | null, comp2: number | null, isPercentMode: boolean, formatValue: (n: number) => string, defaultFormatDelta: (n: number) => string, colorScheme1: ComparisonColorScheme, colorScheme2: ComparisonColorScheme, enableComp1: boolean, enableComp2: boolean, deltaFormat1: string, deltaFormat2: string, fmtComp1?: (n: number) => string, fmtComp2?: (n: number) => string, fmtDelta1?: (n: number) => string, fmtDelta2?: (n: number) => string, showDelta1?: boolean, showDelta2?: boolean, delta1Raw?: number | null, delta2Raw?: number | null): DetailRow;
//# sourceMappingURL=aggregation.d.ts.map