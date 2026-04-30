import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { SortMode } from '../types';
import {
  IconDropdown,
  IconDropdownItem,
  IconDropdownTrigger,
  IconDropdownWrap,
} from '../styles';

interface SortDropdownProps {
  value: SortMode;
  onChange: (next: SortMode) => void;
  /** Disable the "delta" option when no previous-period metric is configured. */
  deltaDisabled?: boolean;
}

const OPTIONS: Array<{ id: SortMode; title: string; icon: React.ReactNode }> = [
  {
    id: 'sum',
    title: 'По сумме',
    icon: (
      <svg
        viewBox="0 0 16 14"
        width="16"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <line x1="2" y1="3" x2="14" y2="3" />
        <line x1="2" y1="7" x2="11" y2="7" />
        <line x1="2" y1="11" x2="7" y2="11" />
      </svg>
    ),
  },
  {
    id: 'delta',
    title: 'По дельте к прошлому периоду',
    icon: (
      <svg
        viewBox="0 0 16 14"
        width="16"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 11 L8 4 L13 11 Z" />
      </svg>
    ),
  },
  {
    id: 'share',
    title: 'По доле от общего',
    icon: (
      <svg
        viewBox="0 0 16 14"
        width="16"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="7" r="5" />
        <path d="M8 2 L8 7 L13 7" strokeWidth={1.6} />
      </svg>
    ),
  },
];

/**
 * Compact icon-only dropdown for switching sort mode (sum / delta / share).
 * Expands downward on click; closes on click-outside and Esc.
 */
const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  deltaDisabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(prev => !prev), []);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  const active = OPTIONS.find(o => o.id === value) ?? OPTIONS[0];

  return (
    <IconDropdownWrap ref={rootRef}>
      <IconDropdown $open={open}>
        <IconDropdownTrigger
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Сортировка: ${active.title}`}
          title="Сортировка"
          onClick={toggle}
        >
          {active.icon}
        </IconDropdownTrigger>
        {open && (
          <div role="listbox" aria-label="Сортировка">
            {OPTIONS.map(opt => {
              const isActive = opt.id === value;
              const disabled = opt.id === 'delta' && deltaDisabled;
              const disabledTitle = disabled
                ? 'Требуется «Метрика прошлого периода»'
                : opt.title;
              return (
                <IconDropdownItem
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={disabledTitle}
                  $active={isActive}
                  title={disabledTitle}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onChange(opt.id);
                    close();
                  }}
                >
                  {opt.icon}
                </IconDropdownItem>
              );
            })}
          </div>
        )}
      </IconDropdown>
    </IconDropdownWrap>
  );
};

export default memo(SortDropdown);
