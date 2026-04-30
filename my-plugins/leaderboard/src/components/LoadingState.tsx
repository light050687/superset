import { memo } from 'react';
import { SkeletonRow } from '../styles';
import { GRID_COLS, COLUMNS } from './columns';

/** Skeleton-состояние для таблицы. 6 заполняющих рядов с анимацией. */
function LoadingStateInner() {
  const rowsCount = 6;
  return (
    <div role="status" aria-busy="true" aria-label="Загрузка данных">
      {Array.from({ length: rowsCount }).map((_, i) => (
        <SkeletonRow key={i} $cols={GRID_COLS}>
          {COLUMNS.map((_, j) => (
            <div key={j} />
          ))}
        </SkeletonRow>
      ))}
    </div>
  );
}

export default memo(LoadingStateInner);
