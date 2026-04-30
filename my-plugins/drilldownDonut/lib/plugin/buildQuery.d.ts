import { StructureDonutFormData } from '../types';
/**
 * Build query context для structure-donut.
 *
 * Стратегия: один query с `columns: [categoryCol, subcategoryCol]` и метриками
 * [valueMetric, countMetric?, revenueMetric?]. Client-side группировка в
 * transformProps / groupRows(). Row limit 500.
 *
 * Важный gotcha (см. kpiCard/buildQuery.ts): sharedControls.groupby всегда
 * возвращает массив, даже при multi:false. buildQueryContext может вызвать
 * .toLowerCase() на этих полях → crash если не string. Нормализуем в начале.
 */
export default function buildQuery(formData: StructureDonutFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map