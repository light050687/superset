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
import { type FC, type RefObject, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { useShell } from './ShellContext';
import {
  IconAi,
  IconCalendar,
  IconCatalog,
  IconCreate,
  IconHome,
  IconSearch,
  IconSettings,
  IconTheme,
  IconTools,
} from './RailIcons';
import type { RailButtonDescriptor } from './types';

export const RAIL_WIDTH = 56;

const RailNav = styled.nav`
  width: ${RAIL_WIDTH}px;
  flex-shrink: 0;
  background: ${DS2_VARS.s};
  border-right: 1px solid ${DS2_VARS.g100};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${DS2_SPACE.s3}px 0;
  gap: ${DS2_SPACE.s1}px;
  z-index: 20;

  /* Rail закреплён — не скроллится вместе с контентом страницы.
     height:100vh + sticky top:0 держат rail у верхнего края вьюпорта,
     внутренний overflow-y обеспечивает прокрутку самих кнопок если их
     станет больше чем влезает по высоте. */
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 0;
  }

  @media print {
    display: none;
  }
`;

const RailLogo = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${DS2_RADIUS.card}px;
  background: ${DS2_VARS.cSky};
  color: ${DS2_VARS.s};
  font-family: ${DS2_VARS.fontSans};
  font-weight: 800;
  font-size: 13px;
  border: none;
  cursor: pointer;
  margin-bottom: ${DS2_SPACE.s2}px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const RailButton = styled.button<{ $active?: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: ${DS2_RADIUS.card}px;
  border: none;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g500)};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
    width: 18px;
    height: 18px;
  }
`;

const RailBadgeDot = styled.span<{ $color: string }>`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px ${DS2_VARS.s};
`;

const RailSeparator = styled.span`
  width: 24px;
  height: 1px;
  background: ${DS2_VARS.g100};
  margin: ${DS2_SPACE.s1}px 0;
`;

const RailSpacer = styled.div`
  flex: 1;
`;

const RailAvatar = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${DS2_VARS.cViolet};
  color: ${DS2_VARS.s};
  font-family: ${DS2_VARS.fontSans};
  font-size: 10px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

interface RailProps {
  /** Инициалы пользователя для аватара (2 символа). */
  userInitials?: string;
  /** Базовый путь приложения (для react-router push). */
  brandUrl?: string;
  /** Хендлер клика по бренду. Если не задан — навигация на brandUrl. */
  onBrandClick?: () => void;
  /** Хендлер открытия глобального поиска (Command Palette). */
  onOpenSearch?: () => void;
  /** Хендлер открытия календаря. */
  onOpenCalendar?: () => void;
  /** Хендлер переключения темы. */
  onToggleTheme?: () => void;
  /** Хендлер открытия AI. */
  onOpenAi?: () => void;
  /** Хендлер открытия профиля/настроек. */
  onOpenSettings?: () => void;
  /** Бейдж на AI-кнопке (color token или hex). */
  aiBadgeColor?: string;
  /** Бейдж на календаре. */
  calendarBadgeColor?: string;
  /** Бейдж на каталоге (индикатор новинок). */
  catalogBadgeColor?: string;
  /** Ref на кнопку настроек (нужен SettingsDropdown для позиционирования). */
  settingsButtonRef?: RefObject<HTMLButtonElement>;
  /** Ref на кнопку календаря (для CalendarDropdown). */
  calendarButtonRef?: RefObject<HTMLButtonElement>;
}

export const Rail: FC<RailProps> = ({
  userInitials = '',
  brandUrl = '/',
  onBrandClick,
  onOpenSearch,
  onOpenCalendar,
  onToggleTheme,
  onOpenAi,
  onOpenSettings,
  aiBadgeColor,
  calendarBadgeColor,
  catalogBadgeColor,
  settingsButtonRef,
  calendarButtonRef,
}) => {
  const history = useHistory();
  const { openedDrawer, toggleDrawer, activeRailId } = useShell();

  const buttons = useMemo<RailButtonDescriptor[]>(
    () => [
      {
        id: 'rail-home',
        label: t('Главная'),
        icon: <IconHome />,
        href: '/superset/welcome/',
      },
      {
        id: 'rail-catalog',
        label: t('Каталог'),
        icon: <IconCatalog />,
        drawer: 'catalog',
        badgeColor: catalogBadgeColor,
      },
      {
        id: 'rail-tools',
        label: t('Инструменты'),
        icon: <IconTools />,
        drawer: 'tools',
      },
      {
        id: 'rail-create',
        label: t('Создать'),
        icon: <IconCreate />,
        drawer: 'create',
      },
      {
        id: 'rail-search',
        label: t('Поиск (Ctrl+K)'),
        icon: <IconSearch />,
        onClick: onOpenSearch,
        hotkey: 'Ctrl+K',
      },
      {
        id: 'rail-calendar',
        label: t('Календарь'),
        icon: <IconCalendar />,
        onClick: onOpenCalendar,
        badgeColor: calendarBadgeColor,
        position: 'bottom',
      },
      {
        id: 'rail-theme',
        label: t('Сменить тему'),
        icon: <IconTheme />,
        onClick: onToggleTheme,
        position: 'bottom',
      },
      {
        id: 'rail-ai',
        label: t('ИИ-аналитик'),
        icon: <IconAi />,
        onClick: onOpenAi,
        badgeColor: aiBadgeColor,
        position: 'bottom',
      },
      {
        id: 'rail-settings',
        label: t('Настройки и профиль'),
        icon: <IconSettings />,
        onClick: onOpenSettings,
        position: 'bottom',
        separatorBefore: true,
      },
    ],
    [
      onOpenSearch,
      onOpenCalendar,
      onToggleTheme,
      onOpenAi,
      onOpenSettings,
      aiBadgeColor,
      calendarBadgeColor,
      catalogBadgeColor,
    ],
  );

  const handleClick = (btn: RailButtonDescriptor) => {
    if (btn.drawer) {
      toggleDrawer(btn.drawer);
      return;
    }
    if (btn.onClick) {
      btn.onClick();
      return;
    }
    if (btn.href) {
      history.push(btn.href);
    }
  };

  const topButtons = buttons.filter(b => b.position !== 'bottom');
  const bottomButtons = buttons.filter(b => b.position === 'bottom');

  const renderButton = (btn: RailButtonDescriptor) => {
    const isActive =
      activeRailId === btn.id ||
      (btn.drawer !== undefined && openedDrawer === btn.drawer);
    const key = btn.id;
    const title = btn.hotkey ? `${btn.label} (${btn.hotkey})` : btn.label;

    if (btn.id === 'rail-settings') {
      return (
        <RailAvatar
          key={key}
          ref={settingsButtonRef}
          type="button"
          onClick={() => handleClick(btn)}
          aria-label={btn.label}
          title={title}
        >
          {userInitials}
        </RailAvatar>
      );
    }

    return (
      <RailButton
        key={key}
        ref={btn.id === 'rail-calendar' ? calendarButtonRef : undefined}
        type="button"
        onClick={() => handleClick(btn)}
        aria-label={btn.label}
        aria-pressed={btn.drawer ? openedDrawer === btn.drawer : undefined}
        title={title}
        $active={isActive}
      >
        {btn.icon}
        {btn.badgeColor ? <RailBadgeDot $color={btn.badgeColor} /> : null}
      </RailButton>
    );
  };

  return (
    <RailNav aria-label={t('Главная навигация')}>
      <RailLogo
        type="button"
        onClick={() => (onBrandClick ? onBrandClick() : history.push(brandUrl))}
        aria-label={t('На главную')}
        title={t('На главную')}
      >
        М
      </RailLogo>
      {topButtons.map(renderButton)}
      <RailSpacer />
      {bottomButtons.map(btn => (
        <span key={btn.id} style={{ display: 'contents' }}>
          {btn.separatorBefore ? <RailSeparator role="presentation" /> : null}
          {renderButton(btn)}
        </span>
      ))}
    </RailNav>
  );
};
