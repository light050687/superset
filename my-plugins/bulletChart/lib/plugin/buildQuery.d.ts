import { BulletChartFormData } from '../types';
/**
 * Build query context for Bullet Chart.
 *
 * Sends 1 или 2 queries:
 *   - Query 0: основной — агрегаты {факт, план, ПГ, магазины} по категории.
 *   - Query 1: sparkline — временной ряд по категории (если включён).
 *
 * Все входящие ключи — snake_case из controlPanel.
 */
export default function buildQuery(formData: BulletChartFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map