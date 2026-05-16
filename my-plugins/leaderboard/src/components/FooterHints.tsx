import { memo } from 'react';
import { CardFooter } from '../styles';
import { InfoHint, InfoHintCorner } from './InfoHint';

interface Props {
  shown: number;
  total: number;
}

function FooterHintsInner({ shown, total }: Props) {
  return (
    <CardFooter>
      <div role="status" aria-live="polite">
        Показано <span className="total-right">{shown}</span> из{' '}
        <span className="total-right">{total}</span>
      </div>
      <InfoHintCorner>
        <InfoHint ariaLabel="Подсказка по управлению">
          <span className="hi"><span>Click — кросс-фильтр</span></span>
          <span className="hi-sep" aria-hidden="true" />
          <span className="hi"><span>Shift+Click — диапазон</span></span>
          <span className="hi-sep" aria-hidden="true" />
          <span className="hi"><span>Ctrl+Click — детализация</span></span>
          <span className="hi-sep" aria-hidden="true" />
          <span className="hi"><span>Esc — закрыть</span></span>
          <span className="hi-sep" aria-hidden="true" />
          <span className="hi"><span>Right Click — меню действий</span></span>
        </InfoHint>
      </InfoHintCorner>
    </CardFooter>
  );
}

export default memo(FooterHintsInner);
