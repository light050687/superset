import { memo, useCallback } from 'react';
import {
  CardFooter,
  PaginationWrap,
  PageBtn,
  PageIndicator,
} from '../styles';
import { InfoHint, InfoHintTopRight } from './InfoHint';

interface FooterProps {
  /** Кол-во магазинов после фильтров (для расчёта диапазона страницы). */
  shown: number;
  /** Общее число магазинов до фильтров (для подсказки «отфильтровано из»). */
  total: number;
  /** Текущая страница (0-indexed, уже clamped в [0..pageCount-1]). */
  page: number;
  /** Размер страницы. */
  pageSize: number;
  /** Общее число страниц (минимум 1). */
  pageCount: number;
  /** Колбек смены страницы — компонент сам валидирует границы. */
  onPageChange: (page: number) => void;
}

function FooterHintsInner({
  shown,
  total,
  page,
  pageSize,
  pageCount,
  onPageChange,
}: FooterProps) {
  const from = shown === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, shown);

  const goPrev = useCallback(() => onPageChange(page - 1), [page, onPageChange]);
  const goNext = useCallback(() => onPageChange(page + 1), [page, onPageChange]);

  return (
    <CardFooter>
      <PaginationWrap aria-label="Пагинация">
        <PageBtn
          type="button"
          onClick={goPrev}
          disabled={page <= 0}
          aria-label="Предыдущая страница"
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7.5 2.5 3.5 6 7.5 9.5" />
          </svg>
        </PageBtn>
        <PageIndicator role="status" aria-live="polite">
          <span>
            <strong>{from}</strong>–<strong>{to}</strong>
          </span>{' '}
          <span className="pg-muted">из</span> <strong>{shown}</strong>
          {shown !== total && (
            <span className="pg-muted">
              {' '}(из {total})
            </span>
          )}
          {pageCount > 1 && (
            <span className="pg-muted">
              {' '}· стр. <strong>{page + 1}</strong>/{pageCount}
            </span>
          )}
        </PageIndicator>
        <PageBtn
          type="button"
          onClick={goNext}
          disabled={page >= pageCount - 1}
          aria-label="Следующая страница"
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4.5 2.5 8.5 6 4.5 9.5" />
          </svg>
        </PageBtn>
      </PaginationWrap>
    </CardFooter>
  );
}

export default memo(FooterHintsInner);

/** ControlsHint — i-кнопка для размещения в CardHead Controls. */
function ControlsHintInner() {
  return (
    <InfoHintTopRight>
      <InfoHint ariaLabel="Подсказка по управлению">
        <span className="hi"><kbd>Click</kbd> — кросс-фильтр</span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><kbd>Shift</kbd>+<kbd>Click</kbd> — диапазон</span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><kbd>Ctrl</kbd>+<kbd>Click</kbd> — детализация</span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><kbd>Esc</kbd> — закрыть</span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
      </InfoHint>
    </InfoHintTopRight>
  );
}

export const ControlsHint = memo(ControlsHintInner);
