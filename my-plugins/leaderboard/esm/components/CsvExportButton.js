import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { IconButton } from '../styles';
import { downloadCsv } from '../utils/csvExport';
function CsvExportButtonInner({ stores }) {
    return (_jsx(IconButton, { type: "button", title: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 CSV", "aria-label": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 CSV", onClick: () => downloadCsv(stores), children: _jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M7 1 L7 9 M4 6 L7 9 L10 6 M2 11 L12 11 L12 13 L2 13 Z" }) }) }));
}
export default memo(CsvExportButtonInner);
//# sourceMappingURL=CsvExportButton.js.map