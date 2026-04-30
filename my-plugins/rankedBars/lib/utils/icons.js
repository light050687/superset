"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICON_BODIES = void 0;
exports.resolveIcon = resolveIcon;
exports.getIconBody = getIconBody;
const jsx_runtime_1 = require("react/jsx-runtime");
const clockBody = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "8", r: "6.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 4.5 L8 8 L10.5 9.5" })] }));
const thermometerBody = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M8 1.5 L8 9.5" }), (0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "11.5", r: "2.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M6 5 L10 5 M6 7 L10 7" })] }));
const shieldBody = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M8 1.5 L13 3.5 L13 8 C13 11 8 14.5 8 14.5 C8 14.5 3 11 3 8 L3 3.5 Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 6 L8 9 M8 11 L8 11.5", strokeWidth: 2 })] }));
const triangleBody = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M8 2 L14 13 L2 13 Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 6 L8 9.5 M8 11 L8 11.5", strokeWidth: 2 })] }));
const packageBody = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M2 4.5 L8 1.5 L14 4.5 L14 11.5 L8 14.5 L2 11.5 Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 4.5 L8 7.5 L14 4.5 M8 7.5 L8 14.5" })] }));
exports.ICON_BODIES = {
    clock: clockBody,
    thermometer: thermometerBody,
    shield: shieldBody,
    triangle: triangleBody,
    package: packageBody,
};
const VALID = new Set([
    'clock',
    'thermometer',
    'shield',
    'triangle',
    'package',
]);
/**
 * Safely resolve a user-supplied icon name.
 * Falls back to `package` for unknown or missing values.
 */
function resolveIcon(raw) {
    if (typeof raw !== 'string') {
        return 'package';
    }
    const lowered = raw.toLowerCase().trim();
    return VALID.has(lowered) ? lowered : 'package';
}
/**
 * Return the JSX body (children of <svg>) for the given icon name.
 * Use inside a parent `<svg viewBox="0 0 16 16" stroke-width="1.5" ...>`.
 */
function getIconBody(name) {
    return exports.ICON_BODIES[name];
}
//# sourceMappingURL=icons.js.map