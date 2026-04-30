import React from 'react';
import { FormatMeta } from './types';
import { LegendItem } from './styles';

interface LegendListProps {
  formats: FormatMeta[];
  hiddenFormats: Set<string>;
  onToggle: (id: string) => void;
}

const LegendList: React.FC<LegendListProps> = ({ formats, hiddenFormats, onToggle }) => (
  <>
    {formats.map((f) => {
      const off = hiddenFormats.has(f.id);
      return (
        <LegendItem
          key={f.id}
          className={off ? 'off' : ''}
          onClick={() => onToggle(f.id)}
          type="button"
          aria-pressed={!off}
          aria-label={`${f.name} — ${off ? 'скрыт' : 'видим'}`}
        >
          <span className="lg-dot" style={{ background: f.color }} />
          <span className="lg-l">{f.name}</span>
        </LegendItem>
      );
    })}
  </>
);

export default LegendList;
