import { memo } from 'react';
import { StateContainer } from '../styles';

interface Props {
  message?: string;
  onRetry?: () => void;
}

function ErrorStateInner({ message, onRetry }: Props) {
  return (
    <StateContainer role="alert" aria-live="assertive">
      <svg
        className="state-icon"
        viewBox="0 0 48 48"
        fill="none"
        stroke="var(--dn)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="24" cy="24" r="20" />
        <line x1="24" y1="14" x2="24" y2="26" />
        <line x1="24" y1="32" x2="24" y2="33" />
      </svg>
      <div className="state-title" style={{ color: 'var(--dn)' }}>
        Ошибка загрузки данных
      </div>
      {message && <div className="state-desc">{message}</div>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '8px 14px',
            background: 'var(--ink)',
            color: 'var(--on-accent)',
            border: 'none',
            borderRadius: 6,
            fontFamily: 'var(--m)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            minHeight: 32,
          }}
        >
          Повторить
        </button>
      )}
    </StateContainer>
  );
}

export default memo(ErrorStateInner);
