import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { SkeletonRow } from '../styles';
import { GRID_COLS, COLUMNS } from './columns';
/** Skeleton-состояние для таблицы. 6 заполняющих рядов с анимацией. */
function LoadingStateInner() {
    const rowsCount = 6;
    return (_jsx("div", { role: "status", "aria-busy": "true", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445", children: Array.from({ length: rowsCount }).map((_, i) => (_jsx(SkeletonRow, { "$cols": GRID_COLS, children: COLUMNS.map((_, j) => (_jsx("div", {}, j))) }, i))) }));
}
export default memo(LoadingStateInner);
//# sourceMappingURL=LoadingState.js.map