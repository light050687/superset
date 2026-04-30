"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const columns_1 = require("./columns");
function TableHeaderInner({ sortBy, sortDir, onSort }) {
    return ((0, jsx_runtime_1.jsx)(styles_1.TableHead, { "$cols": columns_1.GRID_COLS, role: "row", children: columns_1.COLUMNS.map(c => {
            const isSortable = c.sortable !== false && Boolean(c.sortKey);
            const isSorted = c.sortKey === sortBy;
            const alignTh = c.align;
            const aria = isSorted
                ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                : undefined;
            return ((0, jsx_runtime_1.jsxs)(styles_1.Th, { role: "columnheader", "aria-sort": aria, "$align": alignTh, "$sorted": isSorted, "$sortable": isSortable, tabIndex: isSortable ? 0 : -1, onClick: () => {
                    if (!isSortable || !c.sortKey)
                        return;
                    onSort(c.sortKey, c.defaultSort ?? 'desc');
                }, onKeyDown: e => {
                    if (!isSortable || !c.sortKey)
                        return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSort(c.sortKey, c.defaultSort ?? 'desc');
                    }
                }, children: [c.label, isSorted &&
                        (sortDir === 'desc' ? ((0, jsx_runtime_1.jsx)("svg", { className: "sort-arrow", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M5 2 L5 8 M2.5 6 L5 8 L7.5 6" }) })) : ((0, jsx_runtime_1.jsx)("svg", { className: "sort-arrow", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M5 8 L5 2 M2.5 4 L5 2 L7.5 4" }) })))] }, c.id));
        }) }));
}
exports.default = (0, react_1.memo)(TableHeaderInner);
//# sourceMappingURL=TableHeader.js.map