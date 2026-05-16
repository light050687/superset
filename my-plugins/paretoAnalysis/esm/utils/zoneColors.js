/**
 * Семантика DS 2.0:
 *   A (0..threshold)  — критические, --dn (красный)
 *   B (threshold..95) — важные,     --wn (жёлтый)
 *   C (95..100)       — хвост,      --g500 (серый)
 */
export function zoneColor(zone, tokens) {
    if (zone === 'A')
        return tokens.dn;
    if (zone === 'B')
        return tokens.wn;
    return tokens.g500;
}
export function zoneLabel(zone) {
    if (zone === 'A')
        return 'A · критическая';
    if (zone === 'B')
        return 'B · важная';
    return 'C · хвост';
}
/** Короткая подпись для легенды «A · 0–N%». */
export function zoneLegendLabel(zone, threshold) {
    if (zone === 'A')
        return `A · 0–${threshold}%`;
    if (zone === 'B')
        return `B · ${threshold}–95%`;
    return 'C · 95–100%';
}
/** Конвертация hex → rgba с заданной альфой (для shadow и подложек пилюль). */
export function toRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6)
        return hex;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
        return hex;
    }
    return `rgba(${r},${g},${b},${alpha})`;
}
//# sourceMappingURL=zoneColors.js.map