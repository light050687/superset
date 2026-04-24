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
 * BuilderDrawer — edit-mode конструктор: выбор готовых чартов
 * (SliceAdder) и layout-элементов (Row / Column / Tabs / Markdown /
 * Divider / Header / DynamicComponents). Раньше жил sticky-sidebar'ом
 * справа (BuilderComponentPane), теперь — Shell-drawer'ом снизу
 * (kind='builder'), чтобы занимать всю ширину экрана и быть одной
 * из нижних панелей вместе с фильтрами/каталогом.
 *
 * Табы «Чарты / Оформление» рендерятся в DRAWER_HEAD_CENTER через
 * React Portal — как ScopeToggle у CatalogDrawer'а. Body получает
 * tabs state через ref и показывает соответствующий контент.
 */
import { useEffect, useMemo, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { css, styled, t } from '@superset-ui/core';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import SliceAdder from 'src/dashboard/containers/SliceAdder';
import dashboardComponents from 'src/visualizations/presets/dashboardComponents';
import { DRAWER_HEAD_CENTER_ID } from 'src/views/components/Shell/Drawer';
import NewColumn from 'src/dashboard/components/gridComponents/new/NewColumn';
import NewDivider from 'src/dashboard/components/gridComponents/new/NewDivider';
import NewHeader from 'src/dashboard/components/gridComponents/new/NewHeader';
import NewRow from 'src/dashboard/components/gridComponents/new/NewRow';
import NewTabs from 'src/dashboard/components/gridComponents/new/NewTabs';
import NewMarkdown from 'src/dashboard/components/gridComponents/new/NewMarkdown';
import NewDynamicComponent from 'src/dashboard/components/gridComponents/new/NewDynamicComponent';

type TabKey = 'charts' | 'layout';

/* ─── Styled — header tabs (ScopeToggle-style) ──────────────────── */

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
  background: ${({ $active }) =>
    $active ? DS2_VARS.s : 'transparent'};
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

/* ─── Styled — body layout ──────────────────────────────────────── */

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
  /* SliceAdder изначально был sticky-sidebar'ом 374px. Внутри
     bottom-sheet drawer'а мы даём ему всю доступную ширину, но
     grid/list чартов SliceAdder сам решает layout. Высота 100%
     — чтобы его внутренний skeleton/list scroll'ился. */
  & > div {
    height: 100%;
  }
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s2}px 0;
`;

const LayoutItemWrap = styled.div`
  ${() => css`
    /* Все New* компоненты из gridComponents/new — draggable. Мы
       оставляем их дефолтный внутренний UI, но выравниваем в grid
       (раньше был вертикальный список в узкой sidebar'е). */
    & .new-component {
      width: 100%;
    }
  `}
`;

/* ─── Component ──────────────────────────────────────────────────── */

export const BuilderDrawer: FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('charts');
  const [centerEl, setCenterEl] = useState<HTMLElement | null>(null);

  /* Ловим drawer-head center mount-node после открытия drawer'а. */
  useEffect(() => {
    const find = () => {
      const el = document.getElementById(DRAWER_HEAD_CENTER_ID);
      if (el) setCenterEl(el);
    };
    find();
    /* Если drawer только открывается, node может ещё не смонтироваться
       в этот tick. Ловим следующим rAF. */
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

  return (
    <Body>
      {centerEl ? createPortal(tabs, centerEl) : null}
      {activeTab === 'charts' ? (
        <ChartsPanel>
          <SliceAdder />
        </ChartsPanel>
      ) : (
        <LayoutItemWrap>
          <LayoutGrid>
            <NewTabs />
            <NewRow />
            <NewColumn />
            <NewHeader />
            <NewMarkdown />
            <NewDivider />
            {dashboardComponents
              .getAll()
              .map(({ key: componentKey, metadata }) => (
                <NewDynamicComponent
                  key={componentKey}
                  metadata={metadata}
                  componentKey={componentKey}
                />
              ))}
          </LayoutGrid>
        </LayoutItemWrap>
      )}
    </Body>
  );
};

export default BuilderDrawer;
