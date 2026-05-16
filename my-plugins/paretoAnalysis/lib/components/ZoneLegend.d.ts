import { ParetoState, SeriesKind, ThemeTokens, Zone } from '../types';
export interface ZoneLegendProps {
    state: ParetoState;
    tokens: ThemeTokens;
    metricLabel: string;
    onToggleZone: (zone: Zone) => void;
    onToggleSeries: (kind: SeriesKind) => void;
}
/** Легенда: 3 zone-chip как cross-filter + 2 toggle серий. */
export default function ZoneLegend({ state, tokens, metricLabel, onToggleZone, onToggleSeries, }: ZoneLegendProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ZoneLegend.d.ts.map