import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { CardFooter } from '../styles';
function FooterHintsInner({ shown, total }) {
    return (_jsxs(CardFooter, { children: [_jsxs("div", { className: "hint", children: [_jsxs("span", { className: "hint-item", children: [_jsx("kbd", { children: "Click" }), " \u2014 \u043A\u0440\u043E\u0441\u0441-\u0444\u0438\u043B\u044C\u0442\u0440"] }), _jsxs("span", { className: "hint-item", children: [_jsx("kbd", { children: "Shift" }), "+", _jsx("kbd", { children: "Click" }), " \u2014 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D"] }), _jsxs("span", { className: "hint-item", children: [_jsx("kbd", { children: "Ctrl" }), "+", _jsx("kbd", { children: "Click" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] }), _jsxs("span", { className: "hint-item", children: [_jsx("kbd", { children: "Esc" }), " \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] })] }), _jsxs("div", { role: "status", "aria-live": "polite", children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ", _jsx("span", { className: "total-right", children: shown }), " \u0438\u0437", ' ', _jsx("span", { className: "total-right", children: total })] })] }));
}
export default memo(FooterHintsInner);
//# sourceMappingURL=FooterHints.js.map