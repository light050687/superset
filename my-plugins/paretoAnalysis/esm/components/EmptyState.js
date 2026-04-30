import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StateCenter, StateTitle, StateSub, SkeletonBlock, } from '../styles/styled';
/** Загрузочные/пустые/ошибочные состояния по DS 2.0. */
export default function EmptyState({ state }) {
    if (state === 'loading') {
        return (_jsxs(StateCenter, { role: "status", "aria-live": "polite", children: [_jsx(SkeletonBlock, { w: "40%", h: "14px" }), _jsx(SkeletonBlock, { w: "70%", h: "220px" }), _jsx(SkeletonBlock, { w: "50%", h: "12px" }), _jsx(StateSub, { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445\u2026" })] }));
    }
    if (state === 'error') {
        return (_jsxs(StateCenter, { role: "alert", children: [_jsx(StateTitle, { children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435" }), _jsx(StateSub, { children: "\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0434\u0430\u0448\u0431\u043E\u0440\u0434 \u0438\u043B\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0433\u0440\u0430\u0444\u0438\u043A\u0430." })] }));
    }
    if (state === 'stale') {
        return (_jsxs(StateCenter, { children: [_jsx(StateTitle, { children: "\u0414\u0430\u043D\u043D\u044B\u0435 \u0443\u0441\u0442\u0430\u0440\u0435\u043B\u0438" }), _jsx(StateSub, { children: "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u2014 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A." })] }));
    }
    if (state === 'partial') {
        return (_jsxs(StateCenter, { children: [_jsx(StateTitle, { children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435" }), _jsx(StateSub, { children: "\u041D\u0435 \u0432\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0438\u0441\u044C, \u0447\u0430\u0441\u0442\u044C \u0433\u0440\u0430\u0444\u0438\u043A\u0430 \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C." })] }));
    }
    return (_jsxs(StateCenter, { children: [_jsx(StateTitle, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" }), _jsx(StateSub, { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0440\u0430\u0437\u043C\u0435\u0440\u043D\u043E\u0441\u0442\u044C \u0438 \u043C\u0435\u0442\u0440\u0438\u043A\u0443 \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u0433\u0440\u0430\u0444\u0438\u043A\u0430." })] }));
}
//# sourceMappingURL=EmptyState.js.map