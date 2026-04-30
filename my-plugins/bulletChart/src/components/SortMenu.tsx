import * as React from 'react';
import { IconDd, IconDdBtn, IconDdWrap } from '../styles';
import type { SortBy } from '../types';

interface SortMenuProps {
  value: SortBy;
  onChange: (v: SortBy) => void;
}

const SORT_ICONS: Record<SortBy, React.ReactNode> = {
  factDesc: (
    <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="2" y1="3" x2="14" y2="3" />
      <line x1="2" y1="7" x2="11" y2="7" />
      <line x1="2" y1="11" x2="7" y2="11" />
    </svg>
  ),
  factAsc: (
    <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="2" y1="3" x2="7" y2="3" />
      <line x1="2" y1="7" x2="11" y2="7" />
      <line x1="2" y1="11" x2="14" y2="11" />
    </svg>
  ),
  deltaPlanDesc: (
    <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 L8 4 L13 11 Z" />
    </svg>
  ),
  deltaPyDesc: (
    <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="7" r="5" />
      <path d="M8 2 L8 7 L13 7" strokeWidth="1.6" />
    </svg>
  ),
  storesDesc: (
    <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="3" height="8" />
      <rect x="6.5" y="3" width="3" height="10" />
      <rect x="11" y="7" width="3" height="6" />
    </svg>
  ),
  nameAsc: (
    <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4 L5 2 L7 4" />
      <line x1="5" y1="2" x2="5" y2="12" />
      <text x="9" y="7" fontFamily="monospace" fontSize="5">А</text>
      <text x="9" y="12" fontFamily="monospace" fontSize="5">Я</text>
    </svg>
  ),
};

const SORT_TITLES: Record<SortBy, string> = {
  factDesc: 'По факту (убывание)',
  factAsc: 'По факту (возрастание)',
  deltaPlanDesc: 'По дельте к плану',
  deltaPyDesc: 'По дельте к ПГ',
  storesDesc: 'По числу магазинов',
  nameAsc: 'По названию',
};

const SORT_ORDER: SortBy[] = [
  'factDesc',
  'factAsc',
  'deltaPlanDesc',
  'deltaPyDesc',
  'storesDesc',
  'nameAsc',
];

const SortMenu: React.FC<SortMenuProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Закрытие по клику вне
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Закрытие по Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <IconDdWrap ref={ref}>
      <IconDd open={open}>
        <IconDdBtn
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Сортировка: ${SORT_TITLES[value]}`}
          title={`Сортировка: ${SORT_TITLES[value]}`}
        >
          {SORT_ICONS[value]}
        </IconDdBtn>
        {open
          ? SORT_ORDER.filter(s => s !== value).map(s => (
              <IconDdBtn
                key={s}
                type="button"
                role="option"
                aria-selected={false}
                title={SORT_TITLES[s]}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
              >
                {SORT_ICONS[s]}
              </IconDdBtn>
            ))
          : null}
      </IconDd>
    </IconDdWrap>
  );
};

export default SortMenu;
