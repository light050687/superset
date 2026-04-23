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
import {
  type FC,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { CentralPill } from './CentralPill';
import { useDockCollapse } from './useDockCollapse';
import type {
  AiContext,
  AiModelDescriptor,
  AiModelId,
} from './CentralPillTypes';
import { useShell } from './ShellContext';
import {
  IconCalendar,
  IconCatalog,
  IconCreate,
  IconHistory,
  IconHome,
  IconMoon,
  IconSun,
  IconTools,
} from './RailIcons';

/** Историческое имя — сохраняется для обратной совместимости импортов. */
export const RAIL_WIDTH = 56;

/**
 * Floating Dock — горизонтальный плавающий dock по мокапу
 * `analytics-floating-dock.html`. Glass-материал с blur+saturate,
 * magnification на hover, active-состояние с gradient+glow.
 * На узких экранах (<768px) скрыт CSS-ом (вместо него MobileNav).
 */
/**
 * Collapse-to-handle: одна нода, morph между двумя состояниями.
 *   • expanded — полноразмерный dock (700×58, padding 6, border-radius 18,
 *     кнопки видны и кликабельны);
 *   • collapsed — тонкая pill 64×6 по центру, background g300, opacity 0.6.
 *     Кнопки fade-out (opacity 0 + pointer-events none), overflow:hidden
 *     режет их за пределами pill. Кликом/Enter/Space — expand.
 *
 * Анимация через layout-properties (width/height/padding/border-radius/bottom).
 * Layout-thrashing минимизирован `will-change` + единым transition-timing'ом
 * и ограниченной областью (fixed-position, isolated stacking context). Длина
 * 280ms collapse / 220ms expand — Apple iOS-spring cubic-bezier(0.32,0.72,0,1).
 */
const RailNav = styled.nav<{ $collapsed: boolean }>`
  position: fixed;
  /* Когда collapsed — pill садится ближе к нижнему краю (10px), чтобы не
     мозолить глаза. Expanded — штатные 18px от низа. */
  bottom: ${({ $collapsed }) => ($collapsed ? '10px' : DS2_VARS.dockBottom)};
  left: 50%;
  transform: translateX(-50%);
  height: ${({ $collapsed }) => ($collapsed ? '6px' : DS2_VARS.dockHeight)};
  /* max-content — ширина по контенту кнопок в expanded; 64px — в collapsed. */
  width: ${({ $collapsed }) => ($collapsed ? '64px' : 'max-content')};
  min-width: ${({ $collapsed }) => ($collapsed ? '64px' : '0')};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  gap: ${({ $collapsed }) => ($collapsed ? '0' : '2px')};
  padding: ${({ $collapsed }) => ($collapsed ? '0' : '6px')};
  background: ${({ $collapsed }) =>
    $collapsed ? DS2_VARS.g300 : DS2_VARS.dockBg};
  backdrop-filter: ${({ $collapsed }) =>
    $collapsed ? 'none' : DS2_VARS.dockFilter};
  -webkit-backdrop-filter: ${({ $collapsed }) =>
    $collapsed ? 'none' : DS2_VARS.dockFilter};
  border: ${({ $collapsed }) =>
    $collapsed ? '0 solid transparent' : `1px solid ${DS2_VARS.dockBorder}`};
  border-radius: ${({ $collapsed }) =>
    $collapsed ? '3px' : DS2_VARS.dockRadius};
  box-shadow: ${({ $collapsed }) =>
    $collapsed ? 'none' : DS2_VARS.dockShadow};
  opacity: ${({ $collapsed }) => ($collapsed ? 0.6 : 1)};
  cursor: ${({ $collapsed }) => ($collapsed ? 'pointer' : 'default')};
  z-index: 101;
  will-change: width, height, padding, border-radius, bottom;
  /* iOS-spring easing (Apple HIG 2024). Expand 220ms, collapse 280ms —
     expand ощущается отзывчивее. Transition на layout-группу синхронно. */
  transition:
    width 280ms cubic-bezier(0.32, 0.72, 0, 1),
    height 280ms cubic-bezier(0.32, 0.72, 0, 1),
    padding 280ms cubic-bezier(0.32, 0.72, 0, 1),
    border-radius 280ms cubic-bezier(0.32, 0.72, 0, 1),
    bottom 280ms cubic-bezier(0.32, 0.72, 0, 1),
    background 200ms ease,
    border 200ms ease,
    opacity 180ms ease,
    box-shadow 200ms ease;

  /* Кнопки внутри fade'аются и становятся не-кликабельными при collapse. */
  & > * {
    opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
    pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
    transition: opacity 150ms ease;
  }

  /* Magnetic neighbor magnification — только в expanded. */
  &[data-collapsed='false'] > button:hover + button,
  &[data-collapsed='false'] > button:has(+ button:hover) {
    transform: translateY(-3px) scale(1.08);
  }

  /* В collapsed pill светлеет и становится ярче на hover/focus. */
  &[data-collapsed='true']:hover,
  &[data-collapsed='true']:focus-visible {
    opacity: 1;
    background: ${DS2_VARS.g400};
  }

  &[data-collapsed='true']:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 4px;
  }

  /* Collapsed hit-area расширена до 44×44 (Fitts's law, touch-friendly). */
  &[data-collapsed='true']::before {
    content: '';
    position: absolute;
    inset: -20px;
  }

  @media print,
    (max-width: 767px) {
    display: none;
  }

  /* prefers-reduced-motion: убираем layout-transitions, остаётся opacity
     и background. Смена размера происходит instant — меньше motion sickness. */
  @media (prefers-reduced-motion: reduce) {
    transition:
      opacity 120ms ease,
      background 120ms ease;
  }
`;

/**
 * Top-edge grabber — компактная «рукоятка» 28×4 по центру верхней кромки
 * floating dock'а, по клику сворачивает dock в pill.
 *
 * Паттерн взят у iOS bottom-sheet (drag indicator), Apple Maps, Notion
 * mobile toolbar: тонкая горизонтальная полоска сверху — сразу читается
 * как «свернуть/перетащить». Не занимает flex-ячейку в dock'е, сидит
 * выше как отдельный fixed-элемент (z-index 103 > dock 101 > mini-rail 99).
 *
 * Hit-area расширена до 44×24 невидимым ::before (Fitts's law).
 */
const DockGrabber = styled.button<{
  $hidden: boolean;
  $hasMiniRail: boolean;
}>`
  position: fixed;
  /* Позиция зависит от наличия mini-rail'а:
     • БЕЗ mini-rail'а → 2px над верхним краем dock'а (dockBottom + dockHeight + 2);
     • С mini-rail'ом → 4px над верхним краем mini-rail'а. Mini-rail сидит
       на bottom: dockBottom + dockHeight - 18, height 48 → top mini-rail
       в viewport'е = dockBottom + dockHeight - 18 + 48 = dockBottom +
       dockHeight + 30. Поднимаем grabber ещё на 4px выше = +34 итого. */
  bottom: ${({ $hasMiniRail }) =>
    $hasMiniRail
      ? `calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} + 34px)`
      : `calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} + 2px)`};
  transition:
    opacity 160ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1),
    bottom 200ms cubic-bezier(0.32, 0.72, 0, 1),
    background 160ms ease;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 4px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  opacity: ${({ $hidden }) => ($hidden ? 0 : 0.5)};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  cursor: pointer;
  z-index: 103;

  /* Расширенная hit-area 44×24 (touch-friendly, не меняя визуала). */
  &::before {
    content: '';
    position: absolute;
    inset: -10px -8px;
  }

  &:hover,
  &:focus-visible {
    opacity: 1;
    background: ${DS2_VARS.g400};
    transform: translateX(-50%) scaleY(1.5);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 4px;
  }

  @media print,
    (max-width: 767px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 100ms ease;
    &:hover,
    &:focus-visible {
      transform: translateX(-50%);
    }
  }
`;

/**
 * Вертикальный разделитель между группами кнопок (26×1, полупрозрачный).
 * В мокапе их три: после Create, после CentralPill, перед Avatar.
 */
const RailSep = styled.span`
  width: 1px;
  height: 26px;
  background: ${DS2_VARS.g200};
  opacity: 0.6;
  margin: 0 ${DS2_SPACE.s1}px;
  flex-shrink: 0;
`;

/**
 * Rail-кнопка 44×44 с radius 14 и magnification на hover
 * (translateY(-6) scale(1.18)). Active-состояние даёт gradient-bg +
 * inset-ring + glow-dot под кнопкой (::after).
 *
 * transform-origin: center bottom — иконка «растёт» из точки над dock'ом,
 * как в macOS dock, создавая иллюзию магнитного приближения.
 */
const RailButton = styled.button<{ $active?: boolean }>`
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 14px;
  background: ${({ $active }) =>
    $active ? DS2_VARS.dockBtnActiveBg : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transform-origin: center bottom;
  box-shadow: ${({ $active }) =>
    $active ? DS2_VARS.dockBtnActiveRing : 'none'};
  transition:
    transform 0.2s ${DS2_VARS.ease},
    background 0.15s ${DS2_VARS.ease},
    color 0.15s ${DS2_VARS.ease},
    box-shadow 0.2s ${DS2_VARS.ease};

  /* Hover: активная кнопка сохраняет sky-подсветку (background gradient,
     ring, color) — как в мокапе. Для неактивной — обычный grey hover. */
  &:hover {
    background: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveBg : DS2_VARS.dockBtnHoverBg};
    color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.ink)};
    box-shadow: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveRing : 'none'};
    transform: translateY(-6px) scale(1.18);
  }

  /* Active button при focus-visible тоже сохраняет sky-подсветку. */
  &:focus {
    background: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveBg : 'transparent'};
    color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
    box-shadow: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveRing : 'none'};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.6;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${({ $active }) =>
      $active ? DS2_VARS.cSky : 'transparent'};
    box-shadow: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveGlow : 'none'};
    transition: background 0.12s ${DS2_VARS.ease};
  }
`;

/** Бейдж без glow — ring цвета dock-фона визуально отделяет от иконки. */
const RailBadgeDot = styled.span<{ $color: string }>`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px ${DS2_VARS.dockBg};
`;

/** Простая цветная точка без glow (для календаря — наличие событий). */
const RailDot = styled.span<{ $color: string }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

/**
 * Avatar slot. По мокапу: button-обёртка 44×44 (как `.rail-btn`, чтобы
 * совпадал bounding box и magnification) + внутренний кружок 34×34 с
 * gradient. Структура мокапа: `<button class="rail-btn"><div class="rail-avatar"/></button>`.
 */
const RailAvatarBtn = styled.button`
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
  transition: transform 0.2s ${DS2_VARS.ease};

  &:hover {
    transform: translateY(-6px) scale(1.18);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/* Мокап `.rail-avatar`: 34×34, gradient violet→fuchsia, border 2px bg1 60%. */
const RailAvatarDot = styled.span`
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 2px solid ${DS2_VARS.dockBg};
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${DS2_VARS.cViolet},
    ${DS2_VARS.cFuchsia}
  );
  color: #fff;
  font-family: ${DS2_VARS.fontSans};
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Обёртка для sun+moon SVG. Видимость переключается через селектор
 * [data-theme="dark"|"light"] на html. В dark видна moon, в light — sun.
 */
const ThemeIconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;

  .th-sun {
    display: none;
  }
  .th-moon {
    display: block;
  }

  html[data-theme='light'] & .th-sun,
  :root:not([data-theme='dark']) & .th-sun {
    display: block;
  }
  html[data-theme='light'] & .th-moon,
  :root:not([data-theme='dark']) & .th-moon {
    display: none;
  }
`;

interface RailProps {
  /** Инициалы пользователя для аватара (2 символа). */
  userInitials?: string;
  /** Базовый путь приложения (для react-router push). */
  brandUrl?: string;
  /** Хендлер клика по бренду (сейчас бренд объединён с Home). */
  onBrandClick?: () => void;
  /** Хендлер открытия календаря. */
  onOpenCalendar?: () => void;
  /** Хендлер переключения темы. */
  onToggleTheme?: () => void;
  /**
   * Хендлер открытия AI. Вызывается когда CentralPill делает submit —
   * приходит seed-запрос и meta (контекст, модель). Также может быть
   * вызван без аргументов из других мест (например, из drawer).
   */
  onOpenAi?: (
    seed?: string,
    meta?: { contextId: string; modelId: AiModelId },
  ) => void;
  /** Хендлер открытия истории чатов (bottom sheet AiHistorySheet). */
  onOpenAiHistory?: () => void;
  /** Хендлер открытия профиля/настроек. */
  onOpenSettings?: () => void;
  /** Бейдж на календаре. */
  calendarBadgeColor?: string;
  /** Бейдж на каталоге (индикатор новинок). */
  catalogBadgeColor?: string;
  /** Активна кнопка истории чатов (AiHistorySheet открыт). */
  historyActive?: boolean;
  /** Активна кнопка календаря (CalendarDropdown открыт). */
  calendarActive?: boolean;
  /** Активна кнопка настроек (SettingsDropdown открыт). */
  settingsActive?: boolean;
  /** Открыт ли AI overlay — тогда pill держится расширенным. */
  aiActive?: boolean;
  /** Ref на кнопку настроек (нужен SettingsDropdown для позиционирования). */
  settingsButtonRef?: RefObject<HTMLButtonElement>;
  /** Ref на кнопку календаря (для CalendarDropdown). */
  calendarButtonRef?: RefObject<HTMLButtonElement>;

  /* ─── CentralPill (доступные контексты, модель) ─── */
  contexts: readonly AiContext[];
  contextId: string;
  onContextChange: (ctx: AiContext) => void;
  modelId: AiModelId;
  onModelChange: (model: AiModelDescriptor) => void;
}

/** Спецификация элемента dock'а (кнопка, разделитель или компонент). */
type RailSlot =
  | { kind: 'btn'; node: ReactNode }
  | { kind: 'sep' }
  | { kind: 'custom'; node: ReactNode };

export const Rail: FC<React.PropsWithChildren<RailProps>> = ({
  userInitials = '',
  onOpenCalendar,
  onToggleTheme,
  onOpenAi,
  onOpenAiHistory,
  onOpenSettings,
  calendarBadgeColor,
  catalogBadgeColor,
  historyActive = false,
  calendarActive = false,
  settingsActive = false,
  aiActive = false,
  settingsButtonRef,
  calendarButtonRef,
  contexts,
  contextId,
  onContextChange,
  modelId,
  onModelChange,
}) => {
  const history = useHistory();
  const location = useLocation();
  const {
    openedDrawer,
    toggleDrawer,
    activeRailId,
    setDockCollapsed,
    hasMiniRail,
  } = useShell();

  /* Collapse-to-handle: dock auto-сворачивается при скролле вниз или
     3.5с бездействия. Pin (всегда expanded) — когда открыт drawer или
     AI-overlay: в этих режимах юзер явно работает с dock'ом/overlay'ем. */
  const dockPinned = !!openedDrawer || aiActive;
  const { isCollapsed, expand, collapse } = useDockCollapse({
    pinned: dockPinned,
  });

  /* Синхронизируем collapse-state с ShellContext — mini-rail
     (DashboardSideRail) читает его и сворачивается вместе с главным
     доком: они одна compound-фигура «laptop lid + main dock». */
  useEffect(() => {
    setDockCollapsed(isCollapsed);
  }, [isCollapsed, setDockCollapsed]);

  // Home активна только когда ничего другое не выбрано И drawer закрыт —
  // иначе была ситуация «Home + Каталог горят одновременно» при открытии
  // любого drawer на welcome-странице.
  const isHomeActive =
    activeRailId === 'rail-home' ||
    (!activeRailId &&
      !openedDrawer &&
      /\/(superset\/)?welcome\/?/.test(location.pathname));

  const onHome = () => history.push('/superset/welcome/');

  const slots = useMemo<RailSlot[]>(
    () => [
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-home"
            type="button"
            onClick={onHome}
            aria-label={t('Главная')}
            title={t('Главная')}
            $active={isHomeActive}
          >
            <IconHome />
          </RailButton>
        ),
      },
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-catalog"
            type="button"
            onClick={() => toggleDrawer('catalog')}
            aria-label={t('Каталог')}
            aria-pressed={openedDrawer === 'catalog'}
            title={t('Каталог')}
            $active={openedDrawer === 'catalog'}
          >
            <IconCatalog />
            {catalogBadgeColor ? (
              <RailBadgeDot $color={catalogBadgeColor} />
            ) : null}
          </RailButton>
        ),
      },
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-tools"
            type="button"
            onClick={() => toggleDrawer('tools')}
            aria-label={t('Инструменты')}
            aria-pressed={openedDrawer === 'tools'}
            title={t('Инструменты')}
            $active={openedDrawer === 'tools'}
          >
            <IconTools />
          </RailButton>
        ),
      },
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-create"
            type="button"
            onClick={() => toggleDrawer('create')}
            aria-label={t('Создать')}
            aria-pressed={openedDrawer === 'create'}
            title={t('Создать')}
            $active={openedDrawer === 'create'}
          >
            <IconCreate />
          </RailButton>
        ),
      },
      { kind: 'sep' },
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-history"
            type="button"
            onClick={() => onOpenAiHistory?.()}
            aria-label={t('История чатов')}
            aria-pressed={historyActive}
            title={t('История чатов')}
            $active={historyActive}
          >
            <IconHistory />
          </RailButton>
        ),
      },
      {
        kind: 'custom',
        node: (
          <CentralPill
            key="rail-ask"
            contexts={contexts}
            contextId={contextId}
            onContextChange={onContextChange}
            modelId={modelId}
            onModelChange={onModelChange}
            onSubmit={(query, meta) => onOpenAi?.(query, meta)}
            onFocusChange={focused => {
              // Клик по pill (focus) → открываем AI overlay в empty-state
              // (без seed). Любая работа с ИИ теперь идёт через overlay.
              if (focused) onOpenAi?.();
            }}
            keepExpanded={aiActive}
          />
        ),
      },
      { kind: 'sep' },
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-calendar"
            ref={calendarButtonRef}
            type="button"
            onClick={() => onOpenCalendar?.()}
            aria-label={t('Календарь')}
            aria-pressed={calendarActive}
            title={t('Календарь')}
            $active={calendarActive}
          >
            <IconCalendar />
            {calendarBadgeColor ? <RailDot $color={calendarBadgeColor} /> : null}
          </RailButton>
        ),
      },
      {
        kind: 'btn',
        node: (
          <RailButton
            key="rail-theme"
            type="button"
            onClick={() => onToggleTheme?.()}
            aria-label={t('Сменить тему')}
            title={t('Сменить тему')}
          >
            <ThemeIconSlot>
              <span className="th-sun">
                <IconSun />
              </span>
              <span className="th-moon">
                <IconMoon />
              </span>
            </ThemeIconSlot>
          </RailButton>
        ),
      },
      { kind: 'sep' },
      {
        kind: 'btn',
        node: (
          <RailAvatarBtn
            key="rail-settings"
            ref={settingsButtonRef}
            type="button"
            onClick={() => onOpenSettings?.()}
            aria-label={t('Настройки и профиль')}
            aria-pressed={settingsActive}
            title={t('Настройки и профиль')}
          >
            <RailAvatarDot>{userInitials}</RailAvatarDot>
          </RailAvatarBtn>
        ),
      },
    ],
    [
      isHomeActive,
      openedDrawer,
      toggleDrawer,
      onOpenCalendar,
      onOpenAi,
      onOpenAiHistory,
      onToggleTheme,
      onOpenSettings,
      calendarBadgeColor,
      catalogBadgeColor,
      historyActive,
      calendarActive,
      settingsActive,
      aiActive,
      settingsButtonRef,
      calendarButtonRef,
      userInitials,
      contexts,
      contextId,
      onContextChange,
      modelId,
      onModelChange,
    ],
  );

  return (
    <>
      {/* Top-edge grabber — виден когда dock expanded, клик → collapse.
          Позиция над mini-rail'ом (если он есть на странице) или над
          dock'ом (welcome/charts/etc). */}
      <DockGrabber
        type="button"
        $hidden={isCollapsed || dockPinned}
        $hasMiniRail={hasMiniRail}
        onClick={collapse}
        aria-label={t('Свернуть панель')}
        aria-controls="shell-floating-dock"
        title={t('Свернуть панель')}
        tabIndex={isCollapsed || dockPinned ? -1 : 0}
      />
      <RailNav
        id="shell-floating-dock"
        $collapsed={isCollapsed}
        data-collapsed={isCollapsed ? 'true' : 'false'}
        data-shell-rail="main"
        aria-label={t('Главная навигация')}
        aria-expanded={!isCollapsed}
        role={isCollapsed ? 'button' : undefined}
        tabIndex={isCollapsed ? 0 : undefined}
        onClick={isCollapsed ? expand : undefined}
        onKeyDown={
          isCollapsed
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  expand();
                }
              }
            : undefined
        }
      >
        {slots.map((slot, i) =>
          slot.kind === 'sep' ? (
            // eslint-disable-next-line react/no-array-index-key
            (<RailSep key={`sep-${i}`} role="presentation" />)
          ) : (
            slot.node
          ),
        )}
      </RailNav>
    </>
  );
};
