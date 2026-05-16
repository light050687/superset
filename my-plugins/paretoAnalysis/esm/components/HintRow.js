import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InfoHint, InfoHintCorner } from './InfoHint';
/** Подсказка про управление — i-иконка в правом нижнем углу карточки.
   InfoHintCorner: absolute positioning, должен рендериться внутри Card
   с position:relative (parent ParetoCard). */
export default function HintRow() {
    return (_jsx(InfoHintCorner, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [_jsx("span", { className: "hi", children: _jsx("span", { children: "\u043A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440" }) }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsx("span", { className: "hi", children: _jsx("span", { children: "Ctrl+\u043A\u043B\u0438\u043A \u2014 \u0440\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435" }) }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsx("span", { className: "hi", children: _jsx("span", { children: "Right Click \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }) })] }) }));
}
//# sourceMappingURL=HintRow.js.map