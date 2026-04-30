import { memo } from 'react';
import { StateContainer } from '../styles';

interface Props {
  title?: string;
  description?: string;
}

/** Красивое пустое состояние с иконкой и пояснением. DS 2.0: 6 состояний. */
function EmptyStateInner({
  title = 'Нет данных для отображения',
  description = 'Измените фильтры или проверьте соответствие колонок в настройках плагина. ' +
    'Ожидаемые поля dataset: store_id, store_name, city, format, format_name, ' +
    'division, to_class, writeoff_pct, shrinkage_pct, plan_writeoff_pct, ' +
    'plan_shrinkage_pct, avg_writeoff_rub, avg_shrinkage_check_rub.',
}: Props) {
  return (
    <StateContainer role="status" aria-live="polite">
      <svg
        className="state-icon"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="6" y="10" width="36" height="28" rx="3" />
        <line x1="6" y1="18" x2="42" y2="18" />
        <line x1="14" y1="26" x2="26" y2="26" />
        <line x1="14" y1="32" x2="22" y2="32" />
      </svg>
      <div className="state-title">{title}</div>
      <div className="state-desc">{description}</div>
    </StateContainer>
  );
}

export default memo(EmptyStateInner);
