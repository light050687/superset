"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const core_1 = require("@superset-ui/core");
const components_1 = require("@superset-ui/core/components");
const types_1 = require("../types");
const themeTokens_1 = require("../themeTokens");
const isDarkTheme_1 = require("../utils/isDarkTheme");
/* ── Стили через useTheme (reactive) ── */
const Wrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
`;
const RowBox = core_1.styled.div `
  display: grid;
  grid-template-columns: 1fr 180px 32px;
  gap: 8px;
  align-items: center;
`;
const SwatchRow = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;
const Swatch = core_1.styled.span `
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
`;
const HelpText = core_1.styled.div `
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 11px;
  color: ${({ tone, theme }) => {
    const dark = (0, isDarkTheme_1.isDarkTheme)(theme?.colorBgContainer);
    const tokens = dark ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    return tone === 'muted' ? tokens.g500 : tokens.wn;
}};
  font-style: ${({ tone }) => (tone === 'muted' ? 'italic' : 'normal')};
`;
function CategoryColorMapControl(props) {
    const { value, onChange } = props;
    const rows = Array.isArray(value) ? value : [];
    // Реактивно получаем токены по текущей теме Superset
    const theme = (0, core_1.useTheme)();
    const tokens = (0, isDarkTheme_1.isDarkTheme)(theme?.colorBgContainer)
        ? themeTokens_1.DARK_TOKENS
        : themeTokens_1.LIGHT_TOKENS;
    const duplicateNames = (0, react_1.useMemo)(() => {
        const counts = new Map();
        rows.forEach((r) => {
            const k = r.name.trim().toLowerCase();
            if (!k)
                return;
            counts.set(k, (counts.get(k) ?? 0) + 1);
        });
        const dups = new Set();
        counts.forEach((count, k) => {
            if (count > 1)
                dups.add(k);
        });
        return dups;
    }, [rows]);
    const updateRow = (0, react_1.useCallback)((idx, patch) => {
        const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
        onChange?.(next);
    }, [rows, onChange]);
    const addRow = (0, react_1.useCallback)(() => {
        const used = new Set(rows.map((r) => r.accent));
        const nextAccent = types_1.ACCENT_PALETTE.find((a) => !used.has(a)) ?? 'cSky';
        onChange?.([...rows, { name: '', accent: nextAccent }]);
    }, [rows, onChange]);
    const removeRow = (0, react_1.useCallback)((idx) => {
        onChange?.(rows.filter((_, i) => i !== idx));
    }, [rows, onChange]);
    const accentOptions = (0, react_1.useMemo)(() => types_1.ACCENT_PALETTE.map((a) => ({
        value: a,
        label: ((0, jsx_runtime_1.jsxs)(SwatchRow, { children: [(0, jsx_runtime_1.jsx)(Swatch, { color: tokens[a] }), (0, jsx_runtime_1.jsx)("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }, children: a })] })),
    })), [tokens]);
    const hasDuplicates = duplicateNames.size > 0;
    return ((0, jsx_runtime_1.jsxs)(Wrap, { children: [rows.length === 0 && ((0, jsx_runtime_1.jsx)(HelpText, { tone: "muted", children: "\u041D\u0435\u0442 \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0439 \u2014 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u043F\u043E\u043B\u0443\u0447\u0430\u0442 \u0446\u0432\u0435\u0442\u0430 \u0438\u0437 \u0430\u0432\u0442\u043E\u043F\u0430\u043B\u0438\u0442\u0440\u044B \u043F\u043E \u043F\u043E\u0440\u044F\u0434\u043A\u0443." })), rows.map((row, idx) => {
                const key = row.name.trim().toLowerCase();
                const isDup = key !== '' && duplicateNames.has(key);
                return ((0, jsx_runtime_1.jsxs)(RowBox, { children: [(0, jsx_runtime_1.jsx)(components_1.Input, { size: "small", placeholder: "\u0418\u043C\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u00AB\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F\u00BB)", value: row.name, status: isDup ? 'warning' : undefined, onChange: (e) => updateRow(idx, { name: e.target.value }), "aria-label": `Имя категории ${idx + 1}` }), (0, jsx_runtime_1.jsx)(components_1.Select, { value: row.accent, options: accentOptions, onChange: (v) => updateRow(idx, { accent: v }), ariaLabel: `Цвет категории ${idx + 1}` }), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "small", type: "text", danger: true, onClick: () => removeRow(idx), "aria-label": `Удалить строку ${idx + 1}`, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: "\u00D7" })] }, idx));
            }), hasDuplicates && ((0, jsx_runtime_1.jsx)(HelpText, { tone: "warn", children: "\u0414\u0443\u0431\u043B\u0438 \u0438\u043C\u0451\u043D \u0431\u0443\u0434\u0443\u0442 \u043F\u0440\u043E\u0438\u0433\u043D\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u2014 \u043F\u0435\u0440\u0432\u043E\u0435 \u0432\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u0432\u044B\u0438\u0433\u0440\u044B\u0432\u0430\u0435\u0442." })), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "small", type: "dashed", onClick: addRow, children: "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" })] }));
}
exports.default = CategoryColorMapControl;
//# sourceMappingURL=CategoryColorMapControl.js.map