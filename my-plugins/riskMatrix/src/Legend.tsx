import React from 'react';
import { FormatMeta } from './types';
import { LegendItem } from './styles';

interface LegendListProps {
  formats: FormatMeta[];
  hiddenFormats: Set<string>;
  // solo=true когда зажат Ctrl/Meta — handler выбирает только этот формат
  // (повторный Ctrl+Click на тот же id в solo-режиме → reset, показать все).
  onToggle: (id: string, solo: boolean) => void;
}

const LegendList: React.FC<LegendListProps> = ({ formats, hiddenFormats, onToggle }) => (
  <>
    {formats.map((f) => {
      const off = hiddenFormats.has(f.id);
      return (
        <LegendItem
          key={f.id}
          className={off ? 'off' : ''}
          onClick={(e) => onToggle(f.id, e.ctrlKey || e.metaKey)}
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
