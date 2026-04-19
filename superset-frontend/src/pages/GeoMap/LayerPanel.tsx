import { FC, useState } from 'react';
import type { LayerGroupState } from './hooks/useLayerGroups';
import LayerGroups from './LayerGroups';
import {
  PanelWrapper,
  PanelHeader,
  ToggleIcon,
  PanelBody,
} from './styles';

interface LayerPanelProps {
  groups: LayerGroupState[];
  onToggleGroup: (groupId: string) => void;
}

const LayerPanel: FC<LayerPanelProps> = ({ groups, onToggleGroup }) => {
  const [open, setOpen] = useState(true);

  return (
    <PanelWrapper role="region" aria-label="Слои карты">
      <PanelHeader
        type="button"
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
      >
        <span>🗂 Слои карты</span>
        <ToggleIcon collapsed={!open} aria-hidden="true">
          ▼
        </ToggleIcon>
      </PanelHeader>

      <PanelBody hidden={!open}>
        <LayerGroups groups={groups} onToggle={onToggleGroup} />
      </PanelBody>
    </PanelWrapper>
  );
};

export default LayerPanel;
