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
 * SettingsDropdown — профильное меню по мокапу analytics-floating-dock.html
 * `.dropdown.pm#profilePop`. Открывается кликом по аватарке в Rail.
 *
 * Layout (мокап):
 *   ┌──────────────────────────────────────────┐
 *   │ [avatar] Имя Фамилия              [×]    │
 *   │          email@domain                    │
 *   ├──────────────────────────────────────────┤
 *   │ БЕЗОПАСНОСТЬ                             │
 *   │ [🛡️] [👤] [👥] [📋] [🔒]                  │
 *   │  Роли Польз. Группы Журнал RLS           │
 *   ├──────────────────────────────────────────┤
 *   │ ДАННЫЕ                                   │
 *   │ [🗄️] [📊]                                │
 *   │ Подкл. Датасеты                          │
 *   ├──────────────────────────────────────────┤
 *   │ УПРАВЛЕНИЕ                               │
 *   │ [{}] [🔔] [📌]                           │
 *   │ CSS Опов. Аннот.                         │
 *   ├──────────────────────────────────────────┤
 *   │ [👤 Личные] [🌐 Язык RU] [↗ Выход]       │
 *   ├──────────────────────────────────────────┤
 *   │ МРТС Analytics                   v6.0.0  │
 *   └──────────────────────────────────────────┘
 */
// eslint-disable-next-line no-restricted-imports
import {
  configure,
  styled,
  t,
  ThemeMode,
  type LanguagePack,
} from '@superset-ui/core';
import {
  type FC,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { DS2_VARS } from 'src/theme/ds2';
import { useThemeContext } from 'src/theme/ThemeProvider';
import type { BootstrapUser, MenuData } from 'src/types/bootstrapTypes';

interface SettingsDropdownProps {
  /** Привязка к кнопке rail — dropdown спозиционируется над ней. */
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  user?: BootstrapUser;
  menu: MenuData;
  /** Возвращает true, если URL обрабатывается React Router. */
  isFrontendRoute?: (url?: string) => boolean;
  /** Название+версия приложения для футера (опционально). */
  appTitle?: string;
  appVersion?: string;
}

/* ─── Scrim + Drawer container (как CatalogDrawer: центр экрана, 1200×640) ─── */

const Scrim = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.2s ${DS2_VARS.ease};
  z-index: 96;
`;

const Dropdown = styled.aside<{ $open: boolean }>`
  position: fixed;
  bottom: ${DS2_VARS.drawerBottom};
  left: 50%;
  transform: translateX(-50%)
    translateY(${({ $open }) => ($open ? '0' : '20px')});
  width: min(96vw, 1200px);
  height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  max-height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: ${DS2_VARS.drawerShadow};
  padding: 20px 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  z-index: 97;
  font-family: ${DS2_VARS.fontSans};
  color: ${DS2_VARS.ink};
  transition:
    height 0.28s ${DS2_VARS.ease},
    transform 0.28s ${DS2_VARS.ease},
    opacity 0.2s ${DS2_VARS.ease};

  @media (max-width: 767px) {
    right: 4px;
    left: 4px;
    transform: none;
    width: auto;
    bottom: ${DS2_VARS.dockMobileHeight};
    max-height: 90vh;
    height: ${({ $open }) => ($open ? '90vh' : '0')};
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

/* ─── Header ─── */

const HeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #d946a8);
  color: ${DS2_VARS.s};
  font-size: var(--fs-interactive);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Identity = styled.div`
  flex: 1;
  min-width: 0;
`;

const IdName = styled.div`
  font-size: var(--fs-body);
  font-weight: 700;
  color: ${DS2_VARS.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IdEmail = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g500};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.ink};
    border-color: ${DS2_VARS.g300};
    background: ${DS2_VARS.bg3};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

/* ─── Section with tile grid ─── */

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/* Единый стиль заголовков секций — как SecLabel в ToolsDrawer/CreateDrawer:
   моно-шрифт, тусклый g500, без цветных точек и без цветной типографики.
   Упрощённый лейбл не спорит за внимание с плитками секции. */
const SectionLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${DS2_VARS.g500};
  font-weight: 700;
  padding: 0 2px;
`;

/* Tile grid (как ToolsDrawer): авто-укладка, фиксированная ширина плиток.
   Плитка вертикальная — иконка сверху, label под ней. Без border/bg
   (они добавляются только на hover). */
const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 4px;
`;

const Tile = styled.a<{ $accent: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
    border-color: ${DS2_VARS.g200};
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const TileIcon = styled.span<{ $accent: string }>`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $accent }) => $accent};
  background: ${({ $accent }) =>
    `color-mix(in oklab, ${$accent} 14%, ${DS2_VARS.bg3})`};
  box-sizing: border-box;
  flex-shrink: 0;
`;

const TileLabel = styled.span`
  color: ${DS2_VARS.g700};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

/* ─── Bottom bar (3 кнопки) ─── */

/* Нижняя строка с быстрыми действиями: Тёмная · Язык · Личные · Выход.
   Выводим все 4 в один ряд равной ширины — auto-fit, чтобы на узких
   экранах элементы могли съехать на 2 ряда, но на нормальной ширине
   drawer'а умещаются в строку. */
const BottomBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const BottomBtnBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.12s ${DS2_VARS.ease};
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g700};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const BottomLink = styled.a`
  ${BottomBtnBase};
`;

const BottomButton = styled.button<{ $variant?: 'danger' }>`
  ${BottomBtnBase};
  ${({ $variant }) =>
    $variant === 'danger'
      ? `
    color: ${DS2_VARS.dn};
    border-color: ${DS2_VARS.dn};
    background: ${DS2_VARS.dnBg};
    &:hover {
      color: ${DS2_VARS.dn};
      background: ${DS2_VARS.dnBg};
      border-color: ${DS2_VARS.dn};
    }
  `
      : ''}
`;

const LangBadge = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
  background: ${DS2_VARS.g200};
  color: ${DS2_VARS.g600};
  margin-left: 4px;
`;

/* ─── Footer ─── */

const BrandFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid ${DS2_VARS.g100};
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-meta);
  color: ${DS2_VARS.g500};
`;

/* ─── SVG Icons ─── */

const IconClose: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    style={{ flexShrink: 0 }}
  >
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

const IconShield: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M10 2.5 4 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5l-6-2.5z" />
  </svg>
);

const IconUser: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="10" cy="7" r="3" />
    <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" />
  </svg>
);

const IconUsers: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="7" cy="7" r="2.5" />
    <path d="M2.5 16c0-2.5 2-4.5 4.5-4.5S11.5 13.5 11.5 16" />
    <circle cx="14" cy="8" r="2" />
    <path d="M13 12.5c2.5 0 4.5 1.7 4.5 3.5" />
  </svg>
);

const IconJournal: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M5 3h8l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M7 8h6M7 11h6M7 14h4" />
  </svg>
);

const IconLock: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="4" y="9" width="12" height="8" rx="2" />
    <path d="M7 9V6a3 3 0 0 1 6 0v3" />
  </svg>
);

const IconDatabase: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <ellipse cx="10" cy="5" rx="6" ry="2" />
    <path d="M4 5v5c0 1.1 2.7 2 6 2s6-.9 6-2V5" />
    <path d="M4 10v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
  </svg>
);

const IconTable: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="3" y="4" width="14" height="12" rx="1.5" />
    <path d="M3 8h14M3 12h14M8 4v12" />
  </svg>
);

const IconSql: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <ellipse cx="10" cy="5" rx="5.5" ry="1.8" />
    <path d="M4.5 5v10c0 1 2.5 1.8 5.5 1.8s5.5-.8 5.5-1.8V5" />
    <path d="M7.5 10.5h2M7.5 13h5" />
  </svg>
);

const IconCode: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M6 6l-3 4 3 4M14 6l3 4-3 4M11 4l-2 12" />
  </svg>
);

const IconBell: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5V10l-1.5 3h12L14.5 10V7A4.5 4.5 0 0 0 10 2.5z" />
    <path d="M8 15.5a2 2 0 0 0 4 0" />
  </svg>
);

const IconPin: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M10 2.5 6.5 6 4 6.5 9 11l-3 5 5-3 4.5 5 .5-2.5 3.5-3.5L10 2.5z" />
  </svg>
);

const IconProfile: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="8" cy="6" r="2.5" />
    <path d="M3 13.5c0-2.2 2.2-4 5-4s5 1.8 5 4" />
  </svg>
);

const IconGlobe: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12M8 2a8 8 0 0 1 0 12M8 2a8 8 0 0 0 0 12" />
  </svg>
);

const IconDashboard: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" />
    <rect x="10.5" y="2.5" width="7" height="4" rx="1.5" />
    <rect x="10.5" y="7.5" width="7" height="10" rx="1.5" />
    <rect x="2.5" y="10.5" width="7" height="7" rx="1.5" />
  </svg>
);

const IconChart: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M3 17V7M8 17V3M13 17v-7M18 17v-4" />
    <path d="M2 17.5h17" />
  </svg>
);

const IconLogout: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5" />
    <path d="M11 5l3 3-3 3M14 8H7" />
  </svg>
);

/* ─── Helpers ─── */

function extractFullName(user?: BootstrapUser): string {
  if (!user) return '';
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username ?? '';
}

function extractInitials(user?: BootstrapUser): string {
  const name = extractFullName(user);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/* ─── Tile definitions ─── */

interface TileDef {
  key: string;
  label: string;
  url: string;
  accent: string;
  icon: ReactElement;
}

/**
 * Собирает все URL из menu.settings (для подстановки реальных URL вместо
 * хардкода — на случай если в данной версии Superset путь отличается).
 */
function collectMenuUrls(menu: MenuData): string[] {
  const urls: string[] = [];
  menu.settings?.forEach(section => {
    section.childs?.forEach(child => {
      if (typeof child !== 'string' && child.url) {
        urls.push(child.url);
      }
    });
  });
  return urls;
}

/** Ищет первый URL из меню, содержащий одну из подстрок. */
function findUrl(menuUrls: string[], substrings: string[]): string | null {
  for (const ss of substrings) {
    const found = menuUrls.find(u => u.includes(ss));
    if (found) return found;
  }
  return null;
}

/** Строит полный набор плиток. URL подставляется из меню если найден,
 *  иначе используется стандартный fallback Superset 6.0. */
function buildTileDefs(menu: MenuData): {
  content: TileDef[];
  create: TileDef[];
  security: TileDef[];
  data: TileDef[];
  management: TileDef[];
} {
  const urls = collectMenuUrls(menu);
  const pick = (substrings: string[], fallback: string): string =>
    findUrl(urls, substrings) ?? fallback;

  return {
    // «Контент» — навигация к существующим объектам. Стандартные листинги
    // Superset /dashboard/list/ и /chart/list/ нужно иметь в быстром доступе,
    // иначе к ним нет UI-пути после переноса старой админ-навигации сюда.
    content: [
      {
        key: 'dashboards',
        label: t('Дашборды'),
        url: pick(['/dashboard/list'], '/dashboard/list/'),
        accent: DS2_VARS.cSky,
        icon: <IconDashboard />,
      },
      {
        key: 'charts',
        label: t('Чарты'),
        url: pick(['/chart/list'], '/chart/list/'),
        accent: DS2_VARS.cTangerine,
        icon: <IconChart />,
      },
    ],
    // «Создание» — быстрые действия для админа/аналитика. Видны всем
    // залогиненным; в Superset создание чарта/дашборда защищено
    // server-side permissions, так что неавторизованный клик упрётся
    // в 403 — UI не ломается.
    create: [
      {
        key: 'new-dashboard',
        label: t('Новый дашборд'),
        url: pick(['/dashboard/new'], '/dashboard/new/'),
        accent: DS2_VARS.cViolet,
        icon: <IconDashboard />,
      },
      {
        key: 'new-chart',
        label: t('Новый чарт'),
        url: pick(['/chart/add'], '/chart/add'),
        accent: DS2_VARS.cFuchsia,
        icon: <IconChart />,
      },
    ],
    security: [
      {
        key: 'roles',
        label: t('Роли'),
        url: pick(['/roles/'], '/roles/list/'),
        accent: DS2_VARS.dn,
        icon: <IconShield />,
      },
      {
        key: 'users',
        label: t('Пользователи'),
        url: pick(['/users/'], '/users/list/'),
        accent: DS2_VARS.cSky,
        icon: <IconUser />,
      },
      {
        key: 'groups',
        label: t('Группы'),
        url: pick(['/groups/'], '/groups/list/'),
        accent: DS2_VARS.cViolet,
        icon: <IconUsers />,
      },
      {
        key: 'actionlog',
        label: t('Журнал'),
        url: pick(['/logmodelview/', '/actionlog'], '/logmodelview/list/'),
        accent: DS2_VARS.cAmber,
        icon: <IconJournal />,
      },
      {
        key: 'rls',
        label: 'RLS',
        url: pick(['/rowlevelsecurity/'], '/rowlevelsecurity/list/'),
        accent: DS2_VARS.up,
        icon: <IconLock />,
      },
    ],
    data: [
      {
        key: 'databases',
        label: t('Подключения'),
        url: pick(['/databaseview/', '/database/'], '/databaseview/list/'),
        accent: DS2_VARS.cSky,
        icon: <IconDatabase />,
      },
      {
        key: 'datasets',
        label: t('Датасеты'),
        url: pick(
          ['/tablemodelview/', '/dataset/', '/tables/'],
          '/tablemodelview/list/',
        ),
        accent: DS2_VARS.cFuchsia,
        icon: <IconTable />,
      },
      {
        key: 'sqllab',
        label: t('SQL Lab'),
        url: pick(['/sqllab'], '/sqllab/'),
        accent: DS2_VARS.cTangerine,
        icon: <IconSql />,
      },
    ],
    management: [
      {
        key: 'css',
        label: t('CSS-шаблоны'),
        url: pick(
          ['/csstemplatemodelview/', '/csstemplate'],
          '/csstemplatemodelview/list/',
        ),
        accent: DS2_VARS.cFuchsia,
        icon: <IconCode />,
      },
      {
        key: 'alerts',
        label: t('Оповещения'),
        url: pick(['/alert/'], '/alert/list/'),
        accent: DS2_VARS.cAmber,
        icon: <IconBell />,
      },
      {
        key: 'annotations',
        label: t('Аннотации'),
        url: pick(['/annotation'], '/annotationlayer/list/'),
        accent: DS2_VARS.up,
        icon: <IconPin />,
      },
    ],
  };
}

/* ─── Module-level locale store ────────────────────────────────────
 *
 * Переключение языка делает key-bump <App /> через событие
 * `superset:lang-changed` (см. views/index.tsx → AppWithLangSwitch).
 * Любое React-состояние внутри компонентов теряется при ремонте.
 *
 * Если хранить выбранный язык в useState внутри SettingsDropdown и
 * инициализировать его из `menu.navbar_right.locale` (bootstrap HTML,
 * frozen at page load), то после ремонта value возвращается в старое
 * значение — юзер видит «моргание» бейджа ru→en→ru одним кликом.
 *
 * Решение: module-level переменная + useSyncExternalStore. Значение
 * живёт в памяти JS-модуля, переживает любые ремонты React-дерева,
 * сбрасывается только при hard reload страницы (как и должно быть —
 * тогда bootstrap HTML обновлён). */
let currentLocaleValue = 'en';
let currentLocaleInitialized = false;
const localeSubscribers = new Set<() => void>();
const localeSnapshot = (): string => currentLocaleValue;
const localeSubscribe = (listener: () => void): (() => void) => {
  localeSubscribers.add(listener);
  return () => {
    localeSubscribers.delete(listener);
  };
};
const setCurrentLocale = (next: string): void => {
  if (currentLocaleValue === next) return;
  currentLocaleValue = next;
  localeSubscribers.forEach(fn => fn());
};

/* ─── Component ─── */

export const SettingsDropdown: FC<
  React.PropsWithChildren<SettingsDropdownProps>
> = ({
  anchor,
  open,
  onClose,
  user,
  menu,
  appTitle = 'МРТС Analytics',
  appVersion = 'v6.0.0',
}) => {
  const ref = useRef<HTMLElement>(null);
  const themeCtx = useThemeContext();
  const isDark = themeCtx?.themeMode === ThemeMode.DARK;

  // Закрытие по Escape (клик по scrim — отдельный обработчик на элементе).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleToggleTheme = useCallback(() => {
    if (!themeCtx) return;
    const next = isDark ? ThemeMode.DEFAULT : ThemeMode.DARK;
    themeCtx.setThemeMode(next);
  }, [themeCtx, isDark]);

  const languages = menu.navbar_right?.languages ?? {};
  const serverLocale = menu.navbar_right?.locale ?? 'en';
  /* Текущий язык хранится в module-level переменной (см. `currentLocale`
     внизу файла), чтобы пережить ремонт React-дерева по событию
     `superset:lang-changed`. Иначе при key-bump компонент инициализировался
     бы из `serverLocale` (bootstrap HTML, frozen at page load), и бейдж
     откатывался бы в старое значение — юзер видел бы «мигание ru→en→ru»
     при одном клике.

     useSyncExternalStore подписывается на обновления module-store, чтобы
     все экземпляры SettingsDropdown в приложении видели одно состояние. */
  if (!currentLocaleInitialized) {
    currentLocaleValue = serverLocale;
    currentLocaleInitialized = true;
  }
  const displayLocale = useSyncExternalStore(
    localeSubscribe,
    localeSnapshot,
    localeSnapshot,
  );
  const setDisplayLocale = setCurrentLocale;

  const handleLangToggle = useCallback(async () => {
    const keys = Object.keys(languages);
    if (keys.length < 2) return;
    const currentIdx = keys.indexOf(displayLocale);
    const nextKey = keys[(currentIdx + 1) % keys.length];
    const nextLang = languages[nextKey];
    if (!nextLang?.url) return;

    setDisplayLocale(nextKey);
    /* Флаг для Shell: после ремонта App'а Shell заново откроет
       SettingsDropdown, чтобы юзер видел модалку с применённым
       переводом. sessionStorage живёт ровно одну вкладку, не утечёт. */
    try {
      window.sessionStorage.setItem(
        'superset-reopen-settings-after-lang-switch',
        '1',
      );
    } catch {
      // private mode — модалка не восстановится, язык всё равно сменится
    }

    /* 1. Серверный cookie для будущих страничных загрузок.
          redirect:'manual' → opaqueredirect на 302, cookie поставлен
          до редиректа, тело следовать не нужно. */
    try {
      await fetch(nextLang.url, {
        credentials: 'include',
        redirect: 'manual',
      });
    } catch {
      // Сеть упала — продолжаем, может пакет всё равно загрузится
    }

    /* 2. Грузим новый language-pack (если это не en — en = default без пака). */
    if (nextKey === 'en') {
      configure();
    } else {
      try {
        const resp = await fetch(`/superset/language_pack/${nextKey}/`);
        if (resp.ok) {
          const json = (await resp.json()) as LanguagePack;
          configure({ languagePack: json });
        } else {
          configure();
        }
      } catch {
        configure();
      }
    }

    /* 3. dayjs — отдельный globals-state, обновляем вручную (см. preamble). */
    try {
      const dayjs = (await import('dayjs')).default;
      if (nextKey !== 'en') {
        await import(`dayjs/locale/${nextKey}.js`);
      }
      dayjs.locale(nextKey);
    } catch {
      // locale-файл может отсутствовать — не критично
    }

    /* 4. Триггерим ремонт всего React-дерева через key-bump в index.tsx.
          Все компоненты заново вызовут t(), который теперь возвращает
          переводы нового языка. */
    window.dispatchEvent(
      new CustomEvent('superset:lang-changed', { detail: { locale: nextKey } }),
    );
  }, [languages, displayLocale]);

  void anchor; // anchor не используется в drawer-формате (модалка по центру)

  if (!open) return null;

  const { navbar_right: navbarRight } = menu;
  const fullName = extractFullName(user);
  const initials = extractInitials(user);
  const showLangPicker =
    (navbarRight?.show_language_picker ?? false) &&
    Object.keys(languages).length > 1;
  const isAnonymous = Boolean(navbarRight?.user_is_anonymous);
  // Все 10 плиток; URL-ы подтягиваются из menu.settings если там есть,
  // иначе fallback на стандартные Superset 6.0 URL.
  const tiles = buildTileDefs(menu);

  const renderTile = (tile: TileDef) => (
    <Tile
      key={tile.key}
      href={tile.url}
      $accent={tile.accent}
      onClick={onClose}
      aria-label={tile.label}
      title={tile.label}
    >
      <TileIcon $accent={tile.accent}>{tile.icon}</TileIcon>
      <TileLabel>{tile.label}</TileLabel>
    </Tile>
  );

  const contentTiles = tiles.content;
  const createTiles = tiles.create;
  const securityTiles = tiles.security;
  const dataTiles = tiles.data;
  const managementTiles = tiles.management;

  return createPortal(
    <>
      <Scrim $open={open} onClick={onClose} />
      <Dropdown
        ref={ref}
        $open={open}
        role="dialog"
        aria-modal="true"
        aria-label={t('Профиль и настройки')}
      >
        <HeadRow>
          <Avatar aria-hidden>{initials}</Avatar>
          <Identity>
            <IdName>{fullName || t('Пользователь')}</IdName>
            {user?.email ? <IdEmail>{user.email}</IdEmail> : null}
          </Identity>
          <CloseBtn
            type="button"
            onClick={onClose}
            aria-label={t('Закрыть')}
            title={t('Esc')}
          >
            <IconClose />
          </CloseBtn>
        </HeadRow>

        <Body>
          {contentTiles.length > 0 ? (
            <Section>
              <SectionLabel>{t('Контент')}</SectionLabel>
              <TileGrid>{contentTiles.map(renderTile)}</TileGrid>
            </Section>
          ) : null}

          {!isAnonymous && createTiles.length > 0 ? (
            <Section>
              <SectionLabel>{t('Создание')}</SectionLabel>
              <TileGrid>{createTiles.map(renderTile)}</TileGrid>
            </Section>
          ) : null}

          {securityTiles.length > 0 ? (
            <Section>
              <SectionLabel>{t('Безопасность')}</SectionLabel>
              <TileGrid>{securityTiles.map(renderTile)}</TileGrid>
            </Section>
          ) : null}

          {dataTiles.length > 0 ? (
            <Section>
              <SectionLabel>{t('Данные')}</SectionLabel>
              <TileGrid>{dataTiles.map(renderTile)}</TileGrid>
            </Section>
          ) : null}

          {managementTiles.length > 0 ? (
            <Section>
              <SectionLabel>{t('Управление')}</SectionLabel>
              <TileGrid>{managementTiles.map(renderTile)}</TileGrid>
            </Section>
          ) : null}
        </Body>

        {/* Единая строка: Тёмная · Язык · Личные · Выход. 4 равных по ширине
            кнопки. Раньше было 2+2 (Вид-секция внутри Body + BottomBar),
            сейчас собрано в один ряд в footer'е. */}
        <BottomBar>
          <BottomButton
            type="button"
            onClick={handleToggleTheme}
            aria-pressed={isDark}
            aria-label={t('Переключить тему')}
          >
            {isDark ? '☾' : '☀'} {isDark ? t('Тёмная') : t('Светлая')}
          </BottomButton>

          {showLangPicker ? (
            <BottomButton
              type="button"
              onClick={handleLangToggle}
              aria-label={t('Переключить язык')}
              title={(() => {
                const keys = Object.keys(languages);
                if (keys.length < 2) return undefined;
                const nextKey =
                  keys[(keys.indexOf(displayLocale) + 1) % keys.length];
                return languages[nextKey]?.name
                  ? `${t('Переключить на')} ${languages[nextKey].name}`
                  : t('Переключить язык');
              })()}
            >
              <IconGlobe />
              <span>{t('Язык')}</span>
              <LangBadge>{displayLocale}</LangBadge>
            </BottomButton>
          ) : null}

          {!isAnonymous && navbarRight?.user_info_url ? (
            <BottomLink href={navbarRight.user_info_url} onClick={onClose}>
              <IconProfile />
              {t('Личные данные')}
            </BottomLink>
          ) : null}
          {isAnonymous && navbarRight?.user_login_url ? (
            <BottomLink href={navbarRight.user_login_url}>
              {t('Войти')}
            </BottomLink>
          ) : null}
          {!isAnonymous && navbarRight?.user_logout_url ? (
            <BottomButton
              type="button"
              $variant="danger"
              onClick={() => {
                window.location.href = navbarRight.user_logout_url as string;
                onClose();
              }}
            >
              <IconLogout />
              {t('Выход')}
            </BottomButton>
          ) : null}
        </BottomBar>

        <BrandFooter>
          <span>{appTitle}</span>
          <span>
            {appVersion}
            {navbarRight?.version_string
              ? ` · ${navbarRight.version_string}`
              : ''}
          </span>
        </BrandFooter>
      </Dropdown>
    </>,
    document.body,
  );
};
