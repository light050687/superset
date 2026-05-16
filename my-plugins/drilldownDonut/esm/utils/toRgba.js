/**
 * Преобразование hex → rgba. Повторяет `toRgba()` из прототипа (строки 219–225).
 *
 * Поддерживает #RGB, #RRGGBB, а также rgba()/rgb() на входе (для уже разрешённых
 * dark-токенов типа `rgba(0,0,0,.3)` — в этом случае возвращается строка как есть
 * c заменой альфа-канала).
 */
export function toRgba(color, alpha) {
    const a = Math.max(0, Math.min(1, alpha));
    if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
        const nums = color.match(/\d+(?:\.\d+)?/g);
        if (nums && nums.length >= 3) {
            const [r, g, b] = nums;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return color;
    }
    if (color.startsWith('#')) {
        let h = color.slice(1);
        if (h.length === 3) {
            h = h
                .split('')
                .map((c) => c + c)
                .join('');
        }
        if (h.length !== 6)
            return color;
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return color;
}
//# sourceMappingURL=toRgba.js.map