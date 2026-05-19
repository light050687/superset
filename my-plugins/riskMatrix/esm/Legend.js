import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { LegendItem } from './styles';
const LegendList = ({ formats, hiddenFormats, onToggle }) => (_jsx(_Fragment, { children: formats.map((f) => {
        const off = hiddenFormats.has(f.id);
        return (_jsxs(LegendItem, { className: off ? 'off' : '', onClick: (e) => onToggle(f.id, e.ctrlKey || e.metaKey), type: "button", "aria-pressed": !off, "aria-label": `${f.name} — ${off ? 'скрыт' : 'видим'}`, children: [_jsx("span", { className: "lg-dot", style: { background: f.color } }), _jsx("span", { className: "lg-l", children: f.name })] }, f.id));
    }) }));
export default LegendList;
//# sourceMappingURL=Legend.js.map