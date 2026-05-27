import type { ChartProps, QueryFormData, SetDataMaskHook } from '@superset-ui/core';
export type StatusCode = 'ok' | 'writeoff' | 'shrinkage' | 'critical';
export type FormatCode = 'express' | 'minimarket' | 'super' | 'home' | 'superstore';
export interface CauseType {
    id: string;
    name: string;
    /** Ключ токена в DsTokens (например 'sky', 'tangerine'). */
    colorKey: 'sky' | 'violet' | 'tangerine' | 'fuchsia' | 'amber' | 'g500';
}
export interface StatusMeta {
    label: string;
    description: string;
    /** Ключ токена в DsTokens. */
    colorKey: 'up' | 'dn' | 'sky' | 'tangerine' | 'violet' | 'fuchsia' | 'amber';
    rank: number;
}
export interface FormatMeta {
    id: FormatCode;
    name: string;
    colorKey: 'sky' | 'violet' | 'tangerine' | 'fuchsia' | 'amber' | 'g500';
    planWriteoff: number;
    planShrinkage: number;
    count: number;
}
export interface CauseDistribution {
    type: CauseType;
    pct: number;
    delta: number;
}
export interface WoTypeDistribution {
    name: string;
    pct: number;
    delta: number;
}
export interface Segment {
    id: string;
    segmentId: string;
    storeId: string;
    isSegment: true;
    code: string;
    name: string;
    shortLabel: string;
    city: string;
    format: FormatCode;
    formatName: string;
    toClass: number;
    writeoff: number;
    shrinkage: number;
    planWriteoff: number;
    planShrinkage: number;
    lossCombined: number;
    avgWriteoff: number;
    avgShrinkageCheck: number;
    mainCause: CauseType;
    mainCausePct: number;
    mainCauseDelta: number;
    mainWoType: string;
    mainWoTypePct: number;
    mainWoTypeDelta: number;
    status: StatusCode;
    statusRank: number;
    causeDist: CauseDistribution[];
    woTypeDist: WoTypeDistribution[];
}
export interface Store {
    id: string;
    isSegment: false;
    code: string;
    name: string;
    shortLabel: string;
    city: string;
    format: FormatCode;
    formatName: string;
    division: string;
    revenue: number;
    toClass: number;
    writeoff: number;
    shrinkage: number;
    planWriteoff: number;
    planShrinkage: number;
    lossCombined: number;
    avgWriteoff: number;
    avgShrinkageCheck: number;
    mainCause: CauseType;
    mainCausePct: number;
    mainCauseDelta: number;
    mainWoType: string;
    mainWoTypePct: number;
    mainWoTypeDelta: number;
    mainSegment: string;
    mainSegmentPct: number;
    mainSegmentDelta: number;
    status: StatusCode;
    statusRank: number;
    /** Тренд % списаний за 12 недель. */
    spark: number[];
    causeDist: CauseDistribution[];
    woTypeDist: WoTypeDistribution[];
    segmentsDist: Segment[];
}
/** Ключи, по которым можно сортировать таблицу. */
export type SortKey = 'name' | 'lossCombined' | 'writeoff' | 'shrinkage' | 'avgWriteoff' | 'avgShrinkageCheck' | 'statusRank';
export type SortDir = 'asc' | 'desc';
export type MockPreset = 'losses_400' | 'losses_50' | 'empty';
export interface RankedStoresFormData extends QueryFormData {
    groupbyStoreId?: unknown;
    groupbyStoreName?: unknown;
    groupbyCity?: unknown;
    groupbyFormat?: unknown;
    groupbyFormatName?: unknown;
    groupbyDivision?: unknown;
    groupbyToClass?: unknown;
    metricWriteoff?: unknown;
    metricShrinkage?: unknown;
    metricPlanWriteoff?: unknown;
    metricPlanShrinkage?: unknown;
    metricAvgWriteoff?: unknown;
    metricAvgShrinkageCheck?: unknown;
    storeIdCol?: string;
    storeNameCol?: string;
    cityCol?: string;
    formatCol?: string;
    formatNameCol?: string;
    divisionCol?: string;
    toClassCol?: string;
    segmentIdCol?: string;
    writeoffMetric?: string;
    shrinkageMetric?: string;
    planWriteoffMetric?: string;
    planShrinkageMetric?: string;
    avgWriteoffMetric?: string;
    avgShrinkageCheckMetric?: string;
    rowLimit?: number;
    defaultSort?: SortKey;
    /** Размер страницы в пагинации (25/50/100/200). */
    pageSize?: number;
    periodLabel?: string;
    mockModeEnabled?: boolean;
    mockPreset?: MockPreset;
}
export interface RankedStoresTransformedProps {
    width: number;
    height: number;
    stores: Store[];
    formData: RankedStoresFormData;
    hooks: {
        setDataMask?: SetDataMaskHook;
        [key: string]: unknown;
    };
    filterState?: ChartProps['filterState'];
    emitCrossFilters?: boolean;
    periodLabel: string;
    defaultSort: SortKey;
    pageSize: number;
    /** Имя столбца, по которому пробрасывается cross-filter магазинов. */
    storeIdCol: string;
    /** Имя столбца для cross-filter по сегментам. */
    segmentIdCol: string;
}
export interface TooltipAnchor {
    rowId: string;
    x: number;
    y: number;
}
export type ModalKind = null | 'store' | 'segment';
export interface ChartUiState {
    sortBy: SortKey;
    sortDir: SortDir;
    search: string;
    statusFilters: Set<StatusCode>;
    formatFilters: Set<FormatCode>;
    pinned: Set<string>;
    expanded: Set<string>;
    storeCross: Set<string>;
    segmentCross: Set<string>;
    lastClickedIdx: number | null;
    modal: {
        kind: ModalKind;
        storeId: string | null;
        segmentId: string | null;
    };
    focusedRowId: string | null;
    /** 0-indexed page number. Сбрасывается в 0 при изменении filters/search/sort. */
    page: number;
}
export type ChartUiAction = {
    type: 'TOGGLE_SORT';
    payload: {
        sortKey: SortKey;
        defaultDir?: SortDir;
    };
} | {
    type: 'SET_SEARCH';
    payload: string;
} | {
    type: 'TOGGLE_STATUS';
    payload: StatusCode;
} | {
    type: 'TOGGLE_FORMAT';
    payload: FormatCode;
} | {
    type: 'TOGGLE_PIN';
    payload: string;
} | {
    type: 'TOGGLE_EXPAND';
    payload: {
        id: string;
        segmentIds: string[];
    };
} | {
    type: 'ROW_CLICK';
    payload: {
        id: string;
        idx: number;
    };
} | {
    type: 'ROW_SHIFT_CLICK';
    payload: {
        id: string;
        idx: number;
        range: string[];
    };
} | {
    type: 'TOGGLE_SEGMENT_CROSS';
    payload: string;
} | {
    type: 'CLEAR_CROSS';
} | {
    type: 'OPEN_STORE_MODAL';
    payload: string;
} | {
    type: 'OPEN_SEGMENT_MODAL';
    payload: {
        storeId: string;
        segmentId: string;
    };
} | {
    type: 'CLOSE_MODAL';
} | {
    type: 'RESET_FILTERS';
} | {
    type: 'FOCUS_ROW';
    payload: string | null;
} | {
    type: 'SET_PAGE';
    payload: number;
};
export interface FlatRowStore {
    kind: 'store';
    data: Store;
    level: 0;
    displayIdx: number;
}
export interface FlatRowSegment {
    kind: 'segment';
    data: Segment;
    level: 1;
    displayIdx: number;
    parentStoreId: string;
}
export type FlatRow = FlatRowStore | FlatRowSegment;
//# sourceMappingURL=types.d.ts.map