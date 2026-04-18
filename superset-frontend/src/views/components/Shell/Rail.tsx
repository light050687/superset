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

/** Сохраняется как исторический псевдоним. Реальная высота — DS2_DOCK.height. */
export const RAIL_WIDTH = 56;

/**
 * Floating Dock — горизонтальный плавающий dock (иконочный bar) внизу экрана.
 * Пришёл на смену вертикальному Rail (56px слева) согласно мокапу
 * analytics-floating-dock.html. Использует Liquid Glass + macOS-style
 * magnification. Прежнее имя `RailNav` сохранено для обратной совместимости
 * импортов, но теперь это горизонтальная пилюля, не вертикальный sidebar.
 */
const RailNav = styled.nav`
  position: fixed;
  bottom: ${DS2_VARS.dockBottom};
  left: 50%;
  transform: translateX(-50%);
  height: ${DS2_VARS.dockHeight};
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  padding: 0 ${DS2_SPACE.s3}px;
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.glassFilter};
  -webkit-backdrop-filter: ${DS2_VARS.glassFilter};
  border: 1px solid ${DS2_VARS.glassBorder};
  border-radius: ${DS2_VARS.rPill};
  box-shadow: ${DS2_VARS.glassShadow};
  z-index: 101;

  @media print {
    display: none;
  }

  @media (max-width: 767px) {
    /* На узких экранах FloatingDock не рендерится — вместо него MobileNav.
       Если устройство случайно приземлилось здесь, не уродуем layout. */
    left: ${DS2_SPACE.s2}px;
    right: ${DS2_SPACE.s2}px;
    transform: none;
    padding: 0 ${DS2_SPACE.s2}px;
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform ${DS2_VARS.magnifyDuration} ${DS2_VARS.ease},
    box-shadow ${DS2_VARS.magnifyDuration} ${DS2_VARS.ease};

  &:hover {
    transform: translateY(calc(-1 * ${DS2_VARS.magnifyLift}))
      scale(${DS2_VARS.magnifyScale});
    box-shadow: 0 8px 24px rgba(59, 139, 217, 0.35);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/**
 * Rail-кнопка с magnetic magnification (macOS dock style).
 *
 * При hover:
 *   - Активная иконка поднимается на --magnify-lift и увеличивается до
 *     --magnify-scale (1.1)
 *   - Соседние иконки увеличиваются до --magnify-neighbor (1.05) через
 *     селектор :has() — пропадает в браузерах без поддержки (graceful fallback)
 *
 * Active-состояние (открытый drawer) визуализируется тонким индикатором
 * (точкой) под иконкой, без изменения фона — дизайн требует чистого dock'а.
 */
const RailButton = styled.button<{ $active?: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: ${DS2_RADIUS.card}px;
  border: none;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g500)};
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    transform ${DS2_VARS.magnifyDuration} ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
    transform: translateY(calc(-1 * ${DS2_VARS.magnifyLift}))
      scale(${DS2_VARS.magnifyScale});
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${({ $active }) =>
      $active ? DS2_VARS.cSky : 'transparent'};
    transform: translateX(-50%);
    transition: background 0.12s ${DS2_VARS.ease};
  }
`;

/**
 * Magnetic-эффект соседей: увеличиваем кнопки, смежные с той, над которой hover.
 * Работает через :has() (Safari 15.4+, Chromium 105+, Firefox 121+).
 * В браузерах без :has() — просто базовый scale(1.1) на hover-иконке, без magnetic.
 */
const RailMagnet = styled.div`
  display: contents;

  @supports selector(:has(*)) {
    /* Нативный :has для соседей */
    ${RailButton}:hover + ${RailButton},
    ${RailButton}:has(+ ${RailButton}:hover) {
      transform: scale(${DS2_VARS.magnifyNeighbor});
    }
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
  box-shadow: 0 0 0 2px ${DS2_VARS.glassBg};
`;

const RailSeparator = styled.span`
  width: 1px;
  height: 24px;
  background: ${DS2_VARS.g200};
  margin: 0 ${DS2_SPACE.s1}px;
  flex-shrink: 0;
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform ${DS2_VARS.magnifyDuration} ${DS2_VARS.ease};

  &:hover {
    transform: translateY(calc(-1 * ${DS2_VARS.magnifyLift}))
      scale(${DS2_VARS.magnifyScale});
  }

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

  /**
   * Порядок кнопок floating dock по мокапу analytics-floating-dock.html:
   *   Logo · Home · Catalog · Tools · Create · [Search/CentralPill] ·
   *   Calendar · Theme · AI · Separator · Avatar
   *
   * В Этапе 1 на месте CentralPill стоит привычная кнопка rail-search
   * (IconSearch). Она будет заменена на морфирующую капсулу в Этапе 2.
   * separatorBefore: true на Avatar → разделитель перед аватаром.
   */
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
      },
      {
        id: 'rail-theme',
        label: t('Сменить тему'),
        icon: <IconTheme />,
        onClick: onToggleTheme,
      },
      {
        id: 'rail-ai',
        label: t('ИИ-аналитик'),
        icon: <IconAi />,
        onClick: onOpenAi,
        badgeColor: aiBadgeColor,
      },
      {
        id: 'rail-settings',
        label: t('Настройки и профиль'),
        icon: <IconSettings />,
        onClick: onOpenSettings,
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
      <RailMagnet>
        {buttons.map(btn => (
          <span key={btn.id} style={{ display: 'contents' }}>
            {btn.separatorBefore ? <RailSeparator role="presentation" /> : null}
            {renderButton(btn)}
          </span>
        ))}
      </RailMagnet>
    </RailNav>
  );
};
