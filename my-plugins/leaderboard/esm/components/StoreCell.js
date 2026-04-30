import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { PinBtn, StoreCellEl } from '../styles';
function StoreCellInner({ data, pinned, onTogglePin }) {
    if (data.isSegment) {
        return (_jsxs(StoreCellEl, { children: [_jsxs("span", { className: "store-code", children: [_jsx("span", { className: "code", children: data.code }), _jsx("span", { children: data.name })] }), _jsxs("span", { className: "store-meta", children: ["\u0421\u0435\u0433\u043C\u0435\u043D\u0442 \u00B7 \u0422\u041E ", data.toClass, " \u043C\u043B\u043D"] })] }));
    }
    return (_jsxs(StoreCellEl, { children: [_jsxs("span", { className: "store-code", children: [_jsx("span", { className: "code", children: data.code }), _jsx("span", { children: data.shortLabel }), onTogglePin && (_jsx(PinBtn, { type: "button", "$active": !!pinned, "aria-label": pinned ? 'Открепить' : 'Закрепить', "aria-pressed": !!pinned, "data-action": "pin", onClick: e => {
                            e.stopPropagation();
                            onTogglePin();
                        }, children: _jsx("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M5 1 L9 1 L9 5 L10.5 6.5 L7.5 6.5 L7.5 10.5 L6 12 L4.5 10.5 L4.5 6.5 L1.5 6.5 L3 5 Z" }) }) }))] }), _jsxs("span", { className: "store-meta", children: [data.city, " \u00B7 ", data.formatName, " \u00B7 \u0422\u041E ", data.toClass, "\u043C\u043B\u043D"] })] }));
}
export default memo(StoreCellInner);
//# sourceMappingURL=StoreCell.js.map