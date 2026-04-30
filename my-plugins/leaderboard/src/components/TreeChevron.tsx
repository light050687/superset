import { memo } from 'react';
import { ExBtn, TreeBullet, TreeCellEl } from '../styles';

interface Props {
  level: number;
  expandable: boolean;
  expanded: boolean;
  onToggle?: () => void;
}

function TreeChevronInner({ level, expandable, expanded, onToggle }: Props) {
  if (!expandable) {
    return (
      <TreeCellEl $level={level}>
        <TreeBullet aria-hidden />
      </TreeCellEl>
    );
  }
  return (
    <TreeCellEl $level={level}>
      <ExBtn
        type="button"
        $open={expanded}
        aria-label={expanded ? 'Свернуть' : 'Раскрыть'}
        aria-expanded={expanded}
        onClick={e => {
          e.stopPropagation();
          onToggle?.();
        }}
      >
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 1 L7 5 L3 9" />
        </svg>
      </ExBtn>
    </TreeCellEl>
  );
}

export default memo(TreeChevronInner);
