"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
function TreeChevronInner({ level, expandable, expanded, onToggle }) {
    if (!expandable) {
        return ((0, jsx_runtime_1.jsx)(styles_1.TreeCellEl, { "$level": level, children: (0, jsx_runtime_1.jsx)(styles_1.TreeBullet, { "aria-hidden": true }) }));
    }
    return ((0, jsx_runtime_1.jsx)(styles_1.TreeCellEl, { "$level": level, children: (0, jsx_runtime_1.jsx)(styles_1.ExBtn, { type: "button", "$open": expanded, "aria-label": expanded ? 'Свернуть' : 'Раскрыть', "aria-expanded": expanded, onClick: e => {
                e.stopPropagation();
                onToggle?.();
            }, children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 1 L7 5 L3 9" }) }) }) }));
}
exports.default = (0, react_1.memo)(TreeChevronInner);
//# sourceMappingURL=TreeChevron.js.map