import { memo } from 'react';
import { nf0 } from '../utils/formatRussian';
import { Cell, NumCell } from '../styles';

interface Props {
  value: number;
  unit?: string;
}

function NumberCellInner({ value, unit = '₽' }: Props) {
  return (
    <Cell $align="right">
      <NumCell>
        {nf0(value)}
        <span className="u">{unit}</span>
      </NumCell>
    </Cell>
  );
}

export default memo(NumberCellInner);
