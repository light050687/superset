import React, { memo } from 'react';
import type { UnitMode } from '../types';
import { UnitToggleEl } from '../styles';

interface UnitToggleProps {
  value: UnitMode;
  onChange: (next: UnitMode) => void;
}

/** Simple segmented toggle between ₽ and %. Used in card header. */
const UnitToggle: React.FC<UnitToggleProps> = ({ value, onChange }) => (
  <UnitToggleEl role="tablist" aria-label="Единицы">
    <button
      type="button"
      className={value === 'rub' ? 'on' : ''}
      aria-pressed={value === 'rub'}
      aria-label="Единицы: рубли"
      onClick={() => onChange('rub')}
    >
      ₽
    </button>
    <button
      type="button"
      className={value === 'pct' ? 'on' : ''}
      aria-pressed={value === 'pct'}
      aria-label="Единицы: проценты"
      onClick={() => onChange('pct')}
    >
      %
    </button>
  </UnitToggleEl>
);

export default memo(UnitToggle);
