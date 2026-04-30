import type { DrillData, DrillQueryParams } from '../types';
/**
 * Parallel fetch of all drill data needed to render DetailModal.
 * Promises are fired together with a single AbortController so a close/cancel drops all three.
 *
 * Returns empty lists for any dimension not configured (storeDim / skuDim).
 */
export declare function fetchDrillData(queryParams: DrillQueryParams, rowId: string, signal?: AbortSignal): Promise<DrillData>;
//# sourceMappingURL=detailApi.d.ts.map