import { ParetoCardFormData } from '../types';
/**
 * Build query context для Pareto Card.
 *
 * Отправляет ОДИН запрос group-by по dimension с суммой metric_value
 * (+ опциональные metric_revenue / metric_prev).
 *
 * Если никаких метрик не задано, а включён mock-режим — в запрос добавляется
 * COUNT(*) как безопасный fallback, чтобы Superset не бросил «Empty query?».
 * Результат такого запроса игнорируется в transformProps при mockModeEnabled=true.
 */
export default function buildQuery(formData: ParetoCardFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map