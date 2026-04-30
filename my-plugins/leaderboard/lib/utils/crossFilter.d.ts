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
export interface BuildDataMaskInput {
    storeCross: Set<string>;
    segmentCross: Set<string>;
    storeIdCol: string;
    segmentIdCol: string;
}
export interface DataMaskPayload {
    extraFormData: {
        filters: Array<{
            col: string;
            op: 'IN';
            val: string[];
        }>;
    };
    filterState: {
        value: string[] | null;
        selectedValues: string[] | null;
    };
    ownState?: Record<string, unknown>;
}
export declare function buildDataMask({ storeCross, segmentCross, storeIdCol, segmentIdCol, }: BuildDataMaskInput): DataMaskPayload;
//# sourceMappingURL=crossFilter.d.ts.map