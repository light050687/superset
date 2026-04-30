"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const statusRules_1 = require("../utils/statusRules");
const colorFromKey_1 = require("../utils/colorFromKey");
const themeTokens_1 = require("../themeTokens");
function StatusChipInner({ status, tokens }) {
    const st = statusRules_1.STATUSES[status];
    const color = (0, colorFromKey_1.colorFromKey)(st.colorKey, tokens);
    return ((0, jsx_runtime_1.jsx)(styles_1.ChipCell, { children: (0, jsx_runtime_1.jsxs)(styles_1.Chip, { "$color": color, "$bg": (0, themeTokens_1.hexToRgba)(color, 0.15), "$border": (0, themeTokens_1.hexToRgba)(color, 0.35), children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), st.label] }) }));
}
exports.default = (0, react_1.memo)(StatusChipInner);
//# sourceMappingURL=StatusChip.js.map