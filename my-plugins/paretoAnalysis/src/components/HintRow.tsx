import { InfoHint, InfoHintCorner } from './InfoHint';

/** Подсказка про управление — i-иконка в правом нижнем углу карточки.
   InfoHintCorner: absolute positioning, должен рендериться внутри Card
   с position:relative (parent ParetoCard). */
export default function HintRow() {
  return (
    <InfoHintCorner>
      <InfoHint ariaLabel="Подсказка по управлению">
        <span className="hi"><span>клик — фильтр</span></span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><span>Ctrl+клик — разложение</span></span>
        <span className="hi-sep" aria-hidden="true" />
        <span className="hi"><span>Right Click — меню действий</span></span>
      </InfoHint>
    </InfoHintCorner>
  );
}
