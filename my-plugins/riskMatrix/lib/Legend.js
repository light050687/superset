"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const styles_1 = require("./styles");
const LegendList = ({ formats, hiddenFormats, onToggle }) => ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: formats.map((f) => {
        const off = hiddenFormats.has(f.id);
        return ((0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { className: off ? 'off' : '', onClick: () => onToggle(f.id), type: "button", "aria-pressed": !off, "aria-label": `${f.name} — ${off ? 'скрыт' : 'видим'}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "lg-dot", style: { background: f.color } }), (0, jsx_runtime_1.jsx)("span", { className: "lg-l", children: f.name })] }, f.id));
    }) }));
exports.default = LegendList;
//# sourceMappingURL=Legend.js.map