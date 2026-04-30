import { useMemo } from 'react';
import { useTheme } from '@superset-ui/core';
import { DARK_TOKENS, LIGHT_TOKENS, toCssVars, } from '../themeTokens';
/** Грубая оценка luminance для hex/rgb-цвета. */
function isDarkColor(input) {
    if (!input)
        return false;
    const val = input.trim();
    if (val.startsWith('#')) {
        const h = val.slice(1);
        const full = h.length === 3
            ? h
                .split('')
                .map(c => c + c)
                .join('')
            : h;
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) / 255 < 0.5;
    }
    const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
        const [, r, g, b] = m;
        return (Number(r) * 0.299 + Number(g) * 0.587 + Number(b) * 0.114) / 255 < 0.5;
    }
    return false;
}
/**
 * Возвращает DS 2.0 токены и набор CSS custom properties для root-контейнера.
 * Светлый/тёмный режим определяется по фону Superset-темы.
 *
 * Правило CLAUDE.md: "ВСЕГДА useTheme() для цветов/шрифтов. Никогда не хардкодить".
 * Базовые цвета (bg, ink, border) мерджим из Superset theme, остальные
 * берём из наших DS 2.0 констант — они живут в themeTokens.ts единой точкой.
 */
export function useDsThemeTokens() {
    const theme = useTheme();
    return useMemo(() => {
        const bg = theme?.colorBgContainer;
        const dark = isDarkColor(bg);
        const base = dark ? DARK_TOKENS : LIGHT_TOKENS;
        /* Минимально подмешиваем фон/текст из Superset, если заданы */
        const merged = {
            ...base,
            bg: bg ?? base.bg,
            ink: theme?.colorText ?? base.ink,
        };
        return {
            tokens: merged,
            cssVars: toCssVars(merged),
            isDark: dark,
        };
    }, [theme]);
}
//# sourceMappingURL=useDsThemeTokens.js.map