import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { StoreCellEl } from '../styles';
function StoreCellInner({ data }) {
    if (data.isSegment) {
        return (_jsxs(StoreCellEl, { children: [_jsxs("span", { className: "store-code", children: [_jsx("span", { className: "code", children: data.code }), _jsx("span", { children: data.name })] }), _jsxs("span", { className: "store-meta", children: ["\u0421\u0435\u0433\u043C\u0435\u043D\u0442 \u00B7 \u0422\u041E ", data.toClass, " \u043C\u043B\u043D"] })] }));
    }
    return (_jsxs(StoreCellEl, { children: [_jsxs("span", { className: "store-code", children: [_jsx("span", { className: "code", children: data.code }), _jsx("span", { children: data.shortLabel })] }), _jsxs("span", { className: "store-meta", children: [data.city, " \u00B7 ", data.formatName, " \u00B7 \u0422\u041E ", data.toClass, "\u043C\u043B\u043D"] })] }));
}
export default memo(StoreCellInner);
//# sourceMappingURL=StoreCell.js.map