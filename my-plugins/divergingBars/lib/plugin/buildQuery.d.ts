import type { VelocityDivergingFormData } from '../types';
/**
 * Build query для Velocity Diverging.
 *
 * Один запрос: groupby = [store_code, store_name, city, format, week],
 * metrics = [metric_loss, metric_turnover], orderby по неделе.
 * Типичное число строк: 400 магазинов × 12 недель = 4800, лимит 20000
 * оставляет запас на расширение периода.
 *
 * В mock-режиме пропускаем конфигурацию метрик/групп и шлём минимальный
 * COUNT(*)-запрос, чтобы Superset не показывал "Empty query?" ошибку.
 */
export default function buildQuery(formData: VelocityDivergingFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map