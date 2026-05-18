import { memo } from 'react';
import { CardFooter } from '../styles';
import { InfoHint, InfoHintTopRight } from './InfoHint';

interface FooterProps {
  shown: number;
  total: number;
}

function FooterHintsInner({ shown, total }: FooterProps) {
  return (
    <CardFooter>
      <div role="status" aria-live="polite">
        Показано <span className="total-right">{shown}</span> из{' '}
        <span className="total-right">{total}</span>
      </div>
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
