import { FC } from 'react';
import type { TooltipState } from './types';
import { TooltipWrapper, TooltipName, TooltipValue } from './styles';

interface MapTooltipProps {
  tooltip: TooltipState;
}

const MapTooltip: FC<React.PropsWithChildren<MapTooltipProps>> = ({
  tooltip,
}) => {
  if (!tooltip.visible) return null;

  return (
    <TooltipWrapper x={tooltip.x} y={tooltip.y} role="tooltip">
      <TooltipName>{tooltip.name}</TooltipName>
      {tooltip.value && (
        <TooltipValue>
          {tooltip.metricLabel
            ? `${tooltip.metricLabel}: ${tooltip.value}`
            : tooltip.value}
        </TooltipValue>
      )}
    </TooltipWrapper>
  );
};

export default MapTooltip;
