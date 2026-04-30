"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Breadcrumb;
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_1 = require("../styles/styled");
const zoneColors_1 = require("../utils/zoneColors");
function Breadcrumb({ state, items, defaultCaption = 'Все категории', onReset, }) {
    if (state.selectedId) {
        const it = items.find(p => p.id === state.selectedId);
        if (it) {
            return ((0, jsx_runtime_1.jsxs)(styled_1.BreadcrumbRow, { children: [(0, jsx_runtime_1.jsx)(styled_1.BreadcrumbBtn, { type: "button", "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", onClick: onReset, children: "\u25C2" }), (0, jsx_runtime_1.jsx)(styled_1.BreadcrumbCur, { children: "\u0424\u0438\u043B\u044C\u0442\u0440:" }), (0, jsx_runtime_1.jsx)(styled_1.BreadcrumbSel, { children: it.name })] }));
        }
    }
    if (state.zoneFilter) {
        const count = items.filter(p => p.zone === state.zoneFilter).length;
        return ((0, jsx_runtime_1.jsxs)(styled_1.BreadcrumbRow, { children: [(0, jsx_runtime_1.jsx)(styled_1.BreadcrumbBtn, { type: "button", "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", onClick: onReset, children: "\u25C2" }), (0, jsx_runtime_1.jsx)(styled_1.BreadcrumbCur, { children: "\u0417\u043E\u043D\u0430:" }), (0, jsx_runtime_1.jsx)(styled_1.BreadcrumbSel, { children: (0, zoneColors_1.zoneLabel)(state.zoneFilter) }), (0, jsx_runtime_1.jsxs)(styled_1.BreadcrumbCur, { children: ["\u00B7 ", count, " \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439"] })] }));
    }
    return ((0, jsx_runtime_1.jsx)(styled_1.BreadcrumbRow, { children: (0, jsx_runtime_1.jsx)(styled_1.BreadcrumbCur, { children: defaultCaption }) }));
}
//# sourceMappingURL=Breadcrumb.js.map