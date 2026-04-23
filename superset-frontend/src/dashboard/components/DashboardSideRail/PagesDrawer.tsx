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
 * PagesDrawer — контент для DrawerKind='pages'. Переиспользует
 * существующий PagesPanel (из FilterBar/PagesPanel.jsx) со всеми
 * его Redux-dispatch'ами (setActivePagePath, copyPage, deleteComponent).
 * Рендер внутри Shell.Drawer (bottom-sheet).
 */
import { styled } from '@superset-ui/core';
import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { DS2_VARS } from 'src/theme/ds2';
import PagesPanel from 'src/dashboard/components/nativeFilters/FilterBar/PagesPanel';
import type { RootState } from 'src/dashboard/types';
import { PAGES_TYPE } from 'src/dashboard/util/componentTypes';
import {
  DASHBOARD_GRID_ID,
  DASHBOARD_ROOT_ID,
} from 'src/dashboard/util/constants';
import { useShell } from 'src/views/components/Shell/ShellContext';

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: ${DS2_VARS.s};
  overflow: auto;
`;

export const PagesDrawer: FC = () => {
  const { closeDrawer } = useShell();

  const topLevelPages = useSelector<RootState, any>(state => {
    const layout = (state.dashboardLayout as any)?.present ?? {};
    const root = layout[DASHBOARD_ROOT_ID];
    const rootChild = root?.children?.[0];
    if (!rootChild || rootChild === DASHBOARD_GRID_ID) return undefined;
    const node = layout[rootChild];
    return node?.type === PAGES_TYPE ? node : undefined;
  });
  const editMode = useSelector<RootState, boolean>(
    state => state.dashboardState?.editMode ?? false,
  );

  return (
    <DrawerBody>
      <PagesPanel
        topLevelPages={topLevelPages}
        editMode={editMode}
        onClose={closeDrawer}
      />
    </DrawerBody>
  );
};
