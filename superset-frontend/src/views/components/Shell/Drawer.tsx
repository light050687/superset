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
 * горизонтали с симметричным отступом 24px от краёв. Стоит над floating dock
 * (bottom: dockDrawerBottom).
 */
const DrawerSheet = styled.aside<{ $open: boolean }>`
  position: fixed;
  left: ${DS2_SPACE.s6}px;
  right: ${DS2_SPACE.s6}px;
  bottom: ${DS2_VARS.dockDrawerBottom};
  max-height: 320px;
  /* Closed state — 0 высота и нулевая непрозрачность, чтобы не ловить клики. */
  height: ${({ $open }) => ($open ? 'min(320px, 60vh)' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  overflow: hidden;
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.glassFilter};
  -webkit-backdrop-filter: ${DS2_VARS.glassFilter};
  border: 1px solid ${DS2_VARS.glassBorder};
  border-radius: ${DS2_VARS.rGlass};
  box-shadow: ${DS2_VARS.glassShadowElev};
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    height 0.22s ${DS2_VARS.ease},
    opacity 0.18s ${DS2_VARS.ease};
  /* Выше ShellMain контента (1) и ниже dropdowns/AI overlay/dock. */
  z-index: 95;

  @media print {
    display: none;
  }

  @media (max-width: 767px) {
    /* На mobile — полноэкранный bottom sheet, 90vh. */
    left: ${DS2_SPACE.s1}px;
    right: ${DS2_SPACE.s1}px;
    bottom: ${DS2_VARS.dockMobileHeight};
    max-height: 90vh;
    height: ${({ $open }) => ($open ? '90vh' : '0')};
  }
`;

const DragHandle = styled.div`
  width: 48px;
  height: 4px;
  margin: ${DS2_SPACE.s1}px auto ${DS2_SPACE.s2}px;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  flex-shrink: 0;
`;

const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${DS2_SPACE.s4}px ${DS2_SPACE.s2}px;
  flex-shrink: 0;
`;

const DrawerTitle = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  font-weight: 600;
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
const DrawerBody = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 ${DS2_SPACE.s4}px ${DS2_SPACE.s4}px;

  &::-webkit-scrollbar {
    height: 4px;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const DrawerFooter = styled.div`
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s4}px;
  border-top: 1px solid ${DS2_VARS.glassBorder};
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
};

export const Drawer: FC<DrawerProps> = ({
  titles = {},
  content = {},
  footer = {},
}) => {
  const { openedDrawer, closeDrawer } = useShell();
  const asideRef = useRef<HTMLElement | null>(null);

  // Esc закрывает drawer; клик вне — тоже.
  useEffect(() => {
    if (!openedDrawer) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!asideRef.current || asideRef.current.contains(target)) return;
      // Игнорируем клики по rail (rail-кнопки сами переключают drawer).
      const nav = document.querySelector('nav[aria-label]');
      if (nav && nav.contains(target)) return;
      closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
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
      aria-hidden={!isOpen}
      aria-label={kind ? title : undefined}
      role="dialog"
      aria-modal="false"
    >
      {kind ? (
        <>
          <DragHandle role="presentation" />
          <DrawerHead>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerClose
              type="button"
              onClick={closeDrawer}
              aria-label={t('Закрыть панель')}
              title={t('Закрыть (Esc)')}
            >
              <IconClose />
            </DrawerClose>
          </DrawerHead>
          <DrawerBody>
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
