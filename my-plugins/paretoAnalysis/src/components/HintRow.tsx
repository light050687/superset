import { HintItem } from '../styles/styled';

/** Подсказка-строка «клик — фильтр · Ctrl+клик — разложение» в футере карточки. */
export default function HintRow() {
  return (
    <HintItem>
      <span className="hi">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" />
        </svg>
        <span>клик — фильтр</span>
      </span>
      <span className="hi">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M6 7 L8 9 L10 7" />
        </svg>
        <span>Ctrl+клик — разложение</span>
      </span>
    </HintItem>
  );
}
