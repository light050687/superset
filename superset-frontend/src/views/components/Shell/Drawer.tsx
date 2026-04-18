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
 */
import { styled, t } from '@superset-ui/core';
import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { IconClose } from './RailIcons';
import { useShell } from './ShellContext';
import type { DrawerKind } from './types';

export const DRAWER_WIDTH = 220;

const DrawerAside = styled.aside<{ $open: boolean }>`
  width: ${({ $open }) => ($open ? `${DRAWER_WIDTH}px` : '0')};
  flex-shrink: 0;
  background: ${DS2_VARS.s};
  border-right: 1px solid ${DS2_VARS.g100};
  overflow: hidden;
  transition: width 0.2s ${DS2_VARS.ease};
  display: flex;
  flex-direction: column;
  z-index: 15;

  /* ShellRoot на 100vh + overflow:hidden делает Drawer просто flex-ребёнком
     фиксированной высоты. Внутренний скролл (DrawerBody) отвечает за
     длинное дерево папок. */
  height: 100vh;

  @media print {
    display: none;
  }
`;

const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${DS2_SPACE.s4}px ${DS2_SPACE.s4}px ${DS2_SPACE.s3}px;
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

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const DrawerFooter = styled.div`
  padding: ${DS2_SPACE.s2}px;
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
};

export const Drawer: FC<DrawerProps> = ({
  titles = {},
  content = {},
  footer = {},
}) => {
  const { openedDrawer, closeDrawer } = useShell();
  const asideRef = useRef<HTMLElement | null>(null);

  // Escape закрывает drawer, когда фокус внутри него.
  useEffect(() => {
    if (!openedDrawer) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [openedDrawer, closeDrawer]);

  const kind = openedDrawer;
  const title = kind
    ? titles[kind] ?? t(DEFAULT_TITLES[kind])
    : '';
  const bodyNode = kind ? content[kind] : null;
  const footerNode = kind ? footer[kind] : null;

  return (
    <DrawerAside
      ref={asideRef as never}
      $open={openedDrawer !== null}
      aria-hidden={openedDrawer === null}
      aria-label={kind ? title : undefined}
    >
      {kind ? (
        <>
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
    </DrawerAside>
  );
};
