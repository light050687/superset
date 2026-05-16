"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const columns_1 = require("./columns");
const TreeChevron_1 = __importDefault(require("./TreeChevron"));
const StoreCell_1 = __importDefault(require("./StoreCell"));
const BulletCell_1 = __importDefault(require("./BulletCell"));
const DualBulletCell_1 = __importDefault(require("./DualBulletCell"));
const NumberCell_1 = __importDefault(require("./NumberCell"));
const DriversCell_1 = __importDefault(require("./DriversCell"));
const StatusChip_1 = __importDefault(require("./StatusChip"));
function StoreRowInner(props) {
    const { data, level, displayIdx, selected, dimmed, pinned, expanded, expandable, focused, tokens, globalMaxWriteoff, globalMaxShrinkage, onRowClick, onRowDblClick, onRowMouseEnter, onRowMouseLeave, onRowMouseMove, onToggleExpand, onTogglePin, } = props;
    return ((0, jsx_runtime_1.jsx)(styles_1.RowEl, { role: "row", tabIndex: focused ? 0 : -1, "aria-selected": selected, "$selected": selected, "$dimmed": dimmed, "$pinned": pinned, "$segment": data.isSegment, onClick: onRowClick, onDoubleClick: onRowDblClick, onMouseEnter: onRowMouseEnter, onMouseLeave: onRowMouseLeave, onMouseMove: onRowMouseMove, "data-id": data.id, children: columns_1.COLUMNS.map(c => {
            switch (c.type) {
                case 'tree':
                    return ((0, jsx_runtime_1.jsx)(TreeChevron_1.default, { level: level, expandable: expandable, expanded: expanded, onToggle: onToggleExpand }, c.id));
                case 'rank':
                    return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { "$align": "center", children: (0, jsx_runtime_1.jsx)(styles_1.RankCell, { children: displayIdx }) }, c.id));
                case 'store':
                    return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { children: (0, jsx_runtime_1.jsx)(StoreCell_1.default, { data: data, pinned: pinned, onTogglePin: data.isSegment ? undefined : onTogglePin }) }, c.id));
                case 'bullet-loss':
                    return ((0, jsx_runtime_1.jsx)(BulletCell_1.default, { value: data.writeoff, plan: data.planWriteoff, globalMax: globalMaxWriteoff, tokens: tokens }, c.id));
                case 'dual-bullet':
                    return ((0, jsx_runtime_1.jsx)(DualBulletCell_1.default, { writeoff: data.writeoff, shrinkage: data.shrinkage, planWriteoff: data.planWriteoff, planShrinkage: data.planShrinkage, maxWriteoff: globalMaxWriteoff, maxShrinkage: globalMaxShrinkage, tokens: tokens }, c.id));
                case 'number': {
                    const field = c.numberField ?? 'avgWriteoff';
                    return (0, jsx_runtime_1.jsx)(NumberCell_1.default, { value: data[field], unit: "\u20BD" }, c.id);
                }
                case 'drivers':
                    return (0, jsx_runtime_1.jsx)(DriversCell_1.default, { data: data, tokens: tokens }, c.id);
                case 'status':
                    return ((0, jsx_runtime_1.jsx)(StatusChip_1.default, { status: data.status, tokens: tokens }, c.id));
                default:
                    return (0, jsx_runtime_1.jsx)(styles_1.Cell, {}, c.id);
            }
        }) }));
}
/** memo по id + все «состояние» ключи. */
function areEqual(prev, next) {
    return (prev.data.id === next.data.id &&
        prev.displayIdx === next.displayIdx &&
        prev.level === next.level &&
        prev.selected === next.selected &&
        prev.dimmed === next.dimmed &&
        prev.pinned === next.pinned &&
        prev.expanded === next.expanded &&
        prev.expandable === next.expandable &&
        prev.focused === next.focused &&
        prev.tokens === next.tokens &&
        prev.globalMaxWriteoff === next.globalMaxWriteoff &&
        prev.globalMaxShrinkage === next.globalMaxShrinkage);
}
exports.default = (0, react_1.memo)(StoreRowInner, areEqual);
//# sourceMappingURL=StoreRow.js.map