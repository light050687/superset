"use strict";
/**
 * Построение dataMask для публикации cross-filter из плагина в дашборд.
 *
 * В dashboard Superset каждый чарт может опубликовать объект
 *   { extraFormData: { filters: [...] }, filterState: { value, selectedValues } }
 * через hooks.setDataMask(). Приёмные чарты применяют filters через свой buildQuery.
 *
 * Дизайн: магазин и сегмент — разные dimensions. Отправляем оба фильтра,
 * если выбраны обе сущности; пустые Set'ы → null-сброс маски.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDataMask = buildDataMask;
function buildDataMask({ storeCross, segmentCross, storeIdCol, segmentIdCol, }) {
    const filters = [];
    const selectedValues = [];
    if (storeCross.size > 0) {
        const stores = Array.from(storeCross);
        filters.push({ col: storeIdCol, op: 'IN', val: stores });
        selectedValues.push(...stores);
    }
    if (segmentCross.size > 0) {
        const segments = Array.from(segmentCross);
        filters.push({ col: segmentIdCol, op: 'IN', val: segments });
        selectedValues.push(...segments);
    }
    if (filters.length === 0) {
        return {
            extraFormData: { filters: [] },
            filterState: { value: null, selectedValues: null },
        };
    }
    return {
        extraFormData: { filters },
        filterState: {
            value: selectedValues,
            selectedValues,
        },
    };
}
//# sourceMappingURL=crossFilter.js.map