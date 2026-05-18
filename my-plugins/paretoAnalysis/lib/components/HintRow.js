"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HintRow;
const jsx_runtime_1 = require("react/jsx-runtime");
const InfoHint_1 = require("./InfoHint");
/** Подсказка про управление — i-кнопка в правом нижнем углу карточки.
   InfoHintTopRight: inline-flex обёртка, размещается внутри Footer. */
function HintRow() {
    return ((0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u043A\u043B\u0438\u043A" }), " \u2014 \u0444\u0438\u043B\u044C\u0442\u0440"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "\u043A\u043B\u0438\u043A" }), " \u2014 \u0440\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) }));
}
//# sourceMappingURL=HintRow.js.map