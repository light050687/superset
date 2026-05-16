import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useMemo } from 'react';
/**
 * Compact line chart (64×18 by default) with a dot on the last point.
 * Matches the visual spec from ref/ranked-bars-prototype.html.
 *
 * Renders nothing if `data` is empty.
 */
const Sparkline = ({ data, color, width = 64, height = 18, strokeWidth = 1.5, }) => {
    const svg = useMemo(() => {
        if (!data || data.length < 2)
            return null;
        const pad = 2;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const sx = (i) => pad + (i / (data.length - 1)) * (width - pad * 2);
        const sy = (v) => height - pad - ((v - min) / range) * (height - pad * 2);
        const path = data
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`)
            .join(' ');
        const lastX = sx(data.length - 1).toFixed(1);
        const lastY = sy(data[data.length - 1]).toFixed(1);
        return { path, lastX, lastY };
    }, [data, width, height]);
    if (!svg) {
        return null;
    }
    return (_jsxs("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, overflow: "visible", "aria-hidden": "true", children: [_jsx("path", { d: svg.path, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.9 }), _jsx("circle", { cx: svg.lastX, cy: svg.lastY, r: 2, fill: color, stroke: "var(--s)", strokeWidth: 1 })] }));
};
export default memo(Sparkline);
//# sourceMappingURL=Sparkline.js.map