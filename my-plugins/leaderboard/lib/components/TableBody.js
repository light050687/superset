"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const columns_1 = require("./columns");
const StoreRow_1 = __importDefault(require("./StoreRow"));
function TableBodyInner(props) {
    const { rows, allStores, crossSelected, segmentCrossSelected, pinned, expanded, focusedRowId, tokens, onRowClick, onRowDblClick, onRowMouseEnter, onRowMouseMove, onRowMouseLeave, onToggleExpand, onTogglePin, } = props;
    const globalMaxWriteoff = (0, react_1.useMemo)(() => Math.max(...allStores.map(s => s.writeoff), 0.01), [allStores]);
    const globalMaxShrinkage = (0, react_1.useMemo)(() => Math.max(...allStores.map(s => Math.max(0, s.shrinkage)), 0.01), [allStores]);
    if (rows.length === 0) {
        return ((0, jsx_runtime_1.jsx)(styles_1.TableBodyEl, { "$cols": columns_1.GRID_COLS, children: (0, jsx_runtime_1.jsx)("div", { role: "status", "aria-live": "polite", style: {
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--g600)',
                    fontFamily: 'var(--m)',
                    fontSize: 12,
                }, children: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0438\u043B\u0438 \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A." }) }));
    }
    return ((0, jsx_runtime_1.jsx)(styles_1.TableBodyEl, { "$cols": columns_1.GRID_COLS, role: "rowgroup", children: rows.map(r => {
            const data = r.data;
            const id = data.id;
            const segmentId = data.isSegment ? data.segmentId : null;
            const isCross = data.isSegment
                ? segmentCrossSelected.has(segmentId ?? '')
                : crossSelected.has(id);
            const someCross = data.isSegment
                ? segmentCrossSelected.size > 0
                : crossSelected.size > 0;
            const dimmed = someCross && !isCross;
            const isPinned = pinned.has(id);
            const isExpanded = expanded.has(id);
            const expandable = !data.isSegment;
            return ((0, jsx_runtime_1.jsx)(StoreRow_1.default, { data: data, level: r.level, displayIdx: r.displayIdx, selected: isCross, dimmed: dimmed, pinned: isPinned, expanded: isExpanded, expandable: expandable, focused: focusedRowId === id, tokens: tokens, globalMaxWriteoff: globalMaxWriteoff, globalMaxShrinkage: globalMaxShrinkage, onRowClick: e => {
                    if (e.target.closest('[data-action]'))
                        return;
                    onRowClick(id, r.displayIdx - 1, e);
                }, onRowDblClick: () => onRowDblClick(id, r.kind === 'segment' ? r.parentStoreId : undefined), onRowMouseEnter: e => onRowMouseEnter?.(id, e), onRowMouseMove: e => onRowMouseMove?.(id, e), onRowMouseLeave: onRowMouseLeave, onToggleExpand: () => onToggleExpand(id), onTogglePin: data.isSegment ? undefined : () => onTogglePin(id) }, id));
        }) }));
}
exports.default = (0, react_1.memo)(TableBodyInner);
//# sourceMappingURL=TableBody.js.map