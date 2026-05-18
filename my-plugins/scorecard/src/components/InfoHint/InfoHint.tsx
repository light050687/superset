// scorecard-local: модальная версия InfoHint. Портал в document.body +
// backdrop + центрированная карточка. Mobile-friendly (любая ширина Card
// не ограничивает модалку). После approval — мигрировать в canonical.
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  HintTrigger,
  HintModalBackdrop,
  HintModalCard,
  HintOverlayClose,
  HintOverlayBody,
  HintOverlayTitle,
} from './styles';

function IconInfo(): JSX.Element {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6.5 L10 6.5" strokeWidth={2.2} />
      <path d="M10 9 L10 14" />
    </svg>
  );
}

function IconClose(): JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4 L12 12 M12 4 L4 12" />
    </svg>
  );
}

export interface InfoHintProps {
  ariaLabel: string;
  children: ReactNode;
  closeOnEscape?: boolean;
  /** Заголовок окна. DS §02: 14px UPPERCASE. Default — «Управление чартом». */
  title?: string;
}

export interface InfoHintHandle {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
}

export const InfoHint = forwardRef<InfoHintHandle, InfoHintProps>(
  function InfoHint(
    { ariaLabel, children, closeOnEscape = true, title = 'Управление чартом' },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        isOpen: () => open,
        open: () => setOpen(true),
        close: () => setOpen(false),
      }),
      [open],
    );

    useEffect(() => {
      if (!open || !closeOnEscape) return undefined;
      const onKey = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, closeOnEscape]);

    const handleToggle = (e: React.MouseEvent): void => {
      e.stopPropagation();
      setOpen((v) => !v);
    };

    return (
      <>
        <HintTrigger
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={handleToggle}
        >
          <IconInfo />
        </HintTrigger>
        {open &&
          typeof document !== 'undefined' &&
          createPortal(
            <HintModalBackdrop
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
            >
              <HintModalCard
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={(e) => e.stopPropagation()}
              >
                <HintOverlayClose
                  type="button"
                  aria-label="Закрыть"
                  onClick={() => setOpen(false)}
                >
                  <IconClose />
                </HintOverlayClose>
                {title && <HintOverlayTitle>{title}</HintOverlayTitle>}
                <HintOverlayBody>{children}</HintOverlayBody>
              </HintModalCard>
            </HintModalBackdrop>,
            document.body,
          )}
      </>
    );
  },
);
