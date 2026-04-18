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
 * MobileNav — bottom tab bar для узких экранов (<768px).
 * Рендерится вместо FloatingDock когда `useMediaQuery('(max-width:767px)')`
 * возвращает true. Минималистичный 4-иконочный nav: Home · Catalog · AI ·
 * Settings. Без magnification, без pill — производительность и палец-friendly.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, type RefObject } from 'react';
import { useHistory } from 'react-router-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { IconAi, IconCatalog, IconHome } from './RailIcons';
import { useShell } from './ShellContext';

interface MobileNavProps {
  userInitials?: string;
  onOpenAi?: () => void;
  onOpenSettings?: () => void;
  settingsButtonRef?: RefObject<HTMLButtonElement>;
  aiBadgeColor?: string;
  catalogBadgeColor?: string;
}

const Nav = styled.nav`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${DS2_VARS.dockMobileHeight};
  display: none;
  flex-direction: row;
  align-items: stretch;
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.glassFilter};
  -webkit-backdrop-filter: ${DS2_VARS.glassFilter};
  border-top: 1px solid ${DS2_VARS.glassBorder};
  z-index: 101;
  /* Safe-area iOS (home indicator). */
  padding-bottom: env(safe-area-inset-bottom, 0);

  @media (max-width: 767px) {
    display: flex;
  }

  @media print {
    display: none;
  }
`;

const TabBtn = styled.button<{ $active?: boolean }>`
  flex: 1;
  background: transparent;
  border: none;
  padding: ${DS2_SPACE.s1}px 0;
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g500)};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  transition: color 0.12s ${DS2_VARS.ease};

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const TabLabel = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const TabBadge = styled.span<{ $color: string }>`
  position: absolute;
  top: 8px;
  right: calc(50% - 14px);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px ${DS2_VARS.glassBg};
`;

const AvatarTab = styled.button<{ $active?: boolean }>`
  flex: 1;
  background: transparent;
  border: none;
  padding: ${DS2_SPACE.s1}px 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g500)};

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const AvatarCircle = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${DS2_VARS.cViolet};
  color: ${DS2_VARS.s};
  font-family: ${DS2_VARS.fontSans};
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MobileNav: FC<MobileNavProps> = ({
  userInitials = '',
  onOpenAi,
  onOpenSettings,
  settingsButtonRef,
  aiBadgeColor,
  catalogBadgeColor,
}) => {
  const history = useHistory();
  const { openedDrawer, toggleDrawer } = useShell();

  return (
    <Nav aria-label={t('Главная навигация (мобильная)')}>
      <TabBtn
        type="button"
        onClick={() => history.push('/superset/welcome/')}
        aria-label={t('Главная')}
      >
        <IconHome />
        <TabLabel>{t('Главная')}</TabLabel>
      </TabBtn>
      <TabBtn
        type="button"
        onClick={() => toggleDrawer('catalog')}
        aria-label={t('Каталог')}
        aria-pressed={openedDrawer === 'catalog'}
        $active={openedDrawer === 'catalog'}
      >
        <IconCatalog />
        <TabLabel>{t('Каталог')}</TabLabel>
        {catalogBadgeColor ? <TabBadge $color={catalogBadgeColor} /> : null}
      </TabBtn>
      <TabBtn
        type="button"
        onClick={() => onOpenAi?.()}
        aria-label={t('ИИ-аналитик')}
      >
        <IconAi />
        <TabLabel>{t('ИИ')}</TabLabel>
        {aiBadgeColor ? <TabBadge $color={aiBadgeColor} /> : null}
      </TabBtn>
      <AvatarTab
        ref={settingsButtonRef}
        type="button"
        onClick={onOpenSettings}
        aria-label={t('Настройки и профиль')}
      >
        <AvatarCircle>{userInitials}</AvatarCircle>
        <TabLabel>{t('Профиль')}</TabLabel>
      </AvatarTab>
    </Nav>
  );
};
