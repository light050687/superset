import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ModalBackdrop, ModalBox } from '../styles';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  wide?: boolean;
  themeMode: 'light' | 'dark';
  zIndex?: number;
  labelledBy?: string;
  children: React.ReactNode;
}

/**
 * Common modal wrapper: portal-mounted backdrop + box with shared styling.
 * Handles click-outside-to-close and ensures CSS custom properties exist in the
 * portal subtree via `rootCss` + `data-theme`.
 *
 * Focus trap/restore is intentionally minimal: we set initial focus on the
 * first focusable child and listen to Tab to prevent escaping. `Escape`
 * handling is done by the RankedBars parent (priority-aware for stacked
 * modals).
 */
const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  wide = false,
  themeMode,
  zIndex,
  labelledBy,
  children,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const previousActive = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previousActive.current = document.activeElement;
    const box = boxRef.current;
    if (box) {
      const focusable = box.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }
    return () => {
      const prev = previousActive.current;
      if (prev instanceof HTMLElement) {
        prev.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(evt: KeyboardEvent): void {
      if (evt.key !== 'Tab') return;
      const box = boxRef.current;
      if (!box) return;
      const focusables = Array.from(
        box.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (evt.shiftKey) {
        if (active === first || !box.contains(active)) {
          evt.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        evt.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <ModalBackdrop
      data-theme={themeMode}
      $zIndex={zIndex}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ModalBox
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        $wide={wide}
      >
        {children}
      </ModalBox>
    </ModalBackdrop>,
    document.body,
  );
};

export default ModalShell;
