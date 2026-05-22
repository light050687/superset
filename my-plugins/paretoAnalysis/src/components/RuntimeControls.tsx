import {
  UnitToggle,
  UnitBtn,
  Chip,
  ThresholdWrap,
  ThresholdLabel,
  ThresholdValue,
  ThresholdRange,
} from '../styles/styled';
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
export default function RuntimeControls({
  state,
  onUnitChange,
  onThresholdChange,
  onToggleTopA,
  onTogglePrev,
  hasPrevData,
}: RuntimeControlsProps) {
  return (
    <>
      <ThresholdWrap title="Порог зоны A (Парето)">
        <ThresholdLabel>A</ThresholdLabel>
        <ThresholdRange
          type="range"
          min={50}
          max={95}
          step={5}
          value={state.threshold}
          onChange={e => onThresholdChange(parseInt(e.currentTarget.value, 10))}
          aria-label="Порог зоны A"
        />
        <ThresholdValue>{state.threshold}%</ThresholdValue>
      </ThresholdWrap>

      <Chip
        type="button"
        active={state.topAOnly}
        aria-pressed={state.topAOnly}
        onClick={onToggleTopA}
        title="Показать только зону A (критические категории)"
      >
        Топ-A
      </Chip>

      {hasPrevData && (
        <Chip
          type="button"
          active={state.prevOverlay}
          aria-pressed={state.prevOverlay}
          onClick={onTogglePrev}
          title="Показать прошлый период за текущими барами"
        >
          Пред. период
        </Chip>
      )}

      {/* ₽/% — последний перед ⓘ (требование UX-ревизии). */}
      <UnitToggle role="tablist" aria-label="Единицы измерения">
        <UnitBtn
          type="button"
          active={state.unit === 'rub'}
          aria-pressed={state.unit === 'rub'}
          onClick={() => onUnitChange('rub')}
          title="Значение в деньгах"
        >
          ₽
        </UnitBtn>
        <UnitBtn
          type="button"
          active={state.unit === 'pct'}
          aria-pressed={state.unit === 'pct'}
          onClick={() => onUnitChange('pct')}
          title="Процент от общей суммы"
        >
          %
        </UnitBtn>
      </UnitToggle>
    </>
  );
}
