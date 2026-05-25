import React from 'react';
import 'dayjs/locale/ru';
import type { VelocityDivergingProps } from './types';
/**
 * Палитра DS 2.0 — ветка light/dark. Используем напрямую токены из
 * themeTokens.ts, а не читаем CSS-переменные через getComputedStyle,
 * чтобы избежать 2000 вызовов getComputedStyle на рендер (400 строк × 5 цветов).
 */
interface Palette {
    up: string;
    dn: string;
    wn: string;
    g50: string;
    g100: string;
    g200: string;
    g300: string;
    g400: string;
    g500: string;
    g600: string;
    g700: string;
    s: string;
    ink: string;
    cSky: string;
    cViolet: string;
    cTangerine: string;
    cFuchsia: string;
    cAmber: string;
    fontText: string;
    fontMono: string;
}
/**
 * Главный компонент.
 */
declare const VelocityDiverging: React.FC<VelocityDivergingProps>;
export default VelocityDiverging;
export type { Palette };
//# sourceMappingURL=VelocityDiverging.d.ts.map