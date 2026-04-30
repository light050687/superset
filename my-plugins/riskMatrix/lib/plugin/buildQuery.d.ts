import { ScatterRiskFormData } from '../types';
/**
 * Build query для ScatterRisk.
 *
 * Один запрос: groupby=[store, format, city?], metrics=[x, y, size?, plan_x?, plan_y?, sum_loss?].
 * Каждая строка ответа = одна точка на scatter.
 *
 * Сложные фильтры (filters/where/having) передаются из Superset как есть —
 * это обеспечивает cross-filter от других визуалов на дашборде.
 */
export default function buildQuery(formData: ScatterRiskFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map