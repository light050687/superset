import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { CardFooter } from '../styles';
import { InfoHint, InfoHintTopRight } from './InfoHint';
function FooterHintsInner({ shown, total }) {
    return (_jsx(CardFooter, { children: _jsxs("div", { role: "status", "aria-live": "polite", children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ", _jsx("span", { className: "total-right", children: shown }), " \u0438\u0437", ' ', _jsx("span", { className: "total-right", children: total })] }) }));
}
export default memo(FooterHintsInner);
/** ControlsHint — i-кнопка для размещения в CardHead Controls. */
function ControlsHintInner() {
    return (_jsx(InfoHintTopRight, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [_jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Click" }), " \u2014 \u043A\u0440\u043E\u0441\u0441-\u0444\u0438\u043B\u044C\u0442\u0440"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Shift" }), "+", _jsx("kbd", { children: "Click" }), " \u2014 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Ctrl" }), "+", _jsx("kbd", { children: "Click" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Esc" }), " \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) }));
}
export const ControlsHint = memo(ControlsHintInner);
//# sourceMappingURL=FooterHints.js.map