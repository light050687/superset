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
 * CatalogDrawer — pixel-perfect parity мокап `.cat-simple` (3 колонки):
 *   ИЗБРАННОЕ (6) · ИСТОРИЯ (8) · ДЕПАРТАМЕНТЫ (14)
 * grid-template-columns: 1fr 1fr 1.1fr, border-right между колонок.
 * Каждая колонка: sc-head (label+count) + sc-body (scrollable list).
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation } from 'react-router-dom';
import { DS2_VARS } from 'src/theme/ds2';
import { DRAWER_HEAD_CENTER_ID } from 'src/views/components/Shell/Drawer';
import { useShell } from 'src/views/components/Shell/ShellContext';
import { CatalogManageView } from './CatalogManageView';
import { useCatalogDraft } from './useCatalogDraft';
import { useCatalogFolders } from './useCatalogFolders';
import { markCatalogItemSeen, markCatalogViewed } from './useCatalogHasUpdates';
import {
  deriveDefaultFolderName,
  useCatalogColumnLabels,
} from './useCatalogColumnLabels';
import {
  useCatalogFolderItems,
  type DrilledScope,
} from './useCatalogFolderItems';
import type { CatalogFolderNode } from './types';

/* localStorage keys — состояние дрилла и скоупа переживает закрытие drawer'а
   и перезагрузку страницы. Совместно формируют «персистентный стейт» из
   мокапа (catalogDrillDept + scope toggle). */
const SCOPE_STORAGE_KEY = 'mrts-catalog-scope';
const DRILL_PATH_STORAGE_KEY = 'mrts-catalog-drill-path';

function readScope(): DrilledScope {
  try {
    const v = window.localStorage.getItem(SCOPE_STORAGE_KEY);
    return v === 'chart' ? 'chart' : 'dashboard';
  } catch {
    return 'dashboard';
  }
}

function readDrillPath(): number[] {
  try {
    const raw = window.localStorage.getItem(DRILL_PATH_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is number => Number.isFinite(x));
  } catch {
    return [];
  }
}

function writeScope(scope: DrilledScope): void {
  try {
    window.localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  } catch {
    // ignore
  }
}

function writeDrillPath(path: number[]): void {
  try {
    if (path.length === 0) {
      window.localStorage.removeItem(DRILL_PATH_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DRILL_PATH_STORAGE_KEY, JSON.stringify(path));
    }
  } catch {
    // ignore
  }
}

/* Вкладка (overview|manage) тоже персистится — юзер в режиме управления
   должен оставаться в нём при закрытии и повторном открытии каталога. */
const TAB_STORAGE_KEY = 'mrts-catalog-tab';

type CatalogTab = 'overview' | 'manage';

function readTab(): CatalogTab {
  try {
    const v = window.localStorage.getItem(TAB_STORAGE_KEY);
    return v === 'manage' ? 'manage' : 'overview';
  } catch {
    return 'overview';
  }
}

function writeTab(tab: CatalogTab): void {
  try {
    window.localStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // ignore
  }
}

interface CatalogDrawerProps {
  /** Можно ли пользователю управлять каталогом (кнопка «Управление» в футере). */
  canManage?: boolean;
}

/* ─── Layout: cat-simple (3-col grid) ─── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1.1fr;
  gap: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  font-family: ${DS2_VARS.fontSans};
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid ${DS2_VARS.g100};

  &:last-child {
    border-right: none;
  }
`;

/* Мокап .sc-head: кликабельный "link" на full-list page (navTo).
   Hover: bg, подсветка label+svg, появление стрелки `›`.
   Вложенные hover-стили через классы (component-selectors не используем). */
const ColHead = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px 10px;
  flex-shrink: 0;
  border: none;
  border-bottom: 1px solid ${DS2_VARS.g100};
  background: transparent;
  cursor: pointer;
  transition: background 0.12s ${DS2_VARS.ease};
  color: inherit;
  width: 100%;
  text-align: left;

  & > svg {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    color: ${DS2_VARS.g500};
    transition: color 0.12s ${DS2_VARS.ease};
  }

  & > .col-head-label {
    font-size: 9.5px;
    font-family: ${DS2_VARS.fontMono};
    color: ${DS2_VARS.g500};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    transition: color 0.12s ${DS2_VARS.ease};
  }

  & > .col-head-arrow {
    font-size: 11px;
    color: ${DS2_VARS.g500};
    opacity: 0;
    transition:
      opacity 0.12s ${DS2_VARS.ease},
      transform 0.12s ${DS2_VARS.ease};
    margin-left: 4px;
  }

  &:hover {
    background: ${DS2_VARS.bg3};
  }

  &:hover > svg,
  &:hover > .col-head-label {
    color: ${DS2_VARS.ink};
  }

  &:hover > .col-head-arrow {
    opacity: 1;
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const ColHeadCount = styled.span`
  margin-left: auto;
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
`;

const ColBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px 10px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g200};
    border-radius: 2px;
  }
`;

/* ─── Items ─── */

const Item = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.1s ${DS2_VARS.ease};
  background: transparent;
  border: none;
  color: inherit;
  width: 100%;
  text-align: left;

  &:hover {
    background: ${DS2_VARS.bg3};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const ItemIc = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${DS2_VARS.g100};
  color: ${DS2_VARS.g600};

  svg {
    width: 11px;
    height: 11px;
  }
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const ItemTitle = styled.span`
  font-size: 12.5px;
  color: ${DS2_VARS.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemMeta = styled.span`
  font-size: 10.5px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemTime = styled.span`
  font-size: 10px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
  flex-shrink: 0;
`;

/* ─── Department row ─── */

const Dept = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.1s ${DS2_VARS.ease};
  background: transparent;
  border: none;
  color: inherit;
  width: 100%;
  text-align: left;

  & > .dept-chev {
    width: 8px;
    height: 8px;
    color: ${DS2_VARS.g400};
    opacity: 0;
    transition:
      opacity 0.1s ${DS2_VARS.ease},
      transform 0.1s ${DS2_VARS.ease};
    flex-shrink: 0;
  }

  &:hover {
    background: ${DS2_VARS.bg3};
  }

  &:hover > .dept-chev {
    opacity: 1;
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const DeptDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const DeptName = styled.span`
  flex: 1;
  font-size: 12.5px;
  color: ${DS2_VARS.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeptCount = styled.span`
  font-size: 10.5px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
  flex-shrink: 0;
`;

/* ─── Drill-in header: back-arrow + dot + folder name (не uppercase) ─── */

const DrillHead = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 10px;
  flex-shrink: 0;
  border: none;
  border-bottom: 1px solid ${DS2_VARS.g100};
  background: transparent;
  cursor: pointer;
  transition: background 0.12s ${DS2_VARS.ease};
  color: inherit;
  width: 100%;
  text-align: left;

  & > svg.drill-back {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    color: ${DS2_VARS.g500};
    transition: color 0.12s ${DS2_VARS.ease};
  }

  & > .drill-name {
    flex: 1;
    font-size: 12.5px;
    font-family: ${DS2_VARS.fontSans};
    color: ${DS2_VARS.ink};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & > .drill-count {
    font-size: 10px;
    font-family: ${DS2_VARS.fontMono};
    color: ${DS2_VARS.g500};
    flex-shrink: 0;
  }

  &:hover {
    background: ${DS2_VARS.bg3};
  }

  &:hover > svg.drill-back {
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const DrillDot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 12px 16px;
  font-size: 11.5px;
  color: ${DS2_VARS.g500};
  text-align: center;
  font-family: ${DS2_VARS.fontSans};

  svg {
    width: 28px;
    height: 28px;
    stroke-width: 1.3;
    color: ${DS2_VARS.g400};
    opacity: 0.55;
  }
`;

/* ─── Footer (overview → Manage btn, manage → Back/Hint/Reset) ─── */

/* Мокап .drawer-footer: полу-прозрачный border-top, gap:12 между
   back/hint/reset. Padding 14/24/18 увеличен для воздуха вокруг
   кнопок. */
const FooterRow = styled.div`
  padding: 14px 24px 18px;
  border-top: 1px solid color-mix(in oklab, ${DS2_VARS.g100} 70%, transparent);
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  align-items: center;
`;

/* Мокап .cat-foot-back / .cat-foot-reset / .cat-foot-manage — общая
   база с двумя hover-вариантами:
     primary (back/manage) → sky border+color+tint на hover
     neutral (reset)       → g300 border + ink color на hover
   $alignEnd: margin-left:auto — прижимает reset-кнопку к правому краю
   (мокап `.cat-foot-reset { margin-left: auto }`). */
const FooterBtn = styled.button<{
  $variant?: 'primary' | 'neutral';
  $alignEnd?: boolean;
  /** «Активное» CTA-состояние — заливает кнопку cSky, чтобы было сразу
   *  видно что действие доступно и ожидается (как badge на rail-кнопке).
   *  Используется на «Сохранить» когда draft.dirty. */
  $active?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  background: ${({ $active }) => ($active ? DS2_VARS.cSky : 'none')};
  border: 1px solid
    ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g200)};
  border-radius: 6px;
  color: ${({ $active }) => ($active ? '#ffffff' : DS2_VARS.g500)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 11px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.1s ${DS2_VARS.ease};
  white-space: nowrap;
  ${({ $alignEnd }) => ($alignEnd ? 'margin-left: auto;' : '')}
  ${({ $active }) =>
    $active
      ? `box-shadow: 0 0 0 0 color-mix(in oklab, var(--c-sky, #5CAAF0) 0%, transparent);
         box-shadow: 0 2px 10px color-mix(in oklab, var(--c-sky, #5CAAF0) 35%, transparent);`
      : ''}

  &:hover {
    ${({ $variant, $active }) =>
      $active
        ? `background: color-mix(in oklab, ${DS2_VARS.cSky} 85%, #000); color: #ffffff;`
        : $variant === 'neutral'
          ? `border-color: ${DS2_VARS.g300}; color: ${DS2_VARS.ink};`
          : `border-color: ${DS2_VARS.cSky}; color: ${DS2_VARS.cSky}; background: color-mix(in oklab, ${DS2_VARS.cSky} 10%, transparent);`}
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    border-color: ${DS2_VARS.g200};
    color: ${DS2_VARS.g500};
    background: none;
    box-shadow: none;
  }
  &:disabled:hover {
    border-color: ${DS2_VARS.g200};
    color: ${DS2_VARS.g500};
    background: none;
  }
`;

/* Мокап .cat-foot-hint: моно-подсказка между back и reset. Нет flex:1
   и text-align:center — hint занимает свою естественную ширину,
   reset прижимается к правому краю через $alignEnd. */
const FooterHint = styled.span`
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};

  kbd {
    background: ${DS2_VARS.bg3};
    border: 1px solid ${DS2_VARS.g200};
    border-radius: 3px;
    padding: 1px 5px;
    font-family: ${DS2_VARS.fontMono};
    font-size: 9px;
    color: ${DS2_VARS.g600};
    margin: 0 2px;
  }
`;

/* ─── Tab view wrapper с анимацией (fade через opacity) ─── */

const TabView = styled.div<{ $active: boolean }>`
  flex: 1;
  min-height: 0;
  display: ${({ $active }) => ($active ? 'flex' : 'none')};
  flex-direction: column;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.18s ${DS2_VARS.ease};
`;

/* ─── Scope toggle «Дашборды / Чарты» — pill-segmented control.
 *  Рендерится в центр заголовка Drawer'а через React Portal
 *  (DRAWER_HEAD_CENTER_ID), на одной строке с «КАТАЛОГ» и «×».
 *  Переключает контекст колонок: избранное/история/департаменты
 *  считаются и ведут на `/dashboard/list/` либо `/chart/list/`.
 *  Структура и взаимодействие для обоих скоупов идентичные,
 *  отличается только источник счётчиков и URL'ы навигации. */
/* Радиусы как у бейджей/контролов DS 2.0 (8px внешний контейнер,
   6px внутренние кнопки = var(--r-control)) — квадратные, но с мягкими
   скруглениями. Единый стиль с Tag-бейджами карточки, «Скоро»-бейджами
   в CreateDrawer/ToolsDrawer и prefix-контролами. */
const ScopeToggle = styled.div`
  display: inline-flex;
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
`;

const ScopeBtn = styled.button<{ $active: boolean }>`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: ${DS2_VARS.rControl};
  border: none;
  cursor: pointer;
  background: ${({ $active }) => ($active ? DS2_VARS.cSky : 'transparent')};
  color: ${({ $active }) => ($active ? '#FFFFFF' : DS2_VARS.g500)};
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${({ $active }) => ($active ? '#FFFFFF' : DS2_VARS.ink)};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/** Portal-обёртка: рендерит children в центре Drawer-header'а.
 *  Использует getElementById для mount-node'а, проверяет его наличие
 *  через useState + useEffect, чтобы корректно работать при SSR и до
 *  монтирования родителя. */
const DrawerHeaderPortal: FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const node = document.getElementById(DRAWER_HEAD_CENTER_ID);
    setMount(node);
  }, []);
  if (!mount) return null;
  return createPortal(children, mount);
};

/* ─── SVG icons ─── */

const IconDashboard = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="1" y="1" width="14" height="14" rx="2" />
    <path d="M1 5h14M5 1v14" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="6" width="3" height="8" rx="1" />
    <rect x="6.5" y="3" width="3" height="11" rx="1" />
    <rect x="11" y="1" width="3" height="13" rx="1" />
  </svg>
);

const IconGeo = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12" />
  </svg>
);

const IconGear = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
  </svg>
);

const IconBack = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 3L2 7l4 4M2 7h10a2 2 0 012 2v3" />
  </svg>
);

/* Мокап .sc-head-back — маленькая стрелка влево (10×10). */
const IconDrillBack = () => (
  <svg
    className="drill-back"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
  >
    <path d="M6.5 2L3 5l3.5 3" />
  </svg>
);

/* Мокап .sc-chev — маленькая стрелка вправо на hover строки департамента. */
const IconDeptChev = () => (
  <svg
    className="dept-chev"
    viewBox="0 0 8 8"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M3 1.5l2.5 2.5L3 6.5" />
  </svg>
);

const IconReset = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M13 8a5 5 0 11-1.5-3.5M13 3v2h-2" />
  </svg>
);

/* Мокап sc-head icons (viewBox 16×16, strokeWidth 1.6). */
const IconHeadStar = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M8 2l1.8 3.8 4.2.6-3 3 .7 4.2L8 11.7 4.3 13.6l.7-4.2-3-3 4.2-.6z" />
  </svg>
);

const IconHeadClock = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5V8l2 1.5" />
  </svg>
);

const IconHeadGrid = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <rect x="2" y="3" width="5" height="10" />
    <rect x="9" y="3" width="5" height="5" />
    <rect x="9" y="10" width="5" height="3" />
  </svg>
);

const IconStarBig = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 3l2.9 6 6.6 1-4.8 4.7 1.1 6.6L12 18.2 6.2 21.3l1.1-6.6L2.5 10l6.6-1z" />
  </svg>
);

const IconClockBig = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconFolderBig = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

/* ─── Department palette (DS 2.0 accent colors) ─── */

const DEPT_COLORS = [
  DS2_VARS.cSky,
  DS2_VARS.cFuchsia,
  DS2_VARS.cTangerine,
  DS2_VARS.up,
  DS2_VARS.cViolet,
  DS2_VARS.dn,
  DS2_VARS.cAmber,
  DS2_VARS.wn,
];

function pickColor(idx: number): string {
  return DEPT_COLORS[idx % DEPT_COLORS.length];
}

/** Иконка по типу объекта каталога. */
function iconForKind(kind: string) {
  if (kind === 'chart' || kind === 'чарт' || kind === 'диаграмма')
    return <IconChart />;
  if (kind === 'geo' || kind === 'гео') return <IconGeo />;
  return <IconDashboard />;
}

export const CatalogDrawer: FC<React.PropsWithChildren<CatalogDrawerProps>> = ({
  canManage = true,
}) => {
  const history = useHistory();
  const location = useLocation();
  const { closeDrawer } = useShell();
  const { labels } = useCatalogColumnLabels();
  const [tab, setTabState] = useState<CatalogTab>(() => readTab());
  const setTab = useCallback((next: CatalogTab) => {
    setTabState(next);
    writeTab(next);
  }, []);
  /* Scope: показываем ли мы каталог в разрезе дашбордов или чартов.
     Структура 3-колоночного представления (Избранное/История/Департаменты)
     общая — меняются только URL'ы перехода и счётчики per-type. Стейт
     персистится в localStorage — юзер вернулся → тот же вид.

     ВАЖНО: scope также фильтрует папки каталога на бэкенде — дерево
     для dashboard ≠ дерево для chart (миграция d4e5f6a7b8c9). Поэтому
     useCatalogFolders получает scope и рефетчит при его смене. */
  const [scope, setScopeState] = useState<DrilledScope>(() => readScope());
  const setScope = useCallback((next: DrilledScope) => {
    setScopeState(next);
    writeScope(next);
  }, []);
  const { folders, refresh } = useCatalogFolders({ scope });
  /* Draft-буфер для transactional-режима: юзер удаляет/перемещает папки
     и объекты в manage-режиме, ничего не уходит на сервер, пока не
     нажмёт «Сохранить». «Сбросить» отбрасывает очередь и возвращает
     baseline. Кнопки внизу footer'а — см. renderFooter (tab==='manage'). */
  const draft = useCatalogDraft({ onCommitted: refresh });
  const listBasePath =
    scope === 'dashboard' ? '/dashboard/list/' : '/chart/list/';

  /* drillPath — массив id папок от root до текущей: [rootId, subId, subsubId].
     Пустой → показываем список root-папок. Персистится между открытиями
     drawer'а (catalogDrillDept в мокапе, но у нас путь → multi-level). */
  const [drillPath, setDrillPathState] = useState<number[]>(() =>
    readDrillPath(),
  );
  const setDrillPath = useCallback((next: number[]) => {
    setDrillPathState(next);
    writeDrillPath(next);
  }, []);

  /** Переход по URL и закрытие drawer (как мокап navTo('home')+closeDrawer()). */
  const navTo = useCallback(
    (url: string) => {
      history.push(url);
      closeDrawer();
    },
    [history, closeDrawer],
  );

  // Сохраняем snapshot каталога как «просмотренный» при открытии — это
  // снимает badge с rail-кнопки до следующего изменения.
  useEffect(() => {
    if (folders.length > 0) markCatalogViewed(folders);
  }, [folders]);

  /* Если в drillPath есть id удалённой папки — обрезаем хвост. Защита от
     stale state после переименования/удаления папки в другой сессии. */
  useEffect(() => {
    if (drillPath.length === 0 || folders.length === 0) return;
    const ids = new Set(folders.map(f => f.id));
    const firstMissing = drillPath.findIndex(id => !ids.has(id));
    if (firstMissing >= 0) {
      setDrillPath(drillPath.slice(0, firstMissing));
    }
  }, [drillPath, folders, setDrillPath]);

  const activeFolderId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('catalog_folder');
    return raw ? Number(raw) : null;
  }, [location.search]);

  // Топ-уровень дерева (root folders) — для отображения в правой колонке.
  const rootFolders = useMemo(
    () => folders.filter(f => f.parent_id === null),
    [folders],
  );

  /* Цвет root-департамента (из палитры по индексу position/id).
     Вспомогательная мапа — нужна как для списка root'ов, так и для drill-
     хедеров, чтобы точка показывала цвет именно корневого департамента
     этой ветки (а не промежуточного подраздела). */
  const rootColorMap = useMemo(() => {
    const map = new Map<number, string>();
    rootFolders.forEach((f, idx) => map.set(f.id, pickColor(idx)));
    return map;
  }, [rootFolders]);

  /* Текущая папка дрилла (последний id в drillPath) и её root-предок. */
  const currentFolderId = drillPath[drillPath.length - 1] ?? null;
  const currentFolder = useMemo<CatalogFolderNode | null>(
    () =>
      currentFolderId === null
        ? null
        : (folders.find(f => f.id === currentFolderId) ?? null),
    [folders, currentFolderId],
  );
  const currentRootId = drillPath[0] ?? null;
  const currentRootColor =
    currentRootId !== null
      ? (rootColorMap.get(currentRootId) ?? DS2_VARS.cSky)
      : DS2_VARS.cSky;

  /* Подпапки текущего уровня (прямые дети currentFolder). */
  const currentSubfolders = useMemo(
    () =>
      currentFolderId === null
        ? []
        : folders
            .filter(f => f.parent_id === currentFolderId)
            .sort((a, b) => a.position - b.position || a.id - b.id),
    [folders, currentFolderId],
  );

  /* Объекты в текущей папке (того же scope, что выбран). */
  const drilled = useCatalogFolderItems(currentFolderId, scope);

  // Заглушки: реальные данные favourites/recent появятся в отдельной задаче
  // (требуют отдельных API endpoint'ов). Layout pixel-perfect готов — нужно
  // только заполнить реальными данными.
  const favourites: Array<{
    id: number;
    title: string;
    meta: string;
    kind: string;
  }> = [];
  const recent: Array<{
    id: number;
    title: string;
    meta: string;
    time: string;
    kind: string;
  }> = [];

  /* Откат draft-очереди: просто выкидывает pending ops — реальное
     состояние на сервере не трогаем. «Было 3 папки, объединил в 2,
     нажал Сбросить → снова 3 как было». Подтверждения не спрашиваем:
     pending-изменения не были зафиксированы и restore моментальный. */
  const resetAll = useCallback(() => {
    draft.discard();
  }, [draft]);

  /* Коммит draft-очереди: проигрывает все накопленные операции на
     сервер в порядке, в котором их накидал юзер. После успеха baseline
     обновляется через refresh (вызывается внутри draft.commit через
     onCommitted). */
  const saveAll = useCallback(async () => {
    if (!draft.dirty) return;
    await draft.commit();
  }, [draft]);

  return (
    <>
      {/* Scope toggle в шапке Drawer'а — на одной строке с «КАТАЛОГ» и «×»
          через Portal. Показываем в обоих табах (overview и manage), чтобы
          пользователь мог переключать тип объектов не теряя контекст. */}
      <DrawerHeaderPortal>
        <ScopeToggle role="tablist" aria-label={t('Тип объекта каталога')}>
          <ScopeBtn
            type="button"
            role="tab"
            $active={scope === 'dashboard'}
            aria-selected={scope === 'dashboard'}
            onClick={() => setScope('dashboard')}
          >
            {t('Дашборды')}
          </ScopeBtn>
          <ScopeBtn
            type="button"
            role="tab"
            $active={scope === 'chart'}
            aria-selected={scope === 'chart'}
            onClick={() => setScope('chart')}
          >
            {t('Чарты')}
          </ScopeBtn>
        </ScopeToggle>
      </DrawerHeaderPortal>

      {/* Overview (3 колонки): Избранное / История / Департаменты */}
      <TabView $active={tab === 'overview'}>
        <Grid>
          {/* Колонка 1: Избранное */}
          <Col>
            <ColHead
              type="button"
              onClick={() =>
                navTo(
                  `${listBasePath}?filters=(favorite:(label:Yes,value:!t))&pageIndex=0&sortColumn=changed_on_delta_humanized&sortOrder=desc&viewMode=table`,
                )
              }
              aria-label={t('Открыть список избранного')}
            >
              <IconHeadStar />
              <span className="col-head-label">{t('Избранное')}</span>
              <ColHeadCount>{favourites.length}</ColHeadCount>
              <span className="col-head-arrow" aria-hidden>
                ›
              </span>
            </ColHead>
            <ColBody>
              {favourites.length === 0 ? (
                <Empty>
                  <IconStarBig />
                  {scope === 'dashboard'
                    ? t('Пока нет избранных дашбордов')
                    : t('Пока нет избранных чартов')}
                </Empty>
              ) : (
                favourites.map(item => (
                  <Item key={item.id} type="button">
                    <ItemIc>{iconForKind(item.kind)}</ItemIc>
                    <ItemBody>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemMeta>{item.meta}</ItemMeta>
                    </ItemBody>
                  </Item>
                ))
              )}
            </ColBody>
          </Col>

          {/* Колонка 2: История */}
          <Col>
            {/* История — переход на list page текущего scope, отсортированный
              по дате последнего изменения (changed_on_delta_humanized).
              Отдельной страницы «История» в Superset нет — но сортировка
              по «последнее изменение» даёт тот же UX: сверху свежее. */}
            <ColHead
              type="button"
              onClick={() =>
                navTo(
                  `${listBasePath}?pageIndex=0&sortColumn=changed_on_delta_humanized&sortOrder=desc&viewMode=table`,
                )
              }
              aria-label={t('Открыть список недавних')}
            >
              <IconHeadClock />
              <span className="col-head-label">{t('История')}</span>
              <ColHeadCount>{recent.length}</ColHeadCount>
              <span className="col-head-arrow" aria-hidden>
                ›
              </span>
            </ColHead>
            <ColBody>
              {recent.length === 0 ? (
                <Empty>
                  <IconClockBig />
                  {t('Здесь появятся недавно открытые объекты')}
                </Empty>
              ) : (
                recent.map(item => (
                  <Item key={item.id} type="button">
                    <ItemIc>{iconForKind(item.kind)}</ItemIc>
                    <ItemBody>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemMeta>{item.meta}</ItemMeta>
                    </ItemBody>
                    <ItemTime>{item.time}</ItemTime>
                  </Item>
                ))
              )}
            </ColBody>
          </Col>

          {/* Колонка 3: Департаменты. Два режима (мокап .sc-col):
            1) drillPath пуст → заголовок «ДЕПАРТАМЕНТЫ» (клик → list page),
               тело — root-папки (клик по строке → drill-in).
            2) drillPath не пуст → заголовок-back (стрелка + dot + имя папки),
               тело — подпапки + объекты текущего уровня.
            Счётчики берём из item_counts_by_type[scope] — scope-specific,
            чтобы юзер не путался total-цифрой. */}
          <Col>
            {drillPath.length === 0 ? (
              <>
                <ColHead
                  type="button"
                  onClick={() => navTo(listBasePath)}
                  aria-label={
                    scope === 'dashboard'
                      ? t('Открыть список дашбордов')
                      : t('Открыть список чартов')
                  }
                >
                  <IconHeadGrid />
                  <span className="col-head-label">{t('Департаменты')}</span>
                  <ColHeadCount>{rootFolders.length}</ColHeadCount>
                  <span className="col-head-arrow" aria-hidden>
                    ›
                  </span>
                </ColHead>
                <ColBody>
                  {rootFolders.length === 0 ? (
                    <Empty>
                      <IconFolderBig />
                      {t(
                        'Папок пока нет. Создайте первую через «Управление каталогом».',
                      )}
                    </Empty>
                  ) : (
                    rootFolders.map((folder, idx) => {
                      const scopedCount =
                        folder.item_counts_by_type?.[scope] ?? 0;
                      return (
                        <Dept
                          key={folder.id}
                          type="button"
                          onClick={() => setDrillPath([folder.id])}
                          aria-current={
                            activeFolderId === folder.id ? 'true' : undefined
                          }
                        >
                          <DeptDot $color={pickColor(idx)} />
                          <DeptName>
                            {folder.is_default
                              ? deriveDefaultFolderName(labels.dept)
                              : folder.name}
                          </DeptName>
                          <DeptCount>{scopedCount}</DeptCount>
                          <IconDeptChev />
                        </Dept>
                      );
                    })
                  )}
                </ColBody>
              </>
            ) : (
              <>
                <DrillHead
                  type="button"
                  onClick={() => setDrillPath(drillPath.slice(0, -1))}
                  aria-label={t('Назад')}
                  title={t('Назад')}
                >
                  <IconDrillBack />
                  <DrillDot $color={currentRootColor} />
                  <span className="drill-name">
                    {currentFolder
                      ? currentFolder.is_default
                        ? deriveDefaultFolderName(labels.dept)
                        : currentFolder.name
                      : ''}
                  </span>
                  <span className="drill-count">
                    {currentSubfolders.length + drilled.items.length}
                  </span>
                </DrillHead>
                <ColBody>
                  {/* Подпапки текущего уровня — визуально как .sc-dept строки.
                    Цвет точки — custom folder.color если есть, иначе цвет
                    root-ветки (чтобы вся ветка читалась в одном оттенке). */}
                  {currentSubfolders.map(sub => {
                    const scopedCount = sub.item_counts_by_type?.[scope] ?? 0;
                    const dotColor = sub.color ?? currentRootColor;
                    return (
                      <Dept
                        key={`sub-${sub.id}`}
                        type="button"
                        onClick={() => setDrillPath([...drillPath, sub.id])}
                        aria-current={
                          activeFolderId === sub.id ? 'true' : undefined
                        }
                      >
                        <DeptDot $color={dotColor} />
                        <DeptName>
                          {sub.is_default
                            ? deriveDefaultFolderName(labels.dept)
                            : sub.name}
                        </DeptName>
                        <DeptCount>{scopedCount}</DeptCount>
                        <IconDeptChev />
                      </Dept>
                    );
                  })}

                  {/* Объекты текущей папки — клик открывает dashboard/chart и
                    закрывает drawer. markCatalogItemSeen снимает точку
                    «новое» с объекта (item-level badge). */}
                  {drilled.loading ? (
                    <div
                      style={{
                        padding: '24px 12px',
                        fontSize: 11,
                        color: DS2_VARS.g500,
                        fontFamily: DS2_VARS.fontMono,
                        textAlign: 'center',
                      }}
                    >
                      {t('Загрузка…')}
                    </div>
                  ) : drilled.error ? (
                    <div
                      style={{
                        padding: '24px 12px',
                        fontSize: 11,
                        color: DS2_VARS.dn,
                        fontFamily: DS2_VARS.fontMono,
                        textAlign: 'center',
                      }}
                    >
                      {drilled.error}
                    </div>
                  ) : drilled.items.length === 0 &&
                    currentSubfolders.length === 0 ? (
                    <Empty>
                      <IconFolderBig />
                      {scope === 'dashboard'
                        ? t('В этой папке нет дашбордов')
                        : t('В этой папке нет чартов')}
                    </Empty>
                  ) : (
                    drilled.items.map(it => (
                      <Item
                        key={`it-${it.objectType}-${it.id}`}
                        type="button"
                        onClick={() => {
                          markCatalogItemSeen(it.objectType, it.id);
                          navTo(it.url);
                        }}
                        title={it.title}
                      >
                        <ItemIc>{iconForKind(it.kind)}</ItemIc>
                        <ItemBody>
                          <ItemTitle>{it.title}</ItemTitle>
                          <ItemMeta>{it.meta}</ItemMeta>
                        </ItemBody>
                      </Item>
                    ))
                  )}
                </ColBody>
              </>
            )}
          </Col>
        </Grid>
      </TabView>

      {/* Manage (4 колонки drill-down): Департаменты/Подразделы/Папки/Объекты */}
      <TabView $active={tab === 'manage'}>
        <CatalogManageView
          folders={folders}
          onChanged={refresh}
          scope={scope}
          draft={draft}
        />
      </TabView>

      {/* Adaptive footer: в overview — «Управление», в manage — back/hint/reset */}
      {canManage && tab === 'overview' ? (
        <FooterRow>
          <FooterBtn
            $variant="primary"
            type="button"
            onClick={e => {
              e.stopPropagation();
              setTab('manage');
            }}
          >
            <IconGear />
            {t('Управление каталогом')}
          </FooterBtn>
        </FooterRow>
      ) : null}
      {tab === 'manage' ? (
        <FooterRow>
          <FooterBtn
            $variant="primary"
            type="button"
            onClick={e => {
              e.stopPropagation();
              setTab('overview');
            }}
          >
            <IconBack />
            {t('Назад к обзору')}
          </FooterBtn>
          <FooterHint>
            {draft.dirty
              ? t(
                  'Изменений в очереди: %s. Нажмите «Сохранить» для применения.',
                  String(draft.ops.length),
                )
              : t('Перетащите элементы или папки между уровнями. Максимум ')}
            {draft.dirty ? null : <kbd>{t('3 уровня')}</kbd>}
          </FooterHint>
          <FooterBtn
            $variant="neutral"
            $alignEnd
            type="button"
            onClick={resetAll}
            disabled={!draft.dirty || draft.busy}
            aria-disabled={!draft.dirty || draft.busy}
            title={
              draft.dirty
                ? t('Откатить все несохранённые изменения')
                : t('Нет изменений для сброса')
            }
          >
            <IconReset />
            {t('Сбросить')}
          </FooterBtn>
          <FooterBtn
            $variant="primary"
            $active={draft.dirty && !draft.busy}
            type="button"
            onClick={saveAll}
            disabled={!draft.dirty || draft.busy}
            aria-disabled={!draft.dirty || draft.busy}
            title={
              draft.dirty
                ? t('Применить все несохранённые изменения')
                : t('Нет изменений для сохранения')
            }
          >
            {draft.busy ? t('Сохраняем…') : t('Сохранить')}
          </FooterBtn>
        </FooterRow>
      ) : null}
    </>
  );
};
