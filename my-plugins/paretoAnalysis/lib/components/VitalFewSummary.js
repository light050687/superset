"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VitalFewSummary;
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_1 = require("../styles/styled");
const paretoFormat_1 = require("../utils/paretoFormat");
const nf1 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
/** Одна строка: «N из M категорий дают X% {metricGenitive} — Y млн ₽». */
function VitalFewSummary({ vitalFew, metricGenitive, metricUnit, }) {
    if (vitalFew.countA === 0)
        return null;
    return ((0, jsx_runtime_1.jsxs)(styled_1.VitalFewLine, { "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)("span", { className: "mark", "aria-hidden": true }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("b", { children: vitalFew.countA }), " \u0438\u0437 ", (0, jsx_runtime_1.jsx)("b", { children: vitalFew.total }), " \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439 \u0434\u0430\u044E\u0442", ' ', (0, jsx_runtime_1.jsxs)("b", { className: "dn", children: [nf1.format(vitalFew.cumPctA), "%"] }), " ", metricGenitive, " \u2014", ' ', (0, jsx_runtime_1.jsx)("b", { children: (0, paretoFormat_1.formatMetricValue)(vitalFew.sumA, metricUnit) })] })] }));
}
//# sourceMappingURL=VitalFewSummary.js.map