import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Toolbar,
  ToolbarRow,
  TbBtn,
  SelectDd,
  SelectDdMenu,
  SelectDdItem,
  SelectDdWrap,
  SearchInput,
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
}

/** Toolbar: 3 видимых капсулы — Reset, Mode-Select dropdown (rect/lasso),
    Focus dropdown (worst5/best5/bad/good). Clear появляется условно как 4-я.
    Dropdown pattern из metricTimeSeries: trigger+options в одной капсуле,
    Panel расширяется вниз absolute. */
const ToolbarBar: React.FC<ToolbarProps> = ({
  selectMode,
  hasFilters,
  onAction,
  onReset,
  onClear,
  searchQuery,
  onSearchChange,
}) => {
  const [modeOpen, setModeOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const modeWrapRef = useRef<HTMLDivElement | null>(null);
  const focusWrapRef = useRef<HTMLDivElement | null>(null);

  // Closer-on-outside-click: один глобальный listener закрывает оба dropdown'a
  // если клик произошёл вне их Wrap.
  useEffect(() => {
    if (!modeOpen && !focusOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modeOpen && modeWrapRef.current && !modeWrapRef.current.contains(target)) {
        setModeOpen(false);
      }
      if (focusOpen && focusWrapRef.current && !focusWrapRef.current.contains(target)) {
        setFocusOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [modeOpen, focusOpen]);

  const pickMode = useCallback(
    (action: SelectAction) => {
      onAction(action);
      setModeOpen(false);
    },
    [onAction],
  );
  const pickFocus = useCallback(
    (action: SelectAction) => {
      onAction(action);
      setFocusOpen(false);
    },
    [onAction],
  );

  return (
    <>
      <ToolbarRow>
        <Toolbar role="toolbar" aria-label="Сброс вида">
          <TbBtn onClick={onReset} title="Сбросить вид" type="button" aria-label="Сбросить вид">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7 A5 5 0 1 1 7 12" />
              <path d="M2 3 L2 7 L6 7" />
            </svg>
          </TbBtn>
        </Toolbar>

        {/* Mode-Select dropdown: rect / lasso. SelectDd сам capsule (border,
            bg, radius — match Toolbar), внешний Toolbar wrapper не нужен. */}
        <SelectDdWrap ref={modeWrapRef} aria-label="Режим выделения">
            <SelectDd data-open={modeOpen ? 'true' : 'false'} role="menu">
              <TbBtn
                className={selectMode ? 'on' : ''}
                onClick={(e) => {
                  e.stopPropagation();
                  setModeOpen((v) => !v);
                  setFocusOpen(false);
                }}
                title="Режим выделения"
                type="button"
                aria-label="Режим выделения"
                aria-expanded={modeOpen}
                aria-haspopup="menu"
              >
                {/* Trigger показывает иконку active mode (rect или lasso).
                    По умолчанию — rect (dashed). */}
                {selectMode === 'lasso' ? (
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 4 C3 2 11 2 11 5 C11 7 6 8 6 10 C6 11 7 11.5 7 11.5" />
                    <circle cx="6.5" cy="12.5" r="0.8" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2">
                    <rect x="2" y="3" width="10" height="8" rx="1" />
                  </svg>
                )}
              </TbBtn>
              {modeOpen && (
                <SelectDdMenu>
                  <SelectDdItem
                    className={selectMode === 'rect' ? 'on' : ''}
                    onClick={(e) => {
                      e.stopPropagation();
                      pickMode('rect');
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
                      pickMode('lasso');
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
                </SelectDdMenu>
              )}
            </SelectDd>
          </SelectDdWrap>

        {/* Focus dropdown: worst5 / best5 / bad / good (Toolbar wrapper не нужен). */}
        <SelectDdWrap ref={focusWrapRef} aria-label="Быстрый выбор">
            <SelectDd data-open={focusOpen ? 'true' : 'false'} role="menu">
              <TbBtn
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusOpen((v) => !v);
                  setModeOpen(false);
                }}
                title="Быстрый выбор магазинов"
                type="button"
                aria-label="Быстрый выбор магазинов"
                aria-expanded={focusOpen}
                aria-haspopup="menu"
              >
                {/* Generic filter/funnel icon — не повторяет ни одну из 4 options,
                    т.к. Focus это набор actions (не state, нечего "active" показать). */}
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 3 L12.5 3 L8.5 7.5 L8.5 12 L5.5 11 L5.5 7.5 Z" />
                </svg>
              </TbBtn>
              {focusOpen && (
                <SelectDdMenu>
                  <SelectDdItem
                    onClick={(e) => {
                      e.stopPropagation();
                      pickFocus('worst5');
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
                      pickFocus('best5');
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
                      pickFocus('bad');
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
                      pickFocus('good');
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
                </SelectDdMenu>
              )}
            </SelectDd>
          </SelectDdWrap>

        {hasFilters && (
          <Toolbar role="toolbar" aria-label="Сбросить выделение">
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
          </Toolbar>
        )}
      </ToolbarRow>

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
    </>
  );
};

export default ToolbarBar;
