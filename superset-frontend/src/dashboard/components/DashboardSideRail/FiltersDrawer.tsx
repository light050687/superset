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
 * FiltersDrawer — контент для DrawerKind='filters'. Переиспользует
 * существующий <FilterBar verticalConfig={...}> с filtersOpen=true,
 * чтобы вся логика инициализации, URL-sync и apply-flow осталась
 * нетронутой. Рендер внутри Shell.Drawer (bottom-sheet).
 *
 * Scope: монтируется ТОЛЬКО когда openedDrawer='filters' (Shell уже
 * гарантирует это). Поэтому FilterBar'овые хуки стартуют только
 * когда юзер открывает drawer — side-effects safe.
 */
import { css, styled } from '@superset-ui/core';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { DS2_VARS } from 'src/theme/ds2';
import FilterBar from 'src/dashboard/components/nativeFilters/FilterBar';
import { FilterBarOrientation, type RootState } from 'src/dashboard/types';
import { PAGES_TYPE } from 'src/dashboard/util/componentTypes';
import {
  DASHBOARD_GRID_ID,
  DASHBOARD_ROOT_ID,
} from 'src/dashboard/util/constants';
import { useShell } from 'src/views/components/Shell/ShellContext';

/* FilterBar-based контент внутри drawer'а. Задаём высоту 100% чтобы
   внутренний scroll FilterBar'а работал в пределах drawer body. */
const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: ${DS2_VARS.s};
  overflow: hidden;
`;

export const FiltersDrawer: FC = () => {
  const { closeDrawer } = useShell();

  /* Измеряем фактическую ширину drawer-тела через ResizeObserver —
     FilterBar.Vertical использует prop width как конкретный px (и
     `width: ${width}px` в стилях). Раньше сюда передавалось 9999 как
     «бесконечность», что превращало PresetButton в полосу 9967px,
     выезжающую за пределы drawer'а (пустая тёмно-синяя полоска из
     бага). Теперь width соответствует реальной ширине контейнера. */
  const bodyRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(320);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setBarWidth(Math.max(280, Math.floor(w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* topLevelPages нужен FilterBar'у для логики PagesPanel (он инжектит
     её внутри, если pagesOpen). Мы здесь pagesOpen не включаем, но
     prop проброшен чтобы не ломать типы. */
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

  /* Drawer может быть закрыт двумя способами: клик по иконке в
     DashboardSideRail → toggleDrawer, или любой внешний click /
     Esc → closeDrawer. FilterBar'у передаём toggleFiltersBar, который
     мапится на closeDrawer — так кнопка «Закрыть» внутри FilterBar
     reused естественно. */
  const toggleFiltersBar = useCallback(
    (open: boolean) => {
      if (!open) closeDrawer();
    },
    [closeDrawer],
  );

  return (
    <DrawerBody
      ref={bodyRef}
      css={css`
        /* Убираем внутренние рамки FilterBar'а: он рассчитан на sidebar
           со своей границей, внутри drawer'а это лишние линии. */
        & .css-0 > div[role='navigation'] {
          display: none !important;
        }
        /* filterBar'овский Bar внутри — делаем full-width чтобы занимал
           всю ширину drawer'а. */
        & > div > div {
          position: relative !important;
          width: 100% !important;
        }
      `}
    >
      <FilterBar
        orientation={FilterBarOrientation.Vertical}
        verticalConfig={{
          filtersOpen: true,
          toggleFiltersBar,
          width: barWidth,
          height: 560,
          offset: 0,
          topLevelPages,
          editMode,
        }}
      />
    </DrawerBody>
  );
};
