/**
 * Pure helpers — стабилизация ссылки `categories` между Superset chart
 * re-render'ами. transformProps создаёт новый массив каждый раз, что
 * триггерит лишние `setOption` + ECharts animation внутри DonutChartInner.
 *
 * Решение: useMemo с зависимостью на одну из этих строк-ключей.
 *
 *  - getCategoriesIdKey  — только структурный набор id. Используется для
 *    reset-effect (сброс selection/drilled при смене выборки). НЕ должен
 *    реагировать на theme switch / numeric refresh — иначе drill сбросится.
 *
 *  - getCategoriesContentKey — полный content-hash: id + accent + color +
 *    rub + children (id/color/rub). Меняется при структурных, числовых и
 *    визуальных обновлениях. Используется для useMemo стабилизации
 *    `categories` ссылки.
 */
export function getCategoriesIdKey(categories) {
    return categories.map(c => c.id).join('|');
}
export function getCategoriesContentKey(categories) {
    return categories
        .map(c => {
        const childrenPart = (c.children ?? [])
            .map(ch => `${ch.id}:${ch.color}:${ch.rub}`)
            .join(';');
        return `${c.id}:${c.accent}:${c.color}:${c.rub}:${childrenPart}`;
    })
        .join('|');
}
//# sourceMappingURL=categoriesContentKey.js.map