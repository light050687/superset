// @canonical-version: 3.2.0
// @canonical-source: superset/my-plugins/_shared/info-hint/
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
  HintOverlay,
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

/* Ищем контейнер для HintOverlay. Приоритет — элемент с явным маркером
   [data-info-hint-container] (плагин помечает свой Card этим атрибутом).
   Fallback — ближайший positioned ancestor.
   Маркер важен потому что внутри плагина могут быть промежуточные
   position:relative блоки (например ComparisonSection scorecard'а имеет
   position:relative для своего ::before), и без явного маркера portal
   попадёт в них, а не в Card. */
function findHintContainer(el: HTMLElement): HTMLElement | null {
  const marked = el.closest<HTMLElement>('[data-info-hint-container]');
  if (marked) return marked;
  let p: HTMLElement | null = el.parentElement;
  while (p && p !== document.body) {
    const pos = window.getComputedStyle(p).position;
    if (pos === 'relative' || pos === 'absolute' || pos === 'fixed' || pos === 'sticky') {
      return p;
    }
    p = p.parentElement;
  }
  return null;
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
    const [container, setContainer] = useState<HTMLElement | null>(null);
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
      if (!open && triggerRef.current) {
        setContainer(findHintContainer(triggerRef.current));
      }
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
          container &&
          createPortal(
            <HintOverlay
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
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
            </HintOverlay>,
            container,
          )}
      </>
    );
  },
);
