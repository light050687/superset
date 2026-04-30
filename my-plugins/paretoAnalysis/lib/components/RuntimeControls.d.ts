import { ParetoState, Unit } from '../types';
export interface RuntimeControlsProps {
    state: ParetoState;
    onUnitChange: (unit: Unit) => void;
    onThresholdChange: (value: number) => void;
    onToggleTopA: () => void;
    onTogglePrev: () => void;
    hasPrevData: boolean;
}
/**
 * Runtime-контроли внутри чарта: unit toggle (₽/%), threshold slider,
 * Топ-A, Пред.период. Все управляемые, диспатчат наверх в useParetoState.
 *
 * Пред.период скрывается, если у данных нет valuePrev (hasPrevData=false).
 */
export default function RuntimeControls({ state, onUnitChange, onThresholdChange, onToggleTopA, onTogglePrev, hasPrevData, }: RuntimeControlsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RuntimeControls.d.ts.map