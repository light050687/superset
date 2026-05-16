import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback } from 'react';
import { SearchClear, SearchIcon, SearchInputEl, SearchWrap } from '../styles';
function SearchInputInner({ value, onChange, placeholder }) {
    const handleChange = useCallback((e) => onChange(e.target.value), [onChange]);
    return (_jsxs(SearchWrap, { children: [_jsxs(SearchIcon, { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": true, children: [_jsx("circle", { cx: "6", cy: "6", r: "4" }), _jsx("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), _jsx(SearchInputEl, { type: "text", value: value, onChange: handleChange, placeholder: placeholder ?? 'Поиск магазина…', autoComplete: "off", "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430" }), value.length > 0 && (_jsx(SearchClear, { type: "button", "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", onClick: () => onChange(''), children: _jsxs("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), _jsx("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) }))] }));
}
export default memo(SearchInputInner);
//# sourceMappingURL=SearchInput.js.map