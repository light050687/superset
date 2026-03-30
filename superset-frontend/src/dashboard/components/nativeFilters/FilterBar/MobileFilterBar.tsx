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
        styles={{ body: { padding: 0, overflow: 'auto' } }}
      >
        {children}
      </Drawer>
    </>
  );
};

export default MobileFilterBar;
