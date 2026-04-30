import { memo, useEffect, useRef, useState } from 'react';
import { CountBadge, DdItem, DdMenu, DdTrigger, DdWrap } from '../styles';

export interface DropdownOption {
  key: string;
  label: string;
  color?: string;
  count?: number;
}

interface Props {
  label: string;
  options: DropdownOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  /** Для синхронизации — если родитель хочет закрыть меню. */
  externallyClosed?: boolean;
}

/**
 * Универсальный multi-select dropdown для Status/Format.
 * Закрывается кликом вне и Esc.
 */
function MultiSelectDropdownInner({
  label,
  options,
  selected,
  onToggle,
  externallyClosed,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externallyClosed) setOpen(false);
  }, [externallyClosed]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <DdWrap ref={wrapRef}>
      <DdTrigger
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
          <path d="M2 4 L6 8 L10 4" />
        </svg>
        <span>{label}</span>
        {selected.size > 0 && <CountBadge>{selected.size}</CountBadge>}
      </DdTrigger>
      <DdMenu $open={open} role="listbox">
        {options.map(opt => {
          const active = selected.has(opt.key);
          return (
            <DdItem
              key={opt.key}
              type="button"
              $active={active}
              role="option"
              aria-selected={active}
              onClick={e => {
                e.stopPropagation();
                onToggle(opt.key);
              }}
            >
              <span className="dd-check">
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 5 L4 7 L8 3" />
                </svg>
              </span>
              {opt.color && (
                <span
                  className="dd-item-dot"
                  style={{ background: opt.color }}
                />
              )}
              <span className="dd-item-label">{opt.label}</span>
              {opt.count !== undefined && (
                <span className="dd-item-count">{opt.count}</span>
              )}
            </DdItem>
          );
        })}
      </DdMenu>
    </DdWrap>
  );
}

export default memo(MultiSelectDropdownInner);
