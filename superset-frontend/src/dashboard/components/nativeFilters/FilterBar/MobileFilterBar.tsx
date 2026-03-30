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

    /* BarWrapper — full width, remove fixed width */
    & [data-test='filter-bar'] {
      width: 100% !important;

      &.open {
        width: 100% !important;
      }
    }

    /* Bar — relative positioning, full width, always visible */
    & [data-test='filter-bar'] > div:nth-of-type(2) {
      position: relative !important;
      width: 100% !important;
      min-height: auto !important;
      display: flex !important;
      flex-direction: column !important;
      border-right: none !important;
      border-bottom: none !important;
      flex: 1;
      overflow: hidden;
    }

    /* Hide collapsed bar (not needed in drawer) */
    & [data-test='filter-bar-collapsable'] {
      display: none !important;
    }

    /* 4. Hide collapse arrow button (drawer has its own close) */
    & [data-test='filter-bar-collapse-button'] {
      display: none !important;
    }

    /* 2. Action buttons — horizontal row, space-between */
    & [data-test='filterbar-action-buttons'] {
      position: static !important;
      width: 100% !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: ${theme.sizeUnit * 3}px ${theme.sizeUnit * 4}px !important;
      background: ${theme.colorBgContainer} !important;
      border-top: 1px solid ${theme.colorBorderSecondary};

      .filter-apply-button {
        margin-bottom: 0 !important;
        flex: 1;
        margin-right: ${theme.sizeUnit * 2}px;
      }

      .filter-clear-all-button {
        flex: 0 0 auto;
      }
    }

    /* 3. Empty state — center text, no divider */
    & .ant-empty {
      text-align: center;
    }

    /* Scrollable filter content area */
    & .ant-tabs-tabpane {
      overflow-y: auto;
      flex: 1;
    }

    /* 5. Border-radius per design system: 6px for controls */
    & .ant-select .ant-select-selector {
      border-radius: 6px !important;
    }

    & .ant-input {
      border-radius: 6px !important;
    }

    & .ant-picker {
      border-radius: 6px !important;
    }

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
        title={t('Filters')}
        placement="bottom"
        onClose={closeDrawer}
        open={drawerOpen}
        height="70%"
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        <DrawerContent>{children}</DrawerContent>
      </Drawer>
    </>
  );
};

export default MobileFilterBar;
