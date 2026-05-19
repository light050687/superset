import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Toolbar,
  TbBtn,
  TbDivider,
  SelectDd,
  SelectDdItem,
  SelectDdWrap,
  SearchInput,
  SearchSelectBtn,
  SearchWrap,
} from './styles';

type Mode = 'rect' | 'lasso' | null;
export type SelectAction = 'rect' | 'lasso' | 'worst5' | 'best5' | 'bad' | 'good';

interface ToolbarProps {
  selectMode: Mode;
  hasFilters: boolean;
  onAction: (action: SelectAction) => void;
  onReset: () => void;
  onClear: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchMatchesCount: number;
  onSearchSelect: () => void;
}

/** Toolbar: Reset · dropdown (6 icon-only actions) · Clear · Search */
const ToolbarBar: React.FC<ToolbarProps> = ({
  selectMode,
  hasFilters,
  onAction,
  onReset,
  onClear,
  searchQuery,
  onSearchChange,
  searchMatchesCount,
  onSearchSelect,
}) => {
  const [ddOpen, setDdOpen] = useState(false);
  const ddWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ddOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ddWrapRef.current) return;
      if (!ddWrapRef.current.contains(e.target as Node)) setDdOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [ddOpen]);

  const pick = useCallback(
    (action: SelectAction) => {
      onAction(action);
      setDdOpen(false);
    },
    [onAction],
  );

  return (
    <>
      <Toolbar role="toolbar" aria-label="Инструменты чарта">
        <TbBtn onClick={onReset} title="Сбросить вид" type="button" aria-label="Сбросить вид">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 7 A5 5 0 1 1 7 12" />
            <path d="M2 3 L2 7 L6 7" />
          </svg>
        </TbBtn>

        <TbDivider />

        <SelectDdWrap ref={ddWrapRef}>
          <TbBtn
            className={selectMode || ddOpen ? 'on' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDdOpen((v) => !v);
            }}
            title="Инструменты выделения"
            type="button"
            aria-label="Инструменты выделения"
            aria-expanded={ddOpen}
            aria-haspopup="menu"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3 L3 11 L6 8.5 L7.5 12 L9 11 L7.5 8 L11 7.5 Z" />
            </svg>
          </TbBtn>

          <SelectDd data-open={ddOpen ? 'true' : 'false'} role="menu" data-icon-only="true">
            <SelectDdItem
              className={selectMode === 'rect' ? 'on' : ''}
              onClick={(e) => {
                e.stopPropagation();
                pick('rect');
              }}
              role="menuitem"
              type="button"
              title="Прямоугольное выделение"
              aria-label="Прямоугольное выделение"
            >
              <span className="sdd-icon">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2">
                  <rect x="2" y="3" width="10" height="8" rx="1" />
                </svg>
              </span>
            </SelectDdItem>
            <SelectDdItem
              className={selectMode === 'lasso' ? 'on' : ''}
              onClick={(e) => {
                e.stopPropagation();
                pick('lasso');
              }}
              role="menuitem"
              type="button"
              title="Лассо"
              aria-label="Лассо"
            >
              <span className="sdd-icon">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4 C3 2 11 2 11 5 C11 7 6 8 6 10 C6 11 7 11.5 7 11.5" />
                  <circle cx="6.5" cy="12.5" r="0.8" fill="currentColor" />
                </svg>
              </span>
            </SelectDdItem>

            <div style={{ height: 1, background: 'var(--g200)', margin: '4px 6px' }} />

            <SelectDdItem
              onClick={(e) => {
                e.stopPropagation();
                pick('worst5');
              }}
              role="menuitem"
              type="button"
              title="Топ-5 худших"
              aria-label="Выбрать топ-5 худших"
            >
              <span className="sdd-icon">
                <svg viewBox="0 0 14 14" fill="currentColor" stroke="none">
                  <path d="M7 1 L8.8 5 L13 5.5 L9.9 8.5 L10.7 12.7 L7 10.5 L3.3 12.7 L4.1 8.5 L1 5.5 L5.2 5 Z" />
                </svg>
              </span>
            </SelectDdItem>
            <SelectDdItem
              onClick={(e) => {
                e.stopPropagation();
                pick('best5');
              }}
              role="menuitem"
              type="button"
              title="Топ-5 лучших"
              aria-label="Выбрать топ-5 лучших"
            >
              <span className="sdd-icon">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
                  <path d="M7 1 L8.8 5 L13 5.5 L9.9 8.5 L10.7 12.7 L7 10.5 L3.3 12.7 L4.1 8.5 L1 5.5 L5.2 5 Z" />
                </svg>
              </span>
            </SelectDdItem>
            <SelectDdItem
              onClick={(e) => {
                e.stopPropagation();
                pick('bad');
              }}
              role="menuitem"
              type="button"
              title="Хуже плана"
              aria-label="Выбрать магазины хуже плана"
            >
              <span className="sdd-icon">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 2 L13 12 L1 12 Z" />
                  <line x1="7" y1="6" x2="7" y2="9" />
                  <line x1="7" y1="11" x2="7" y2="11.5" />
                </svg>
              </span>
            </SelectDdItem>
            <SelectDdItem
              onClick={(e) => {
                e.stopPropagation();
                pick('good');
              }}
              role="menuitem"
              type="button"
              title="Лучше плана"
              aria-label="Выбрать магазины лучше плана"
            >
              <span className="sdd-icon">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8 L5.5 11 L12 4" />
                </svg>
              </span>
            </SelectDdItem>
          </SelectDd>
        </SelectDdWrap>

        {hasFilters && (
          <TbBtn
            className="clear"
            onClick={onClear}
            title="Сбросить выделение"
            type="button"
            aria-label="Сбросить выделение"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="3" x2="11" y2="11" />
              <line x1="11" y1="3" x2="3" y2="11" />
            </svg>
          </TbBtn>
        )}
      </Toolbar>

      <SearchWrap className={searchQuery.length > 0 ? 'has-value' : ''}>
        <svg className="search-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="6" cy="6" r="4" />
          <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
        </svg>
        <SearchInput
          type="text"
          placeholder="Поиск объекта…"
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Поиск по имени объекта"
        />
        <button
          type="button"
          className="search-clear"
          onClick={() => onSearchChange('')}
          aria-label="Очистить"
        >
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        </button>
      </SearchWrap>
      <SearchSelectBtn
        type="button"
        className={searchMatchesCount > 0 ? 'visible' : ''}
        onClick={onSearchSelect}
        title="Применить найденное как фильтр"
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6 L5 9 L10 3" />
        </svg>
        <span>Выбрать {searchMatchesCount}</span>
      </SearchSelectBtn>
    </>
  );
};

export default ToolbarBar;
