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
import { useState, useCallback, ReactNode } from 'react';
import { styled, css, t } from '@superset-ui/core';
import { Drawer } from 'antd';
import { Icons } from '@superset-ui/core/components/Icons';

interface MobileFilterBarProps {
  children: ReactNode;
}

const BottomBar = styled.div`
  ${({ theme }) => css`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: ${theme.colorBgContainer};
    border-top: 1px solid ${theme.colorBorderSecondary};
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px;
    display: flex;
    gap: ${theme.sizeUnit * 2}px;
  `}
`;

const FilterButton = styled.button`
  ${({ theme }) => css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.sizeUnit * 2}px;
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 4}px;
    background: ${theme.colorBgContainer};
    border: 1px solid ${theme.colorBorderSecondary};
    border-radius: ${theme.sizeUnit}px;
    color: ${theme.colorText};
    font-size: ${theme.fontSize}px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    height: 40px;

    &:hover {
      border-color: ${theme.colorPrimary};
      color: ${theme.colorPrimary};
    }

    &:active {
      background: ${theme.colorBgTextActive};
    }
  `}
`;

/**
 * Styled wrapper that overrides FilterBar vertical styles
 * for proper display inside a mobile bottom-sheet Drawer.
 */
const DrawerContent = styled.div`
  ${({ theme }) => css`
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* BarWrapper — full width */
    & > div {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
    }

    /* Force open state */
    & > div.open,
    & [data-test='filter-bar'] {
      width: 100% !important;
    }

    /* Hide collapsed bar */
    & [data-test='filter-bar-collapsable'] {
      display: none !important;
    }

    /* Bar — fill drawer, no absolute positioning */
    & > div > div:last-child {
      position: relative !important;
      width: 100% !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
      border-right: none !important;
      border-bottom: none !important;
      overflow: hidden !important;
    }

    /* Scrollable filter content */
    & > div > div:last-child > div:nth-child(2) {
      flex: 1 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding-bottom: ${theme.sizeUnit * 2}px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* All nested content — constrain width */
    & * {
      max-width: 100%;
      box-sizing: border-box;
    }

    /* Hide collapse arrow button (the VerticalAlignTop icon) */
    & [data-test='filter-bar-collapse-button'] {
      display: none !important;
    }

    /* Action buttons — one row, full width, Apply left / Clear right */
    && [data-test='filterbar-action-buttons'],
    & div[data-test='filterbar-action-buttons'] {
      position: static !important;
      width: 100% !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px !important;
      background: ${theme.colorBgContainer} !important;
      border-top: 1px solid ${theme.colorBorderSecondary};
      flex-shrink: 0 !important;

      & > button.filter-apply-button,
      & > .filter-apply-button {
        margin-bottom: 0 !important;
        flex: 1 !important;
        margin-right: ${theme.sizeUnit * 2}px !important;
      }

      & > button.filter-clear-all-button,
      & > .filter-clear-all-button {
        flex: 0 0 auto !important;
        margin-bottom: 0 !important;
      }
    }

    /* Empty state — center */
    & .ant-empty {
      text-align: center;
    }

    /* Border-radius: 6px for controls */
    & .ant-select .ant-select-selector,
    & .ant-input,
    & .ant-picker,
    & .ant-btn {
      border-radius: 6px !important;
    }
  `}
`;

const MobileFilterBar = ({ children }: MobileFilterBarProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <BottomBar>
        <FilterButton onClick={openDrawer} aria-label={t('Open filters')}>
          <Icons.FilterOutlined iconSize="m" />
          <span>{t('Filters')}</span>
        </FilterButton>
      </BottomBar>
      <Drawer
        placement="bottom"
        onClose={closeDrawer}
        open={drawerOpen}
        height="85vh"
        closable={false}
        styles={{
          header: { display: 'none' },
          body: { padding: 0, overflow: 'hidden', maxHeight: '85vh' },
          wrapper: { maxHeight: '85vh' },
        }}
      >
        <DrawerContent>{children}</DrawerContent>
      </Drawer>
    </>
  );
};

export default MobileFilterBar;
