"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const columns_1 = require("./columns");
/** Skeleton-состояние для таблицы. 6 заполняющих рядов с анимацией. */
function LoadingStateInner() {
    const rowsCount = 6;
    return ((0, jsx_runtime_1.jsx)("div", { role: "status", "aria-busy": "true", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445", children: Array.from({ length: rowsCount }).map((_, i) => ((0, jsx_runtime_1.jsx)(styles_1.SkeletonRow, { "$cols": columns_1.GRID_COLS, children: columns_1.COLUMNS.map((_, j) => ((0, jsx_runtime_1.jsx)("div", {}, j))) }, i))) }));
}
exports.default = (0, react_1.memo)(LoadingStateInner);
//# sourceMappingURL=LoadingState.js.map