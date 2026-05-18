import { InfoHint, InfoHintTopRight } from './InfoHint';

/** Подсказка про управление — i-кнопка в правом нижнем углу карточки.
   InfoHintTopRight: inline-flex обёртка, размещается внутри Footer. */
export default function HintRow() {
  return (
    <InfoHintTopRight>
      <InfoHint ariaLabel="Подсказка по управлению">
        <span className="hi"><kbd>клик</kbd> — фильтр</span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><kbd>Ctrl</kbd>+<kbd>клик</kbd> — разложение</span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
      </InfoHint>
    </InfoHintTopRight>
  );
}
