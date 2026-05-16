/**
 * W3C luminance check на theme.colorBgContainer.
 * Повторяет логику kpiCard transformProps:566 — порог 128.
 * Если токен отсутствует или формат не поддерживается, возвращаем false (light).
 */
export function isDarkTheme(colorBgContainer) {
    if (!colorBgContainer || typeof colorBgContainer !== 'string')
        return false;
    const bg = colorBgContainer.trim();
    if (!bg.startsWith('#'))
        return false;
    const hex = bg.replace('#', '');
    if (hex.length < 6)
        return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n)))
        return false;
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
//# sourceMappingURL=isDarkTheme.js.map