import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LegendRow, Lg, LgSwatch, LgLine, LgLabel, ZoneChipBtn, } from '../styles/styled';
import { zoneLegendLabel } from '../utils/zoneColors';
/** Легенда: 3 zone-chip как cross-filter + 2 toggle серий. */
export default function ZoneLegend({ state, tokens, metricLabel, onToggleZone, onToggleSeries, }) {
    return (_jsxs(LegendRow, { role: "group", "aria-label": "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", children: [['A', 'B', 'C'].map(z => (_jsxs(ZoneChipBtn, { active: state.zoneFilter === z, "aria-pressed": state.zoneFilter === z, onClick: () => onToggleZone(z), title: `Клик — фильтр по зоне ${z}`, type: "button", children: [_jsx(LgSwatch, { color: z === 'A' ? tokens.dn : z === 'B' ? tokens.wn : tokens.g500 }), _jsx("span", { children: zoneLegendLabel(z, state.threshold) })] }, z))), _jsx("div", { className: "sep" }), _jsxs(Lg, { off: !state.seriesVisible.bars, role: "button", tabIndex: 0, onClick: () => onToggleSeries('bars'), onKeyDown: e => {
                    if (e.key === 'Enter' || e.key === ' ')
                        onToggleSeries('bars');
                }, title: "\u0421\u043A\u0440\u044B\u0442\u044C / \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0431\u0430\u0440\u044B", children: [_jsx(LgSwatch, { color: tokens.dn }), _jsx(LgLabel, { children: metricLabel })] }), _jsxs(Lg, { off: !state.seriesVisible.line, role: "button", tabIndex: 0, onClick: () => onToggleSeries('line'), onKeyDown: e => {
                    if (e.key === 'Enter' || e.key === ' ')
                        onToggleSeries('line');
                }, title: "\u0421\u043A\u0440\u044B\u0442\u044C / \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043B\u0438\u043D\u0438\u044E", children: [_jsx(LgLine, {}), _jsx(LgLabel, { children: "\u041A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u0430\u044F %" })] })] }));
}
//# sourceMappingURL=ZoneLegend.js.map