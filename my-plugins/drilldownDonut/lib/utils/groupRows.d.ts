import { CategoryNode } from '../types';
/**
 * Группирует плоские строки query-результата в двухуровневую иерархию.
 *
 * Правила:
 *   - Ключ категории — `row[catCol]` (приводится к string).
 *   - Если `subCol` задан: строки с `row[subCol] == null | '' | 'null'` собираются
 *     в синтетический ребёнок «Без подкатегории» (id `${parentId}/__null`).
 *   - Если `subCol` не задан: каждый row — категория без детей.
 *   - Родительские rub/count = сумма детей.
 *   - **Категории** сортируются по rub desc (большие сегменты — первыми).
 *   - **Дети** сохраняют порядок возникновения в rows — важно для предсказуемого
 *     shade-степпинга (прототип тоже сохраняет исходный порядок).
 *   - count накапливается как number если метрика задана, иначе остаётся null.
 *     NULL-значения внутри ряда конкретного row трактуются как 0 и не портят итог.
 *
 * Цвета здесь не проставляются — это делает transformProps через resolveColor.
 */
export interface GroupRowsResult {
    categories: CategoryNode[];
}
export declare function groupRows(rows: Record<string, unknown>[], catCol: string, subCol: string | undefined, valueLabel: string, countLabel: string | undefined): GroupRowsResult;
//# sourceMappingURL=groupRows.d.ts.map