import { FC } from 'react';
import type { LayerGroupState } from './hooks/useLayerGroups';
import { GroupWrapper, GroupRow, GroupIcon, GroupLabel, ToggleSwitch } from './styles';

interface LayerGroupsProps {
  groups: LayerGroupState[];
  onToggle: (groupId: string) => void;
}

const LayerGroups: FC<React.PropsWithChildren<LayerGroupsProps>> = ({ groups, onToggle }) => (
  <>
    {groups.map(group => (
      <GroupWrapper key={group.id}>
        <GroupRow
          type="button"
          onClick={() => onToggle(group.id)}
          role="switch"
          aria-checked={group.on}
          aria-label={`${group.label} — видимость слоя`}
        >
          <GroupIcon aria-hidden="true">{group.icon}</GroupIcon>
          <GroupLabel>{group.label}</GroupLabel>
          <ToggleSwitch on={group.on} aria-hidden="true" />
        </GroupRow>
      </GroupWrapper>
    ))}
  </>
);

export default LayerGroups;
