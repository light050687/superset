import { ThemeTokens, Zone } from '../types';
/**
 * Семантика DS 2.0:
 *   A (0..threshold)  — критические, --dn (красный)
 *   B (threshold..95) — важные,     --wn (жёлтый)
 *   C (95..100)       — хвост,      --g500 (серый)
 */
export declare function zoneColor(zone: Zone, tokens: ThemeTokens): string;
export declare function zoneLabel(zone: Zone): string;
/** Короткая подпись для легенды «A · 0–N%». */
export declare function zoneLegendLabel(zone: Zone, threshold: number): string;
/** Конвертация hex → rgba с заданной альфой (для shadow и подложек пилюль). */
export declare function toRgba(hex: string, alpha: number): string;
//# sourceMappingURL=zoneColors.d.ts.map