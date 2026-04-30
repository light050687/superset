import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { Cell, RankCell, RowEl } from '../styles';
import { COLUMNS } from './columns';
import TreeChevron from './TreeChevron';
import StoreCell from './StoreCell';
import BulletCell from './BulletCell';
import DualBulletCell from './DualBulletCell';
import NumberCell from './NumberCell';
import DriversCell from './DriversCell';
import StatusChip from './StatusChip';
function StoreRowInner(props) {
    const { data, level, displayIdx, selected, dimmed, pinned, expanded, expandable, focused, tokens, globalMaxWriteoff, globalMaxShrinkage, onRowClick, onRowDblClick, onRowMouseEnter, onRowMouseLeave, onRowMouseMove, onToggleExpand, onTogglePin, } = props;
    return (_jsx(RowEl, { role: "row", tabIndex: focused ? 0 : -1, "aria-selected": selected, "$selected": selected, "$dimmed": dimmed, "$pinned": pinned, "$segment": data.isSegment, onClick: onRowClick, onDoubleClick: onRowDblClick, onMouseEnter: onRowMouseEnter, onMouseLeave: onRowMouseLeave, onMouseMove: onRowMouseMove, "data-id": data.id, children: COLUMNS.map(c => {
            switch (c.type) {
                case 'tree':
                    return (_jsx(TreeChevron, { level: level, expandable: expandable, expanded: expanded, onToggle: onToggleExpand }, c.id));
                case 'rank':
                    return (_jsx(Cell, { "$align": "center", children: _jsx(RankCell, { children: displayIdx }) }, c.id));
                case 'store':
                    return (_jsx(Cell, { children: _jsx(StoreCell, { data: data, pinned: pinned, onTogglePin: data.isSegment ? undefined : onTogglePin }) }, c.id));
                case 'bullet-loss':
                    return (_jsx(BulletCell, { value: data.writeoff, plan: data.planWriteoff, globalMax: globalMaxWriteoff, tokens: tokens }, c.id));
                case 'dual-bullet':
                    return (_jsx(DualBulletCell, { writeoff: data.writeoff, shrinkage: data.shrinkage, planWriteoff: data.planWriteoff, planShrinkage: data.planShrinkage, maxWriteoff: globalMaxWriteoff, maxShrinkage: globalMaxShrinkage, tokens: tokens }, c.id));
                case 'number': {
                    const field = c.numberField ?? 'avgWriteoff';
                    return _jsx(NumberCell, { value: data[field], unit: "\u20BD" }, c.id);
                }
                case 'drivers':
                    return _jsx(DriversCell, { data: data, tokens: tokens }, c.id);
                case 'status':
                    return (_jsx(StatusChip, { status: data.status, tokens: tokens }, c.id));
                default:
                    return _jsx(Cell, {}, c.id);
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
export default memo(StoreRowInner, areEqual);
//# sourceMappingURL=StoreRow.js.map