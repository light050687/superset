import * as React from 'react';
import { createPortal } from 'react-dom';
import { IconDdBtn, IconDdWrap } from '../styles';
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
      <text x="9" y="7" fontFamily="'JetBrains Mono', monospace" fontSize="5">А</text>
      <text x="9" y="12" fontFamily="'JetBrains Mono', monospace" fontSize="5">Я</text>
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
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  /* Portal в body — обходит overflow:hidden и stacking-контексты от hero-чисел.
     Position computed от trigger. Closes: outside-click + Escape + scroll. */
  React.useEffect(() => {
    if (!open) return undefined;
    const update = (): void => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ top: r.bottom + 4, left: r.left });
    };
    update();
    const outside = (e: MouseEvent): void => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('.bc-sort-portal') || t === triggerRef.current || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <IconDdWrap>
      <IconDdBtn
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Сортировка: ${SORT_TITLES[value]}`}
        title={`Сортировка: ${SORT_TITLES[value]}`}
        style={{
          width: 32,
          height: 30,
          background: 'var(--g100)',
          border: `1px solid ${open ? 'var(--g300)' : 'var(--g200)'}`,
          borderRadius: 6,
        }}
      >
        {SORT_ICONS[value]}
      </IconDdBtn>
      {open && createPortal(
        <div
          className="bc-sort-portal"
          role="listbox"
          aria-label="Сортировка"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            width: 32,
            background: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 10px 28px rgba(15,17,20,.15)',
          }}
        >
          {SORT_ORDER.filter(s => s !== value).map(s => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={false}
              title={SORT_TITLES[s]}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 30,
                background: 'transparent',
                border: 'none',
                color: '#0F1114',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E5E7EB'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {SORT_ICONS[s]}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </IconDdWrap>
  );
};

export default SortMenu;
