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
 * BuilderDrawer — edit-mode конструктор дашборда. Двухтабовый:
 *   • «Чарты»    — SliceAdder (готовые чарты дашборда для DnD).
 *   • «Оформление» — layout-примитивы (Row/Column/Tabs/Markdown/
 *     Divider/Header/DynamicComponents) в стиле ToolsDrawer
 *     (Sections/Grid/Tile — цветная иконка 38×38 + label).
 *
 * Табы «Чарты / Оформление» рендерятся в `DRAWER_HEAD_CENTER` через
 * React Portal (как ScopeToggle у CatalogDrawer'а). «+» для быстрого
 * создания чарта инжектится в `DRAWER_HEAD_RIGHT` — рядом с крестиком.
 */
import { useEffect, useMemo, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { css, styled, t } from '@superset-ui/core';
import { Icons } from '@superset-ui/core/components/Icons';
import { useSelector } from 'react-redux';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import SliceAdder from 'src/dashboard/containers/SliceAdder';
import dashboardComponents from 'src/visualizations/presets/dashboardComponents';
import {
  DRAWER_HEAD_CENTER_ID,
  DRAWER_HEAD_RIGHT_ID,
} from 'src/views/components/Shell/Drawer';
import NewColumn from 'src/dashboard/components/gridComponents/new/NewColumn';
import NewDivider from 'src/dashboard/components/gridComponents/new/NewDivider';
import NewHeader from 'src/dashboard/components/gridComponents/new/NewHeader';
import NewRow from 'src/dashboard/components/gridComponents/new/NewRow';
import NewTabs from 'src/dashboard/components/gridComponents/new/NewTabs';
import NewMarkdown from 'src/dashboard/components/gridComponents/new/NewMarkdown';
import NewDynamicComponent from 'src/dashboard/components/gridComponents/new/NewDynamicComponent';
import type { RootState } from 'src/dashboard/types';
import { navigateTo } from 'src/utils/navigationUtils';

type TabKey = 'charts' | 'layout';

/* ─── Header tabs (ScopeToggle-style) ───────────────────────────── */

const HeadTabs = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 8px;
  background: ${DS2_VARS.g100};
  border: 1px solid ${DS2_VARS.g200};
`;

const HeadTabBtn = styled.button<{ $active: boolean }>`
  min-width: 96px;
  padding: 4px 14px;
  border: none;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? DS2_VARS.s : 'transparent')};
  color: ${({ $active }) => ($active ? DS2_VARS.ink : DS2_VARS.g500)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none'};
  transition:
    background 0.15s ${DS2_VARS.ease},
    color 0.15s ${DS2_VARS.ease};
  &:hover {
    color: ${DS2_VARS.ink};
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/* ─── Header right-icon buttons (portal slot) ───────────────────── */

const HeadIconBtn = styled.button`
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: ${DS2_VARS.g500};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};
  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
  svg {
    width: 14px;
    height: 14px;
  }
`;

/* ─── Body layout ───────────────────────────────────────────────── */

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s3}px;
  height: 100%;
  min-height: 0;
`;

const ChartsPanel = styled.div`
  flex: 1;
  min-height: 0;
  & > div {
    height: 100%;
  }
  /* Скрываем дублирующие элементы из SliceAdder'а — их функции
     подняты в header drawer'а (кнопки «+» и «Только мои» рядом с
     крестиком). Селекторы: первый child SliceAdder'а —
     NewChartButtonContainer; div содержащий checkbox «Show only
     my charts». */
  & > div > :first-child {
    display: none;
  }
  & > div > div:has(> input[type='checkbox']) {
    display: none;
  }
`;

/* Сетка layout-примитивов в tile-стиле ToolsDrawer.
   Каждая плитка — это наш styled-обёртка вокруг оригинального
   New*-компонента (который сам по себе draggable). */
const LayoutSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 0 0;
`;

const SecLabel = styled.div`
  font-size: 9.5px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 2px;
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${DS2_SPACE.s1 + 2}px;
`;

/* TileHost оборачивает оригинальный New*-компонент и переопределяет
   его горизонтальный layout на вертикальный (icon сверху, label
   снизу) — как tile'ы в ToolsDrawer. Оригинальный label New*-
   компонента сохраняется (не дублируется свой сверху). */
const TileHost = styled.div<{ $accent: string }>`
  ${({ theme, $accent }) => css`
    position: relative;
    display: flex;
    align-items: stretch;
    border-radius: 10px;
    overflow: hidden;

    /* Весь оригинальный NewComponent переделываем в вертикальный
       tile. data-test="new-component" — стабильный селектор. */
    & [data-test='new-component'] {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${DS2_SPACE.s2}px;
      padding: 14px 10px 12px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      cursor: grab;
      font-size: 12px;
      font-weight: 600;
      color: ${DS2_VARS.ink};
      text-align: center;
      line-height: 1.1;
      transition:
        background 0.12s ${DS2_VARS.ease},
        border-color 0.12s ${DS2_VARS.ease};
      &:hover {
        background: ${DS2_VARS.tileHoverBg};
        border-color: ${DS2_VARS.tileHoverBorder};
      }
    }

    /* Icon-плитка 38×38 с accent-подложкой — как в ToolsDrawer. */
    & .new-component-placeholder {
      width: 38px;
      height: 38px;
      margin-right: 0;
      border-radius: 10px;
      background: color-mix(in oklab, ${$accent} 12%, ${DS2_VARS.bg3});
      border: 1px solid ${theme.colorBorderSecondary};
      color: ${$accent};
    }
    & .new-component-placeholder svg {
      width: 19px;
      height: 19px;
      color: ${$accent};
    }
  `}
`;

/* ─── Component ──────────────────────────────────────────────────── */

export const BuilderDrawer: FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('charts');
  const [centerEl, setCenterEl] = useState<HTMLElement | null>(null);
  const [rightEl, setRightEl] = useState<HTMLElement | null>(null);

  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );

  /* Ловим drawer-head center и right mount-node'ы. */
  useEffect(() => {
    const find = () => {
      const c = document.getElementById(DRAWER_HEAD_CENTER_ID);
      const r = document.getElementById(DRAWER_HEAD_RIGHT_ID);
      if (c) setCenterEl(c);
      if (r) setRightEl(r);
    };
    find();
    const raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tabs = useMemo(
    () => (
      <HeadTabs role="tablist" aria-label={t('Режим конструктора')}>
        <HeadTabBtn
          type="button"
          role="tab"
          aria-selected={activeTab === 'charts'}
          $active={activeTab === 'charts'}
          onClick={() => setActiveTab('charts')}
        >
          {t('Чарты')}
        </HeadTabBtn>
        <HeadTabBtn
          type="button"
          role="tab"
          aria-selected={activeTab === 'layout'}
          $active={activeTab === 'layout'}
          onClick={() => setActiveTab('layout')}
        >
          {t('Оформление')}
        </HeadTabBtn>
      </HeadTabs>
    ),
    [activeTab],
  );

  /* Header right actions: «Создать чарт» (+) и toggle «Только мои».
     Рендерятся в DRAWER_HEAD_RIGHT через Portal. Видны только на
     табе «Чарты» (layout-таб их не использует). */
  const [showOnlyMy, setShowOnlyMy] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('dashboard:sliceAdder:showOnlyMyCharts') === 'true'
      );
    } catch {
      return false;
    }
  });

  /* Синхронизация toggle'а с внутренним SliceAdder: дергаем его
     checkbox программно — checkbox имеет state + onChange callback,
     который пишет в localStorage. Этого достаточно чтобы SliceAdder
     обновил свой state. */
  const toggleOnlyMy = () => {
    const next = !showOnlyMy;
    setShowOnlyMy(next);
    try {
      localStorage.setItem(
        'dashboard:sliceAdder:showOnlyMyCharts',
        next ? 'true' : 'false',
      );
    } catch {
      /* noop */
    }
    /* Ищем hidden checkbox SliceAdder'а и клик'аем, если его
       current checked state !== next — это триггерит onShowOnlyMyCharts. */
    const cb = document.querySelector<HTMLInputElement>(
      '[role="dialog"][aria-label="Конструктор"] input[type="checkbox"]',
    );
    if (cb && cb.checked !== next) cb.click();
  };

  const headRightActions = useMemo(
    () =>
      activeTab === 'charts' ? (
        <>
          <HeadIconBtn
            type="button"
            aria-label={
              showOnlyMy
                ? t('Показать все чарты')
                : t('Показать только мои чарты')
            }
            title={
              showOnlyMy
                ? t('Показать все чарты')
                : t('Показать только мои чарты')
            }
            aria-pressed={showOnlyMy}
            onClick={toggleOnlyMy}
            style={
              showOnlyMy ? { color: DS2_VARS.cSky } : undefined
            }
          >
            <Icons.UserOutlined iconSize="m" />
          </HeadIconBtn>
          <HeadIconBtn
            type="button"
            aria-label={t('Создать чарт')}
            title={t('Создать чарт')}
            onClick={() => {
              if (dashboardId === undefined) return;
              navigateTo(`/chart/add?dashboard_id=${dashboardId}`, {
                newWindow: true,
              });
            }}
          >
            <Icons.PlusOutlined iconSize="m" />
          </HeadIconBtn>
        </>
      ) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, dashboardId, showOnlyMy],
  );

  const layoutItems: Array<{
    key: string;
    accent: string;
    label: string;
    node: JSX.Element;
  }> = [
    {
      key: 'tabs',
      accent: DS2_VARS.cSky,
      label: t('Вкладки'),
      node: <NewTabs />,
    },
    {
      key: 'row',
      accent: DS2_VARS.cViolet,
      label: t('Ряд'),
      node: <NewRow />,
    },
    {
      key: 'column',
      accent: DS2_VARS.cTangerine,
      label: t('Колонка'),
      node: <NewColumn />,
    },
    {
      key: 'header',
      accent: DS2_VARS.cFuchsia,
      label: t('Заголовок'),
      node: <NewHeader />,
    },
    {
      key: 'markdown',
      accent: DS2_VARS.cAmber,
      label: t('Markdown'),
      node: <NewMarkdown />,
    },
    {
      key: 'divider',
      accent: DS2_VARS.g500,
      label: t('Разделитель'),
      node: <NewDivider />,
    },
  ];

  return (
    <Body>
      {centerEl ? createPortal(tabs, centerEl) : null}
      {rightEl ? createPortal(headRightActions, rightEl) : null}
      {activeTab === 'charts' ? (
        <ChartsPanel>
          <SliceAdder />
        </ChartsPanel>
      ) : (
        <LayoutSections>
          <SecLabel>{t('Базовые блоки')}</SecLabel>
          <LayoutGrid>
            {layoutItems.map(item => (
              <TileHost key={item.key} $accent={item.accent}>
                {item.node}
              </TileHost>
            ))}
          </LayoutGrid>
          {dashboardComponents.getAll().length > 0 && (
            <>
              <SecLabel>{t('Дополнительно')}</SecLabel>
              <LayoutGrid>
                {dashboardComponents
                  .getAll()
                  .map(({ key: componentKey, metadata }) => (
                    <TileHost key={componentKey} $accent={DS2_VARS.cSky}>
                      <NewDynamicComponent
                        metadata={metadata}
                        componentKey={componentKey}
                      />
                    </TileHost>
                  ))}
              </LayoutGrid>
            </>
          )}
        </LayoutSections>
      )}
    </Body>
  );
};

export default BuilderDrawer;
