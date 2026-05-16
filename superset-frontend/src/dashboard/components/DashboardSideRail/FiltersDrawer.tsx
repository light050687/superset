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
import { css, styled, t } from '@superset-ui/core';
import { Input } from 'antd';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { DS2_VARS } from 'src/theme/ds2';
import FilterBar from 'src/dashboard/components/nativeFilters/FilterBar';
import FilterBarSettings from 'src/dashboard/components/nativeFilters/FilterBar/FilterBarSettings';
import { FilterSearchContext } from 'src/dashboard/components/nativeFilters/FilterBar/FilterKanban/FilterSearchContext';
import { FilterBarOrientation, type RootState } from 'src/dashboard/types';
import { PAGES_TYPE } from 'src/dashboard/util/componentTypes';
import {
  DASHBOARD_GRID_ID,
  DASHBOARD_ROOT_ID,
} from 'src/dashboard/util/constants';
import {
  DRAWER_HEAD_CENTER_ID,
  DRAWER_HEAD_RIGHT_ID,
} from 'src/views/components/Shell/Drawer';
import { useShell } from 'src/views/components/Shell/ShellContext';

/* FilterBar-based контент внутри drawer'а. НЕ задаём height/overflow —
   scroll обеспечивает родительский <DrawerBody> из Shell/Drawer.tsx
   (он уже имеет `flex:1; overflow-y:auto`). Раньше было `height:100% +
   overflow:hidden` — это клиппило kanban-grid, когда колонки не
   помещались в высоту drawer'а, а outer scroll не видел overflow
   (инернер был ровно 100% = всегда «влезал»). */
const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  background: ${DS2_VARS.s};
`;

export const FiltersDrawer: FC = () => {
  const { closeDrawer } = useShell();

  /* Глобальный поиск по всем колонкам (pre-sets + filters). Inject'им
     input в центр drawer-шапки через Portal (DRAWER_HEAD_CENTER_ID),
     query раздаём через FilterSearchContext. */
  const [searchQuery, setSearchQuery] = useState('');
  const searchCtx = useMemo(
    () => ({ query: searchQuery, setQuery: setSearchQuery }),
    [searchQuery],
  );

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
    <FilterSearchContext.Provider value={searchCtx}>
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
            /* Внутренний Header FilterBar'а («Фильтры» + шестерёнка + ×)
               скрываем — у drawer'а есть свой заголовок «ФИЛЬТРЫ ДАШБОРДА»
               и своя кнопка закрытия. Шестерёнку (FilterBarSettings)
               рендерим ниже через Portal в шапку drawer'а. */
            hideInternalHeader: true,
            /* Kanban-grid: фильтры распределены по колонкам-категориям с
               drag-drop; колонки юзер создаёт/переименовывает/удаляет. */
            useKanban: true,
          }}
        />
        {/* Portal: unified-search в центр drawer-шапки. */}
        <DrawerHeadSearchPortal query={searchQuery} setQuery={setSearchQuery} />
        {/* Portal: шестерёнка (FilterBarSettings) в правую часть drawer-
            шапки, рядом с крестиком. */}
        <DrawerHeadSettingsPortal />
      </DrawerBody>
    </FilterSearchContext.Provider>
  );
};

/**
 * FilterBarSettings живёт в правой части шапки drawer'а через React
 * Portal — mount в слот DRAWER_HEAD_RIGHT_ID, который Drawer.tsx
 * рендерит СЛЕВА от кнопки закрытия. Шестерёнка визуально стоит
 * вплотную к крестику. Node lookup через document.getElementById,
 * корректно переживает mount/unmount drawer'а.
 *
 * Гарда openedDrawer==='filters' — FiltersDrawer персистентно
 * смонтирован после первого открытия (display:none), но шестерёнка
 * через portal попадает в общую drawer-шапку. Без гарды она бы
 * показывалась поверх других drawer'ов.
 */
const DrawerHeadSettingsPortal: FC = () => {
  const { openedDrawer } = useShell();
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMount(document.getElementById(DRAWER_HEAD_RIGHT_ID));
  }, []);
  if (!mount || openedDrawer !== 'filters') return null;
  return createPortal(<FilterBarSettings />, mount);
};

/**
 * Unified search input — monтируется в центр drawer-шапки между title
 * и action-слотом. Provides `query` в FilterSearchContext, по которому
 * фильтруются пресеты (через fetchPresets) и карточки фильтров
 * (по name). Колонки без совпадений свёрнуты / скрыты автоматически.
 *
 * Гарда openedDrawer==='filters' — иначе portal'ируется в чужую
 * drawer-шапку (catalog/tools/...). FiltersDrawer персистентно
 * смонтирован (display:none) после первого открытия, но Portal target
 * лежит в общем drawer-shell и виден независимо от visibility.
 */
const DrawerHeadSearchPortal: FC<{
  query: string;
  setQuery: (v: string) => void;
}> = ({ query, setQuery }) => {
  const { openedDrawer } = useShell();
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMount(document.getElementById(DRAWER_HEAD_CENTER_ID));
  }, []);
  if (!mount || openedDrawer !== 'filters') return null;
  return createPortal(
    <Input
      allowClear
      size="small"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder={t('Поиск фильтров и пресетов...')}
      aria-label={t('Поиск фильтров и пресетов')}
      style={{ width: 280, maxWidth: '100%' }}
    />,
    mount,
  );
};
