/**
 * Минимальная декларация react-dom.
 * При сборке в Docker (superset-frontend) используются полные @types/react-dom.
 */
declare module 'react-dom' {
  import { ReactNode } from 'react';
  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
  ): ReactNode;
}
