import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { MRankRow, MRanked } from '../styles';
import { deltaClass, fmtDelta, nf2 } from '../utils/formatRussian';
/** Список горизонтальных bar-rows (причины/виды списаний в модалке). */
function RankedBarListInner({ items }) {
    const maxPct = Math.max(...items.map(i => i.pct), 0.01);
    return (_jsx(MRanked, { children: items.map((item, idx) => {
            const barPct = (item.pct / maxPct) * 100;
            const dCls = deltaClass(item.delta, true);
            return (_jsxs(MRankRow, { children: [_jsx("div", { className: "m-rank-name", title: item.name, children: item.name }), _jsx("div", { className: "m-rank-bar", children: _jsx("div", { className: "m-rank-bar-fill", style: { width: `${barPct}%`, background: item.color } }) }), _jsxs("div", { className: "m-rank-pct", children: [nf2(item.pct), "%"] }), _jsx("div", { className: `m-rank-delta ${dCls}`, children: fmtDelta(item.delta) })] }, `${item.name}-${idx}`));
        }) }));
}
export default memo(RankedBarListInner);
//# sourceMappingURL=RankedBarList.js.map