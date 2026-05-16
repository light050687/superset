import { ComputedParetoItem, ComputedPareto, ThemeTokens } from '../types';
export interface DrillModalProps {
    item: ComputedParetoItem;
    computed: ComputedPareto;
    tokens: ThemeTokens;
    metricLabel: string;
    metricUnit: string;
    breakdownTitle: string;
    isDarkMode: boolean;
    onClose: () => void;
}
/**
 * Drill-модалка: summary grid + контекстный блок + «Разложение причин».
 * Через createPortal в document.body; обёртка ставит тот же data-theme,
 * чтобы CSS-переменные резолвились в корректной теме.
 */
export default function DrillModal({ item, computed, tokens, metricLabel, metricUnit, breakdownTitle, isDarkMode, onClose, }: DrillModalProps): import("react").ReactPortal;
//# sourceMappingURL=DrillModal.d.ts.map