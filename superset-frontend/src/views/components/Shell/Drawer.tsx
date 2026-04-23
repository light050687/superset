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
 * Drawer — bottom sheet для Catalog / Tools / Create.
 * Выезжает снизу (над floating dock) по клику по rail-кнопке.
 * Liquid Glass стилизация, drag-handle сверху, close button в head.
 * Закрывается: Esc, клик по той же rail-кнопке, клик вне sheet'а.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { IconClose } from './RailIcons';
import { useShell } from './ShellContext';
import type { DrawerKind } from './types';

/** Сохраняется для обратной совместимости импортов — теперь это максимум по высоте. */
export const DRAWER_WIDTH = 220;

/**
 * Bottom sheet. Выезжает снизу (height: 0 → max-height), центрирован по
 * горизонтали. Стоит над floating dock (bottom: dockDrawerBottom).
 *
 * Мокап различает размер для разных типов:
 * - catalog: `.is-catalog` width min(96vw, 1200px), max-height min(640px, 80vh)
 * - tools / create / default: ~760px × 320px
 * Разделяем через проп $kind.
 */
const DrawerSheet = styled.aside<{ $open: boolean; $kind: 'catalog' | 'other' }>`
  position: fixed;
  bottom: ${DS2_VARS.drawerBottom};
  left: 50%;
  transform: translateX(-50%)
    translateY(${({ $open }) => ($open ? '0' : '20px')});
  /* Единый размер для всех drawer'ов (catalog/tools/create/AI history) —
     по дизайн-запросу: min(96vw, 1200px) × min(640px, 80vh). */
  width: min(96vw, 1200px);
  max-height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  overflow: hidden;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: ${DS2_VARS.drawerShadow};
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    max-height 0.28s ${DS2_VARS.ease},
    transform 0.28s ${DS2_VARS.ease},
    opacity 0.2s ${DS2_VARS.ease};
  /* Выше ShellMain контента (1) и ниже dropdowns/AI overlay/dock. */
  z-index: 95;

  @media print {
    display: none;
  }

  @media (max-width: 767px) {
    /* На mobile — полноэкранный bottom sheet, 90vh, без transform. */
    left: ${DS2_SPACE.s1}px;
    right: ${DS2_SPACE.s1}px;
    transform: none;
    width: auto;
    bottom: ${DS2_VARS.dockMobileHeight};
    max-height: 90vh;
    height: ${({ $open }) => ($open ? '90vh' : '0')};
  }
`;

/* Мокап `.drawer-handle`: 36×4, margin 10 auto 0, opacity 0.5. */
const DragHandle = styled.div`
  width: 36px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  opacity: 0.5;
  flex-shrink: 0;
`;

/* Мокап `.drawer-head`: padding 8 22 10. 3-колоночный layout чтобы
   кастомные drawer-ы могли инжектить свой UI по центру (например,
   CatalogDrawer кладёт туда ScopeToggle через React Portal). Центр
   выравнивается по оси независимо от ширины title/close. */
const DrawerHead = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 8px 22px 10px;
  flex-shrink: 0;
  gap: 12px;
`;

const DrawerHeadCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
`;

const DrawerHeadRight = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

/** id-mount для React Portal-а из drawer-чайлдов (CatalogDrawer
 *  инжектит ScopeToggle — «Дашборды/Чарты»). Общий id используется
 *  для lookup'а через document.getElementById внутри portal-обёртки. */
export const DRAWER_HEAD_CENTER_ID = 'shell-drawer-header-center';
/** id-mount для Portal'а в правую часть drawer-шапки, СЛЕВА от кнопки
 *  закрытия (крестика). FiltersDrawer инжектит сюда шестерёнку
 *  (FilterBarSettings) — она визуально стоит рядом с ×. */
export const DRAWER_HEAD_RIGHT_ID = 'shell-drawer-header-right';

/* Мокап `.drawer-title`: font 12 / weight 700 / uppercase / ls 0.06em sans. */
const DrawerTitle = styled.span`
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
  white-space: nowrap;
`;

const DrawerClose = styled.button`
  background: none;
  border: none;
  color: ${DS2_VARS.g500};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.ink};
    background: ${DS2_VARS.g100};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

/**
 * Body — нейтральный scroll-контейнер. Внутренние drawer-компоненты
 * (CatalogDrawer / ToolsDrawer / CreateDrawer) сами задают grid/flex layout
 * в соответствии со своей семантикой. max-width ограничивает ширину
 * содержимого на сверхшироких экранах (дашборд может быть 2560px+).
 */
/* Мокап .drawer-body: padding 4 22 18 (default), scrollbar 3px g300.
   Catalog (.cat-body): $flush=true → padding 0 — grid занимает всю ширину. */
const DrawerBody = styled.div<{ $flush: boolean }>`
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: ${({ $flush }) => ($flush ? 'hidden' : 'auto')};
  overflow-x: hidden;
  padding: ${({ $flush }) => ($flush ? '0' : '4px 22px 18px')};
  display: ${({ $flush }) => ($flush ? 'flex' : 'block')};
  flex-direction: column;

  /* DS 2.0 scrollbar (такой же как в ShellMain): 10px, g300 thumb с
     padding-box border-clip (2px транспарент-обводка создаёт «воздух»
     внутри thumb'а). Hover — g400. Firefox получает scrollbar-color. */
  scrollbar-width: thin;
  scrollbar-color: ${DS2_VARS.g300} transparent;
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 5px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${DS2_VARS.g400};
    background-clip: padding-box;
  }
`;

const DrawerFooter = styled.div`
  padding: 10px 22px 14px;
  border-top: 1px solid ${DS2_VARS.g100};
  flex-shrink: 0;
`;

const DrawerPlaceholder = styled.div`
  padding: ${DS2_SPACE.s4}px ${DS2_SPACE.s3}px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  color: ${DS2_VARS.g500};
  line-height: 1.5;
`;

interface DrawerProps {
  /** Маппинг kind → заголовок (RU). */
  titles?: Partial<Record<DrawerKind, string>>;
  /** Маппинг kind → контент body. Если не задан — placeholder. */
  content?: Partial<Record<DrawerKind, ReactNode>>;
  /** Маппинг kind → контент footer. */
  footer?: Partial<Record<DrawerKind, ReactNode>>;
}

const DEFAULT_TITLES: Record<DrawerKind, string> = {
  catalog: 'Каталог',
  tools: 'Инструменты',
  create: 'Создать',
  filters: 'Фильтры дашборда',
  pages: 'Страницы дашборда',
};

export const Drawer: FC<React.PropsWithChildren<DrawerProps>> = ({
  titles = {},
  content = {},
  footer = {},
}) => {
  const { openedDrawer, closeDrawer } = useShell();
  const asideRef = useRef<HTMLElement | null>(null);

  // Esc закрывает drawer; click-outside — тоже, но с mousedown-tracking.
  useEffect(() => {
    if (!openedDrawer) return undefined;
    const isAnyModalOpen = () =>
      document.querySelector('.ant-modal-wrap, [role="dialog"].ant-modal') !==
      null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        /* Если поверх drawer'а открыт AntD-modal — даём модалке
           поймать Escape первой (она закроется), drawer не трогаем.
           Иначе оба закрываются одновременно и юзер теряет контекст. */
        if (isAnyModalOpen()) return;
        closeDrawer();
      }
    };
    /**
     * Стандартный паттерн «close on outside click» с mousedown-tracking.
     * Проблема простого listener'а на click: если click внутри drawer
     * вызывает React-ре-рендер (например, переключение таба), к моменту
     * bubbling'а до document target-элемент может быть уже удалён из DOM,
     * и `drawer.contains(target)` возвращает false → drawer ложно
     * закрывается. Решение: фиксируем «начало клика» на mousedown (capture
     * phase — до React-handler'ов и ре-рендеров), и закрываем только если
     * mousedown был ВНЕ drawer и nav.
     */
    let mouseDownWasOutside = false;

    const isOutside = (path: EventTarget[]): boolean => {
      // composedPath стабилен на capture phase и содержит путь ещё до
      // любых React изменений DOM.
      const inDrawer = path.some(
        el =>
          el instanceof Element &&
          el.getAttribute?.('data-shell-drawer') === 'true',
      );
      if (inDrawer) return false;
      const inRail = path.some(
        el =>
          el instanceof Element &&
          typeof el.matches === 'function' &&
          el.matches('nav[aria-label]'),
      );
      if (inRail) return false;
      /* Модалки каталога (create/rename/delete/confirm) монтируются через
         React portal в document.body — DOM-путь не проходит через drawer.
         Без этой проверки клик на «Сохранить»/«Удалить» в модалке
         воспринимается как клик ВНЕ drawer → drawer закрывается,
         CatalogManageView размонтируется, handleSubmit не успевает
         завершить API-вызов. Маркер выставляется в CatalogModalBox. */
      const inCatalogModal = path.some(
        el =>
          el instanceof Element &&
          el.getAttribute?.('data-catalog-modal') === 'true',
      );
      if (inCatalogModal) return false;
      /* AntD-модалки (CreatePresetModal, ImportPresetModal и любые другие)
         тоже рендерятся portal'ом в body. Клик по overlay/content модалки
         НЕ должен закрывать drawer под ней — иначе create/import/edit
         preset прерывают взаимодействие. */
      const inAntdModal = path.some(
        el =>
          el instanceof Element &&
          typeof el.matches === 'function' &&
          (el.matches('.ant-modal') ||
            el.matches('.ant-modal-wrap') ||
            el.matches('.ant-modal-mask')),
      );
      if (inAntdModal) return false;
      return true;
    };

    const onMouseDown = (e: MouseEvent) => {
      const path =
        typeof e.composedPath === 'function'
          ? (e.composedPath() as EventTarget[])
          : [];
      mouseDownWasOutside = isOutside(path);
    };

    const onClick = () => {
      if (mouseDownWasOutside) {
        closeDrawer();
      }
      mouseDownWasOutside = false;
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [openedDrawer, closeDrawer]);

  const kind = openedDrawer;
  const isOpen = kind !== null;
  const title = kind ? titles[kind] ?? t(DEFAULT_TITLES[kind]) : '';
  const bodyNode = kind ? content[kind] : null;
  const footerNode = kind ? footer[kind] : null;

  return (
    <DrawerSheet
      ref={asideRef as never}
      $open={isOpen}
      $kind={kind === 'catalog' ? 'catalog' : 'other'}
      aria-hidden={!isOpen}
      aria-label={kind ? title : undefined}
      role="dialog"
      aria-modal="false"
      data-shell-drawer="true"
    >
      {kind ? (
        <>
          <DragHandle role="presentation" />
          <DrawerHead>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerHeadCenter id={DRAWER_HEAD_CENTER_ID} />
            <DrawerHeadRight>
              <div
                id={DRAWER_HEAD_RIGHT_ID}
                style={{ display: 'flex', alignItems: 'center' }}
              />
              <DrawerClose
                type="button"
                onClick={closeDrawer}
                aria-label={t('Закрыть панель')}
                title={t('Закрыть (Esc)')}
              >
                <IconClose />
              </DrawerClose>
            </DrawerHeadRight>
          </DrawerHead>
          <DrawerBody $flush={kind === 'catalog'}>
            {bodyNode ?? (
              <DrawerPlaceholder>
                {t('Содержимое появится в следующем этапе.')}
              </DrawerPlaceholder>
            )}
          </DrawerBody>
          {footerNode ? <DrawerFooter>{footerNode}</DrawerFooter> : null}
        </>
      ) : null}
    </DrawerSheet>
  );
};
