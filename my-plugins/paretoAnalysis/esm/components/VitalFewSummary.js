import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VitalFewLine } from '../styles/styled';
import { formatMetricValue } from '../utils/paretoFormat';
const nf1 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
/** Одна строка: «N из M категорий дают X% {metricGenitive} — Y млн ₽». */
export default function VitalFewSummary({ vitalFew, metricGenitive, metricUnit, }) {
    if (vitalFew.countA === 0)
        return null;
    return (_jsxs(VitalFewLine, { "aria-live": "polite", children: [_jsx("span", { className: "mark", "aria-hidden": true }), _jsxs("span", { children: [_jsx("b", { children: vitalFew.countA }), " \u0438\u0437 ", _jsx("b", { children: vitalFew.total }), " \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439 \u0434\u0430\u044E\u0442", ' ', _jsxs("b", { className: "dn", children: [nf1.format(vitalFew.cumPctA), "%"] }), " ", metricGenitive, " \u2014", ' ', _jsx("b", { children: formatMetricValue(vitalFew.sumA, metricUnit) })] })] }));
}
//# sourceMappingURL=VitalFewSummary.js.map