"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ZoneLegend;
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_1 = require("../styles/styled");
const zoneColors_1 = require("../utils/zoneColors");
/** Легенда: 3 zone-chip как cross-filter + 2 toggle серий. */
function ZoneLegend({ state, tokens, metricLabel, onToggleZone, onToggleSeries, }) {
    return ((0, jsx_runtime_1.jsxs)(styled_1.LegendRow, { role: "group", "aria-label": "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", children: [['A', 'B', 'C'].map(z => ((0, jsx_runtime_1.jsxs)(styled_1.ZoneChipBtn, { active: state.zoneFilter === z, "aria-pressed": state.zoneFilter === z, onClick: () => onToggleZone(z), title: `Клик — фильтр по зоне ${z}`, type: "button", children: [(0, jsx_runtime_1.jsx)(styled_1.LgSwatch, { color: z === 'A' ? tokens.dn : z === 'B' ? tokens.wn : tokens.g500 }), (0, jsx_runtime_1.jsx)("span", { children: (0, zoneColors_1.zoneLegendLabel)(z, state.threshold) })] }, z))), (0, jsx_runtime_1.jsx)("div", { className: "sep" }), (0, jsx_runtime_1.jsxs)(styled_1.Lg, { off: !state.seriesVisible.bars, role: "button", tabIndex: 0, onClick: () => onToggleSeries('bars'), onKeyDown: e => {
                    if (e.key === 'Enter' || e.key === ' ')
                        onToggleSeries('bars');
                }, title: "\u0421\u043A\u0440\u044B\u0442\u044C / \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0431\u0430\u0440\u044B", children: [(0, jsx_runtime_1.jsx)(styled_1.LgSwatch, { color: tokens.dn }), (0, jsx_runtime_1.jsx)(styled_1.LgLabel, { children: metricLabel })] }), (0, jsx_runtime_1.jsxs)(styled_1.Lg, { off: !state.seriesVisible.line, role: "button", tabIndex: 0, onClick: () => onToggleSeries('line'), onKeyDown: e => {
                    if (e.key === 'Enter' || e.key === ' ')
                        onToggleSeries('line');
                }, title: "\u0421\u043A\u0440\u044B\u0442\u044C / \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043B\u0438\u043D\u0438\u044E", children: [(0, jsx_runtime_1.jsx)(styled_1.LgLine, {}), (0, jsx_runtime_1.jsx)(styled_1.LgLabel, { children: "\u041A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u0430\u044F %" })] })] }));
}
//# sourceMappingURL=ZoneLegend.js.map