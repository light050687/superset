import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BreadcrumbRow, BreadcrumbBtn, BreadcrumbCur, BreadcrumbSel, } from '../styles/styled';
import { zoneLabel } from '../utils/zoneColors';
export default function Breadcrumb({ state, items, defaultCaption = 'Все категории', onReset, }) {
    if (state.selectedId) {
        const it = items.find(p => p.id === state.selectedId);
        if (it) {
            return (_jsxs(BreadcrumbRow, { children: [_jsx(BreadcrumbBtn, { type: "button", "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", onClick: onReset, children: "\u25C2" }), _jsx(BreadcrumbCur, { children: "\u0424\u0438\u043B\u044C\u0442\u0440:" }), _jsx(BreadcrumbSel, { children: it.name })] }));
        }
    }
    if (state.zoneFilter) {
        const count = items.filter(p => p.zone === state.zoneFilter).length;
        return (_jsxs(BreadcrumbRow, { children: [_jsx(BreadcrumbBtn, { type: "button", "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", onClick: onReset, children: "\u25C2" }), _jsx(BreadcrumbCur, { children: "\u0417\u043E\u043D\u0430:" }), _jsx(BreadcrumbSel, { children: zoneLabel(state.zoneFilter) }), _jsxs(BreadcrumbCur, { children: ["\u00B7 ", count, " \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439"] })] }));
    }
    // Default state (нет активных фильтров) — ничего не рендерим, лишний шум.
    // subtitleText «за период» уже передаёт контекст. defaultCaption оставлен в
    // API на случай явного override снаружи (не равен дефолту).
    if (defaultCaption !== 'Все категории') {
        return (_jsx(BreadcrumbRow, { children: _jsx(BreadcrumbCur, { children: defaultCaption }) }));
    }
    return null;
}
//# sourceMappingURL=Breadcrumb.js.map