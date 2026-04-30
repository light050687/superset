import {
  LegendRow,
  Lg,
  LgSwatch,
  LgLine,
  LgLabel,
  ZoneChipBtn,
} from '../styles/styled';
import { ParetoState, SeriesKind, ThemeTokens, Zone } from '../types';
import { zoneLegendLabel } from '../utils/zoneColors';

export interface ZoneLegendProps {
  state: ParetoState;
  tokens: ThemeTokens;
  metricLabel: string;
  onToggleZone: (zone: Zone) => void;
  onToggleSeries: (kind: SeriesKind) => void;
}

/** Легенда: 3 zone-chip как cross-filter + 2 toggle серий. */
export default function ZoneLegend({
  state,
  tokens,
  metricLabel,
  onToggleZone,
  onToggleSeries,
}: ZoneLegendProps) {
  return (
    <LegendRow role="group" aria-label="Легенда">
      {(['A', 'B', 'C'] as Zone[]).map(z => (
        <ZoneChipBtn
          key={z}
          active={state.zoneFilter === z}
          aria-pressed={state.zoneFilter === z}
          onClick={() => onToggleZone(z)}
          title={`Клик — фильтр по зоне ${z}`}
          type="button"
        >
          <LgSwatch
            color={
              z === 'A' ? tokens.dn : z === 'B' ? tokens.wn : tokens.g500
            }
          />
          <span>{zoneLegendLabel(z, state.threshold)}</span>
        </ZoneChipBtn>
      ))}
      <div className="sep" />
      <Lg
        off={!state.seriesVisible.bars}
        role="button"
        tabIndex={0}
        onClick={() => onToggleSeries('bars')}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') onToggleSeries('bars');
        }}
        title="Скрыть / показать бары"
      >
        <LgSwatch color={tokens.dn} />
        <LgLabel>{metricLabel}</LgLabel>
      </Lg>
      <Lg
        off={!state.seriesVisible.line}
        role="button"
        tabIndex={0}
        onClick={() => onToggleSeries('line')}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') onToggleSeries('line');
        }}
        title="Скрыть / показать линию"
      >
        <LgLine />
        <LgLabel>Кумулятивная %</LgLabel>
      </Lg>
    </LegendRow>
  );
}
