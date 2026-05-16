import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { styled, useTheme } from '@superset-ui/core';
import { Input, Select, Button } from '@superset-ui/core/components';
import { ACCENT_PALETTE } from '../types';
import { LIGHT_TOKENS, DARK_TOKENS } from '../themeTokens';
import { isDarkTheme } from '../utils/isDarkTheme';
/* ── Стили через useTheme (reactive) ── */
const Wrap = styled.div `
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
`;
const RowBox = styled.div `
  display: grid;
  grid-template-columns: 1fr 180px 32px;
  gap: 8px;
  align-items: center;
`;
const SwatchRow = styled.span `
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;
const AccentLabel = styled.span `
  font-family: var(--m);
  font-size: var(--fs-micro);
`;
const Swatch = styled.span `
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
`;
const HelpText = styled.div `
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: var(--fs-micro);
  color: ${({ tone, theme }) => {
    const dark = isDarkTheme(theme?.colorBgContainer);
    const tokens = dark ? DARK_TOKENS : LIGHT_TOKENS;
    return tone === 'muted' ? tokens.g500 : tokens.wn;
}};
  font-style: ${({ tone }) => (tone === 'muted' ? 'italic' : 'normal')};
`;
function CategoryColorMapControl(props) {
    const { value, onChange } = props;
    const rows = Array.isArray(value) ? value : [];
    // Реактивно получаем токены по текущей теме Superset
    const theme = useTheme();
    const tokens = isDarkTheme(theme?.colorBgContainer)
        ? DARK_TOKENS
        : LIGHT_TOKENS;
    const duplicateNames = useMemo(() => {
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
    const updateRow = useCallback((idx, patch) => {
        const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
        onChange?.(next);
    }, [rows, onChange]);
    const addRow = useCallback(() => {
        const used = new Set(rows.map((r) => r.accent));
        const nextAccent = ACCENT_PALETTE.find((a) => !used.has(a)) ?? 'cSky';
        onChange?.([...rows, { name: '', accent: nextAccent }]);
    }, [rows, onChange]);
    const removeRow = useCallback((idx) => {
        onChange?.(rows.filter((_, i) => i !== idx));
    }, [rows, onChange]);
    const accentOptions = useMemo(() => ACCENT_PALETTE.map((a) => ({
        value: a,
        label: (_jsxs(SwatchRow, { children: [_jsx(Swatch, { color: tokens[a] }), _jsx(AccentLabel, { children: a })] })),
    })), [tokens]);
    const hasDuplicates = duplicateNames.size > 0;
    return (_jsxs(Wrap, { children: [rows.length === 0 && (_jsx(HelpText, { tone: "muted", children: "\u041D\u0435\u0442 \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0439 \u2014 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u043F\u043E\u043B\u0443\u0447\u0430\u0442 \u0446\u0432\u0435\u0442\u0430 \u0438\u0437 \u0430\u0432\u0442\u043E\u043F\u0430\u043B\u0438\u0442\u0440\u044B \u043F\u043E \u043F\u043E\u0440\u044F\u0434\u043A\u0443." })), rows.map((row, idx) => {
                const key = row.name.trim().toLowerCase();
                const isDup = key !== '' && duplicateNames.has(key);
                return (_jsxs(RowBox, { children: [_jsx(Input, { size: "small", placeholder: "\u0418\u043C\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u00AB\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F\u00BB)", value: row.name, status: isDup ? 'warning' : undefined, onChange: (e) => updateRow(idx, { name: e.target.value }), "aria-label": `Имя категории ${idx + 1}` }), _jsx(Select, { value: row.accent, options: accentOptions, onChange: (v) => updateRow(idx, { accent: v }), ariaLabel: `Цвет категории ${idx + 1}` }), _jsx(Button, { size: "small", type: "text", danger: true, onClick: () => removeRow(idx), "aria-label": `Удалить строку ${idx + 1}`, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: "\u00D7" })] }, idx));
            }), hasDuplicates && (_jsx(HelpText, { tone: "warn", children: "\u0414\u0443\u0431\u043B\u0438 \u0438\u043C\u0451\u043D \u0431\u0443\u0434\u0443\u0442 \u043F\u0440\u043E\u0438\u0433\u043D\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u2014 \u043F\u0435\u0440\u0432\u043E\u0435 \u0432\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u0432\u044B\u0438\u0433\u0440\u044B\u0432\u0430\u0435\u0442." })), _jsx(Button, { size: "small", type: "dashed", onClick: addRow, children: "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" })] }));
}
export default CategoryColorMapControl;
//# sourceMappingURL=CategoryColorMapControl.js.map