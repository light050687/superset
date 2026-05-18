"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlsHint = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const InfoHint_1 = require("./InfoHint");
function FooterHintsInner({ shown, total }) {
    return ((0, jsx_runtime_1.jsx)(styles_1.CardFooter, { children: (0, jsx_runtime_1.jsxs)("div", { role: "status", "aria-live": "polite", children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ", (0, jsx_runtime_1.jsx)("span", { className: "total-right", children: shown }), " \u0438\u0437", ' ', (0, jsx_runtime_1.jsx)("span", { className: "total-right", children: total })] }) }));
}
exports.default = (0, react_1.memo)(FooterHintsInner);
/** ControlsHint — i-кнопка для размещения в CardHead Controls. */
function ControlsHintInner() {
    return ((0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u043A\u0440\u043E\u0441\u0441-\u0444\u0438\u043B\u044C\u0442\u0440"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Shift" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) }));
}
exports.ControlsHint = (0, react_1.memo)(ControlsHintInner);
//# sourceMappingURL=FooterHints.js.map