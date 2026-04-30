import { memo, useCallback } from 'react';
import { SearchClear, SearchIcon, SearchInputEl, SearchWrap } from '../styles';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function SearchInputInner({ value, onChange, placeholder }: Props) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );
  return (
    <SearchWrap>
      <SearchIcon
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="6" cy="6" r="4" />
        <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
      </SearchIcon>
      <SearchInputEl
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? 'Поиск магазина…'}
        autoComplete="off"
        aria-label="Поиск магазина"
      />
      {value.length > 0 && (
        <SearchClear
          type="button"
          aria-label="Очистить"
          onClick={() => onChange('')}
        >
          <svg
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        </SearchClear>
      )}
    </SearchWrap>
  );
}

export default memo(SearchInputInner);
