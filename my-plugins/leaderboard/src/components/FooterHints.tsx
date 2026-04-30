import { memo } from 'react';
import { CardFooter } from '../styles';

interface Props {
  shown: number;
  total: number;
}

function FooterHintsInner({ shown, total }: Props) {
  return (
    <CardFooter>
      <div className="hint">
        <span className="hint-item">
          <kbd>Click</kbd> — кросс-фильтр
        </span>
        <span className="hint-item">
          <kbd>Shift</kbd>+<kbd>Click</kbd> — диапазон
        </span>
        <span className="hint-item">
          <kbd>Ctrl</kbd>+<kbd>Click</kbd> — детализация
        </span>
        <span className="hint-item">
          <kbd>Esc</kbd> — закрыть
        </span>
      </div>
      <div role="status" aria-live="polite">
        Показано <span className="total-right">{shown}</span> из{' '}
        <span className="total-right">{total}</span>
      </div>
    </CardFooter>
  );
}

export default memo(FooterHintsInner);
