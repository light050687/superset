/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint-disable no-param-reassign */
import { throttle } from 'lodash';
import {
  memo,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  createContext,
  FC,
} from 'react';
import cx from 'classnames';
import { css, styled, t, useTheme } from '@superset-ui/core';
import { Icons } from '@superset-ui/core/components/Icons';
import { EmptyState, Loading } from '@superset-ui/core/components';
import { getFilterBarTestId } from './utils';
import { VerticalBarProps } from './types';
import Header from './Header';
import FilterKanban from './FilterKanban';
import { DrawerFooterActionsPortal } from './FilterKanban/DrawerFooterActionsPortal';
import FilterControls from './FilterControls/FilterControls';
import CrossFiltersVertical from './CrossFilters/Vertical';
import PagesPanel from './PagesPanel';

const BarWrapper = styled.div<{ width: number; isMobile?: boolean }>`
  width: ${({ theme, isMobile }) =>
    isMobile ? '100%' : `${theme.sizeUnit * 8}px`};

  & .ant-tabs-top > .ant-tabs-nav {
    margin: 0;
  }
  &.open {
    width: ${({ width, isMobile }) => (isMobile ? '100%' : `${width}px`)};
  }
`;

const Bar = styled.div<{ width: number; isMobile?: boolean }>`
  ${({ theme, width, isMobile }) => `
    & .ant-typography-edit-content {
      left: 0;
      margin-top: 0;
      width: 100%;
    }
    position: ${isMobile ? 'relative' : 'absolute'};
    top: ${isMobile ? 'auto' : '0'};
    left: ${isMobile ? 'auto' : '0'};
    flex-direction: column;
    flex-grow: 1;
    width: ${isMobile ? '100%' : `${width}px`};
    background: ${theme.colorBgContainer};
    /* Border-right и border-bottom убраны: FilterBar теперь живёт
       внутри Shell-drawer'а, а не на sidebar'е. Эти рамки давали
       лишние линии справа/снизу ВНУТРИ drawer-body и читались как
       «рамки окна». Drawer сам рисует свой контур (border+radius
       в Shell/Drawer.tsx). */
    min-height: ${isMobile ? 'auto' : '100%'};
    display: ${isMobile ? 'flex' : 'none'};
    ${isMobile ? 'flex: 1; overflow: hidden;' : ''}
    &.open {
      display: flex;
    }
  `}
`;

const CollapsedBar = styled.div<{ offset: number }>`
  ${({ theme, offset }) => `
    position: absolute;
    top: ${offset}px;
    left: 0;
    height: 100%;
    width: ${theme.sizeUnit * 8}px;
    padding-top: ${theme.sizeUnit * 2}px;
    display: none;
    text-align: center;
    &.open {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: ${theme.sizeUnit * 2}px;
    }
    svg {
      cursor: pointer;
    }
  `}
`;

const FilterBarEmptyStateContainer = styled.div`
  margin-top: ${({ theme }) => theme.sizeUnit * 8}px;
`;

const FilterControlsWrapper = styled.div<{ isMobile?: boolean }>`
  ${({ theme, isMobile }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.sizeUnit * 2}px;
    padding: ${theme.sizeUnit * 4}px;
    // 108px padding to make room for buttons with position: absolute (desktop only)
    padding-bottom: ${isMobile ? `${theme.sizeUnit * 2}px` : `${theme.sizeUnit * 27}px`};
  `}
`;

export const FilterBarScrollContext = createContext(false);
const VerticalFilterBar: FC<React.PropsWithChildren<VerticalBarProps>> = ({
  actions,
  canEdit,
  dataMaskSelected,
  filtersOpen,
  filterValues,
  height,
  isInitialized,
  isMobile,
  offset,
  onSelectionChange,
  toggleFiltersBar,
  width,
  clearAllTriggers,
  onClearAllComplete,
  presetButton,
  topLevelPages,
  editMode,
  hideInternalHeader,
  useKanban,
  dashboardId,
  kanbanPresetCtx,
}) => {
  const theme = useTheme();
  const [isScrolling, setIsScrolling] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const pageCount = topLevelPages?.children?.length || 0;
  const showPagesIcon = pageCount > 1 || editMode;
  const timeout = useRef<any>();

  const openFiltersBar = useCallback(
    () => toggleFiltersBar(true),
    [toggleFiltersBar],
  );

  const onScroll = useMemo(
    () =>
      throttle(() => {
        clearTimeout(timeout.current);
        setIsScrolling(true);
        timeout.current = setTimeout(() => {
          setIsScrolling(false);
        }, 300);
      }, 200),
    [],
  );

  useEffect(() => {
    document.onscroll = onScroll;
    return () => {
      document.onscroll = null;
    };
  }, [onScroll]);

  /* Unified DS 2.0 scrollbar фрагмент: thin 10px, g300 thumb, 5px radius,
     background-clip:padding-box, hover→g400. Прописан через emotion
     css-fragment — inline-style не поддерживает ::-webkit-scrollbar-*.
     Только вертикальный scroll: overflow-x: hidden (без горизонтальной
     полосы), overflow-y: auto.
     В kanban-режиме scroll отдаётся родительскому drawer body — чтобы
     не было двойных полос. Поэтому overflow: visible и нет height. */
  const tabPaneCss = useMemo(
    () => css`
      box-sizing: border-box;
      overflow-x: hidden;
      overscroll-behavior: contain;
      ${useKanban
        ? 'overflow-y: visible; height: auto; width: 100%;'
        : isMobile
          ? 'overflow-y: auto; flex: 1; width: 100%;'
          : `overflow-y: auto; height: ${typeof height === 'number' ? `${height}px` : height};`}
      scrollbar-width: thin;
      scrollbar-color: var(--g300) transparent;
      &::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--g300);
        border-radius: 5px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: var(--g400);
        background-clip: padding-box;
      }
    `,
    [height, isMobile, useKanban],
  );

  const filterControls = useMemo(
    () =>
      useKanban && dashboardId ? (
        /* Kanban рендерится всегда, даже без фильтров — нужны видимые
           колонки-категории + preset-секция, чтобы юзер мог создавать
           категории и применять пресеты до добавления фильтров. */
        <FilterKanban
          dashboardId={dashboardId}
          dataMaskSelected={dataMaskSelected}
          onFilterSelectionChange={onSelectionChange}
          clearAllTriggers={clearAllTriggers}
          onClearAllComplete={onClearAllComplete}
          kanbanPresetCtx={kanbanPresetCtx}
        />
      ) : filterValues.length === 0 ? (
        <FilterBarEmptyStateContainer>
          <EmptyState
            size="small"
            title={t('No global filters are currently added')}
            image="filter.svg"
            description={
              canEdit &&
              t(
                'Click on "Add or Edit Filters" option in Settings to create new dashboard filters',
              )
            }
          />
        </FilterBarEmptyStateContainer>
      ) : (
        <FilterControlsWrapper isMobile={isMobile}>
          <FilterControls
            dataMaskSelected={dataMaskSelected}
            onFilterSelectionChange={onSelectionChange}
            clearAllTriggers={clearAllTriggers}
            onClearAllComplete={onClearAllComplete}
            isMobile={isMobile}
          />
        </FilterControlsWrapper>
      ),
    [
      canEdit,
      dataMaskSelected,
      filterValues.length,
      onSelectionChange,
      isMobile,
      useKanban,
      dashboardId,
      clearAllTriggers,
      onClearAllComplete,
      kanbanPresetCtx,
    ],
  );

  return (
    <FilterBarScrollContext.Provider value={isScrolling}>
      <BarWrapper
        {...getFilterBarTestId()}
        className={cx({ open: filtersOpen || pagesOpen })}
        width={width}
        isMobile={isMobile}
      >
        {!isMobile && (
          <CollapsedBar
            {...getFilterBarTestId('collapsable')}
            className={cx({ open: !filtersOpen && !pagesOpen })}
            role="navigation"
            offset={offset}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                setPagesOpen(false);
                openFiltersBar();
              }}
              onKeyDown={e => e.key === 'Enter' && openFiltersBar()}
              css={{
                cursor: 'pointer',
                marginBottom: `${theme.sizeUnit * 3}px`,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label={t('Фильтры')}
            >
              <Icons.FilterOutlined
                {...getFilterBarTestId('filter-icon')}
                iconColor={theme.colorTextTertiary}
                iconSize="l"
              />
            </div>
            {showPagesIcon && (
              <div
                role="button"
                tabIndex={0}
                onClick={e => {
                  e.stopPropagation();
                  setPagesOpen(true);
                  toggleFiltersBar(true);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setPagesOpen(true);
                    toggleFiltersBar(true);
                  }
                }}
                css={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={t('Страницы')}
              >
                <Icons.BookOutlined
                  iconSize="l"
                  iconColor={theme.colorPrimary}
                />
              </div>
            )}
          </CollapsedBar>
        )}
        <Bar
          className={cx({ open: filtersOpen || pagesOpen })}
          width={width}
          isMobile={isMobile}
        >
          {pagesOpen ? (
            <PagesPanel
              topLevelPages={topLevelPages}
              editMode={editMode}
              onClose={() => {
                setPagesOpen(false);
                toggleFiltersBar(false);
              }}
            />
          ) : (
            <>
              {!hideInternalHeader && (
                <Header
                  toggleFiltersBar={toggleFiltersBar}
                  isMobile={isMobile}
                />
              )}
              {/* В kanban-режиме preset уходит первой колонкой — здесь
                  рендерим только когда НЕ kanban (classic sidebar). */}
              {!useKanban && presetButton && (
                <div
                  css={{
                    padding: `0 ${theme.sizeUnit * 4}px`,
                    marginBottom: theme.sizeUnit,
                  }}
                >
                  {presetButton}
                </div>
              )}
              {!isInitialized ? (
                <div css={{ height }}>
                  <Loading />
                </div>
              ) : (
                <div css={tabPaneCss} onScroll={onScroll}>
                  <>
                    <CrossFiltersVertical />
                    {filterControls}
                  </>
                </div>
              )}
              {/* В kanban-режиме actions портируются в footer-slot
                  drawer'а (см. DrawerFooterActionsPortal) — чтобы не
                  плыть со скроллом и не перекрывать его. В classic
                  sidebar — рендерятся на месте как раньше. */}
              {useKanban ? (
                <DrawerFooterActionsPortal>{actions}</DrawerFooterActionsPortal>
              ) : (
                actions
              )}
            </>
          )}
        </Bar>
      </BarWrapper>
    </FilterBarScrollContext.Provider>
  );
};
export default memo(VerticalFilterBar);
