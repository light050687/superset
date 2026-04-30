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
    filters: Array<{ col: string; op: 'IN'; val: string[] }>;
  };
  filterState: {
    value: string[] | null;
    selectedValues: string[] | null;
  };
  ownState?: Record<string, unknown>;
}

export function buildDataMask({
  storeCross,
  segmentCross,
  storeIdCol,
  segmentIdCol,
}: BuildDataMaskInput): DataMaskPayload {
  const filters: DataMaskPayload['extraFormData']['filters'] = [];
  const selectedValues: string[] = [];

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
