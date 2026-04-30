import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TooltipBox } from '../styles';

export interface TooltipPayload {
  element: React.ReactNode;
  clientX: number;
  clientY: number;
  /** Theme mode passed from parent so portal root gets the same CSS vars. */
  themeMode: 'light' | 'dark';
}

interface TooltipProps {
  payload: TooltipPayload | null;
}

/**
 * Singleton tooltip rendered through a portal so z-index and clipping work
 * independently of the card DOM. Auto-flips near viewport edges.
 *
 * The portal host duplicates `data-theme` so CSS custom properties resolve
 * correctly even when rendered outside the plugin root.
 */
const Tooltip: React.FC<TooltipProps> = ({ payload }) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.setAttribute('data-rb-tooltip-root', 'true');
    document.body.appendChild(el);
    setHost(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!host) return;
    host.setAttribute('data-theme', payload?.themeMode ?? 'light');
  }, [host, payload?.themeMode]);

  useEffect(() => {
    if (!payload || !boxRef.current) return;
    const el = boxRef.current;
    const offset = 14;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    let x = payload.clientX + offset;
    let y = payload.clientY + offset;
    if (x + tw > window.innerWidth - 8) x = payload.clientX - tw - offset;
    if (y + th > window.innerHeight - 8) y = payload.clientY - th - offset;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [payload]);

  if (!host) return null;

  return createPortal(
    <TooltipBox
      ref={boxRef}
      role="tooltip"
      aria-hidden={payload == null}
      $visible={payload != null}
    >
      {payload?.element}
    </TooltipBox>,
    host,
  );
};

export default Tooltip;
