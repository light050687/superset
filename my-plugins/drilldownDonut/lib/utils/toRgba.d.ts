/**
 * Преобразование hex → rgba. Повторяет `toRgba()` из прототипа (строки 219–225).
 *
 * Поддерживает #RGB, #RRGGBB, а также rgba()/rgb() на входе (для уже разрешённых
 * dark-токенов типа `rgba(0,0,0,.3)` — в этом случае возвращается строка как есть
 * c заменой альфа-канала).
 */
export declare function toRgba(color: string, alpha: number): string;
//# sourceMappingURL=toRgba.d.ts.map