import { memo } from 'react';
import type { StatusCode } from '../types';
import { Chip, ChipCell } from '../styles';
import { STATUSES } from '../utils/statusRules';
import { colorFromKey } from '../utils/colorFromKey';
import { hexToRgba } from '../themeTokens';
import type { DsTokens } from '../themeTokens';

interface Props {
  status: StatusCode;
  tokens: DsTokens;
}

function StatusChipInner({ status, tokens }: Props) {
  const st = STATUSES[status];
  const color = colorFromKey(st.colorKey, tokens);
  return (
    <ChipCell>
      <Chip
        $color={color}
        $bg={hexToRgba(color, 0.15)}
        $border={hexToRgba(color, 0.35)}
      >
        <span className="dot" />
        {st.label}
      </Chip>
    </ChipCell>
  );
}

export default memo(StatusChipInner);
