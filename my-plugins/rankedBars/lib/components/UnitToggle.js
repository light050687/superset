"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
/** Simple segmented toggle between ₽ and %. Used in card header. */
const UnitToggle = ({ value, onChange }) => ((0, jsx_runtime_1.jsxs)(styles_1.UnitToggleEl, { role: "tablist", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: value === 'rub' ? 'on' : '', "aria-pressed": value === 'rub', "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B: \u0440\u0443\u0431\u043B\u0438", onClick: () => onChange('rub'), children: "\u20BD" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: value === 'pct' ? 'on' : '', "aria-pressed": value === 'pct', "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B: \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u044B", onClick: () => onChange('pct'), children: "%" })] }));
exports.default = (0, react_1.memo)(UnitToggle);
//# sourceMappingURL=UnitToggle.js.map