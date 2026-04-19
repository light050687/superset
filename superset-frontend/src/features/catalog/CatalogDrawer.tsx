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
import { useHistory, useLocation } from 'react-router-dom';
import { DS2_VARS } from 'src/theme/ds2';
import { useShell } from 'src/views/components/Shell/ShellContext';
import { CatalogManageView } from './CatalogManageView';
import { deleteCatalogFolder } from './api';
import { useCatalogFolders } from './useCatalogFolders';
import { markCatalogViewed } from './useCatalogHasUpdates';

interface CatalogDrawerProps {
  /** Можно ли пользователю управлять каталогом (кнопка «Управление» в футере). */
  canManage?: boolean;
  /** Колбэк при выборе папки — навигация в список дашбордов с фильтром. */
  onSelectFolder?: (folderId: number) => void;
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

  &:hover {
    background: ${DS2_VARS.bg3};
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
  font-size: 10px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
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

const FooterRow = styled.div`
  padding: 10px 22px 14px;
  border-top: 1px solid ${DS2_VARS.g100};
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const FooterBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 7px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontSans};
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
  white-space: nowrap;

  &:hover {
    border-color: ${DS2_VARS.g300};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 11px;
    height: 11px;
  }
`;

const FooterHint = styled.span`
  flex: 1;
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-align: center;

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
  if (kind === 'chart' || kind === 'диаграмма') return <IconChart />;
  if (kind === 'geo' || kind === 'гео') return <IconGeo />;
  return <IconDashboard />;
}

export const CatalogDrawer: FC<CatalogDrawerProps> = ({
  canManage = true,
  onSelectFolder,
}) => {
  const history = useHistory();
  const location = useLocation();
  const { closeDrawer } = useShell();
  const { folders, refresh } = useCatalogFolders();
  const [tab, setTab] = useState<'overview' | 'manage'>('overview');

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

  const activeFolderId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('catalog_folder');
    return raw ? Number(raw) : null;
  }, [location.search]);

  const handleSelectFolder = useCallback(
    (folderId: number) => {
      if (onSelectFolder) {
        onSelectFolder(folderId);
        return;
      }
      history.push(`/dashboard/list/?catalog_folder=${folderId}`);
    },
    [history, onSelectFolder],
  );

  // Топ-уровень дерева (root folders) — для отображения в правой колонке.
  const rootFolders = useMemo(
    () => folders.filter(f => f.parent_id === null),
    [folders],
  );

  // Заглушки: реальные данные favourites/recent появятся в отдельной задаче
  // (требуют отдельных API endpoint'ов). Layout pixel-perfect готов — нужно
  // только заполнить реальными данными.
  const favourites: Array<{ id: number; title: string; meta: string; kind: string }> = [];
  const recent: Array<{ id: number; title: string; meta: string; time: string; kind: string }> = [];

  const resetAll = async () => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      t('Удалить все департаменты, подразделы и папки? Это необратимо.'),
    );
    if (!ok) return;
    const deptIds = folders
      .filter(f => f.parent_id === null)
      .map(f => f.id);
    for (const id of deptIds) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteCatalogFolder(id);
      } catch {
        // continue
      }
    }
    await refresh();
  };

  return (
    <>
      {/* Overview (3 колонки): Избранное / История / Департаменты */}
      <TabView $active={tab === 'overview'}>
        <Grid>
        {/* Колонка 1: Избранное */}
        <Col>
          <ColHead
            type="button"
            onClick={() =>
              navTo('/dashboard/list/?filters=(favorite:(label:Yes,value:!t))')
            }
            aria-label={t('Открыть список избранного')}
          >
            <IconHeadStar />
            <span className="col-head-label">{t('Избранное')}</span>
            <ColHeadCount>{favourites.length}</ColHeadCount>
            <span className="col-head-arrow" aria-hidden>›</span>
          </ColHead>
          <ColBody>
            {favourites.length === 0 ? (
              <Empty>
                <IconStarBig />
                {t('Пока нет избранных дашбордов')}
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
          <ColHead
            type="button"
            onClick={() => navTo('/superset/welcome/#recent')}
            aria-label={t('Открыть список недавних')}
          >
            <IconHeadClock />
            <span className="col-head-label">{t('История')}</span>
            <ColHeadCount>{recent.length}</ColHeadCount>
            <span className="col-head-arrow" aria-hidden>›</span>
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

        {/* Колонка 3: Департаменты */}
        <Col>
          <ColHead
            type="button"
            onClick={() => navTo('/dashboard/list/')}
            aria-label={t('Открыть список дашбордов')}
          >
            <IconHeadGrid />
            <span className="col-head-label">{t('Департаменты')}</span>
            <ColHeadCount>{rootFolders.length}</ColHeadCount>
            <span className="col-head-arrow" aria-hidden>›</span>
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
              rootFolders.map((folder, idx) => (
                <Dept
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelectFolder(folder.id)}
                  aria-current={activeFolderId === folder.id ? 'true' : undefined}
                >
                  <DeptDot $color={pickColor(idx)} />
                  <DeptName>{folder.name}</DeptName>
                  <DeptCount>{folder.item_count ?? 0}</DeptCount>
                </Dept>
              ))
            )}
          </ColBody>
        </Col>
        </Grid>
      </TabView>

      {/* Manage (4 колонки drill-down): Департаменты/Подразделы/Папки/Объекты */}
      <TabView $active={tab === 'manage'}>
        <CatalogManageView folders={folders} onChanged={refresh} />
      </TabView>

      {/* Adaptive footer: в overview — «Управление», в manage — back/hint/reset */}
      {canManage && tab === 'overview' ? (
        <FooterRow>
          <FooterBtn
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
            {t('Перетащите элементы или папки между уровнями. Максимум ')}
            <kbd>{t('3 уровня')}</kbd>
          </FooterHint>
          <FooterBtn type="button" onClick={resetAll}>
            <IconReset />
            {t('Сбросить')}
          </FooterBtn>
        </FooterRow>
      ) : null}

    </>
  );
};
