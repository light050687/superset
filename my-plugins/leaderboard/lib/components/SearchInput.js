"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
function SearchInputInner({ value, onChange, placeholder }) {
    const handleChange = (0, react_1.useCallback)((e) => onChange(e.target.value), [onChange]);
    return ((0, jsx_runtime_1.jsxs)(styles_1.SearchWrap, { children: [(0, jsx_runtime_1.jsxs)(styles_1.SearchIcon, { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)(styles_1.SearchInputEl, { type: "text", value: value, onChange: handleChange, placeholder: placeholder ?? 'Поиск магазина…', autoComplete: "off", "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430" }), value.length > 0 && ((0, jsx_runtime_1.jsx)(styles_1.SearchClear, { type: "button", "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", onClick: () => onChange(''), children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) }))] }));
}
exports.default = (0, react_1.memo)(SearchInputInner);
//# sourceMappingURL=SearchInput.js.map