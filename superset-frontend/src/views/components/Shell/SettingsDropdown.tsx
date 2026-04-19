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
 * SettingsDropdown — выпадающее меню настроек, открывается кликом по
 * кнопке профиля в Rail. Рендерит все нативные ссылки из
 * bootstrap.menu_data.settings (Безопасность / Данные / Управление),
 * плюс LanguagePicker, ThemeToggle, Logout и информацию о пользователе.
 *
 * Права учитываются автоматически: bootstrap отдаёт только те пункты,
 * на которые у текущего пользователя есть права. Мы просто отрисовываем.
 */
import { styled, t, ThemeMode } from '@superset-ui/core';
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { useThemeContext } from 'src/theme/ThemeProvider';
import type { BootstrapUser, MenuData } from 'src/types/bootstrapTypes';

interface SettingsDropdownProps {
  /** Привязка к кнопке rail — dropdown спозиционируется справа от неё. */
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

/* Pixel-perfect parity .dropdown.pm: blur 24 sat 160, radius 18, тень 30px 80px. */
const Dropdown = styled.div`
  background: ${DS2_VARS.dropdownBg};
  backdrop-filter: ${DS2_VARS.dropdownFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dropdownFilter};
  border: 1px solid ${DS2_VARS.dropdownBorder};
  border-radius: ${DS2_VARS.dropdownRadius};
  padding: ${DS2_SPACE.s1}px;
  min-width: 260px;
  max-width: 320px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  box-shadow: ${DS2_VARS.dropdownShadow};
  font-family: ${DS2_VARS.fontSans};
  color: ${DS2_VARS.ink};
  /* Над floating dock (101), scrim (99), под AI overlay (100). */
  z-index: 110;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s3}px;
  padding: ${DS2_SPACE.s3}px;
  border-bottom: 1px solid ${DS2_VARS.g100};
  margin-bottom: ${DS2_SPACE.s1}px;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${DS2_VARS.cViolet};
  color: ${DS2_VARS.s};
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${DS2_VARS.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserEmail = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Section = styled.div`
  padding: ${DS2_SPACE.s1}px 0;
  border-bottom: 1px solid ${DS2_VARS.g100};

  &:last-child {
    border-bottom: none;
  }
`;

const SectionLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g500};
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px ${DS2_SPACE.s1}px;
`;

const rowStyles = `
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
  border-radius: ${DS2_RADIUS.control}px;
  font-size: 12px;
  color: ${DS2_VARS.g700};
  cursor: pointer;
  text-decoration: none;
  transition: background 0.08s ${DS2_VARS.ease};
  line-height: 1.4;
`;

const RowAnchor = styled.a`
  ${rowStyles};
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

const RowLink = styled(Link)`
  ${rowStyles};
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

const RowButton = styled.button<{ $danger?: boolean }>`
  ${rowStyles};
  width: 100%;
  background: none;
  border: none;
  font-family: ${DS2_VARS.fontSans};
  text-align: left;
  color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.g700)};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.ink)};
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const Footer = styled.div`
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g400};
  border-top: 1px solid ${DS2_VARS.g100};
`;

const LangRow = styled.div`
  ${rowStyles};
  justify-content: space-between;
`;

const LangSwitch = styled.select`
  background: ${DS2_VARS.g50};
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g700};
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
`;

const ThemeRow = styled.div`
  ${rowStyles};
  justify-content: space-between;
  user-select: none;
`;

const Toggle = styled.button<{ $on: boolean }>`
  width: 34px;
  height: 18px;
  border-radius: 9px;
  border: none;
  background: ${({ $on }) => ($on ? DS2_VARS.cSky : DS2_VARS.g300)};
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s ${DS2_VARS.ease};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '18px' : '2px')};
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${DS2_VARS.s};
    transition: left 0.12s ${DS2_VARS.ease};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

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
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

interface Position {
  top: number;
  left: number;
}

/**
 * Позиционируем dropdown НАД anchor-кнопкой в floating dock (см. аналог
 * в CalendarDropdown). Settings — самый правый элемент дока, поэтому
 * dropdown чаще всего прижимается правым краем к viewport: clamp гарантирует
 * отступ 8px справа.
 */
function computePosition(
  anchor: HTMLElement,
  menuWidth: number,
  menuHeight: number,
): Position {
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const gap = 12;
  const anchorCenterX = rect.left + rect.width / 2;
  const rawLeft = anchorCenterX - menuWidth / 2;
  const left = Math.max(8, Math.min(rawLeft, viewportW - menuWidth - 8));
  const above = rect.top - menuHeight - gap;
  const top = above >= 8 ? above : rect.bottom + gap;
  return { top, left };
}

export const SettingsDropdown: FC<SettingsDropdownProps> = ({
  anchor,
  open,
  onClose,
  user,
  menu,
  isFrontendRoute,
  appTitle = 'Samberi Analytics',
  appVersion = 'v6.0.0',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>({ top: 12, left: 64 });
  const themeCtx = useThemeContext();
  const isDark = themeCtx?.themeMode === ThemeMode.DARK;

  useLayoutEffect(() => {
    if (!open || !anchor || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    setPos(computePosition(anchor, box.width, box.height));
  }, [open, anchor]);

  // Закрытие по Escape и клику вне.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && anchor && !anchor.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open, onClose, anchor]);

  const handleToggleTheme = useCallback(() => {
    if (!themeCtx) return;
    const next = isDark ? ThemeMode.DEFAULT : ThemeMode.DARK;
    themeCtx.setThemeMode(next);
  }, [themeCtx, isDark]);

  if (!open) return null;

  const { navbar_right: navbarRight, settings } = menu;
  const fullName = extractFullName(user);
  const initials = extractInitials(user);
  const languages = navbarRight?.languages ?? {};
  const currentLocale = navbarRight?.locale ?? 'en';
  const showLangPicker =
    (navbarRight?.show_language_picker ?? false) &&
    Object.keys(languages).length > 1;

  const renderLink = (
    label: ReactNode,
    url: string | undefined,
    key: string,
  ) => {
    if (!url) return null;
    if (isFrontendRoute?.(url)) {
      return (
        <RowLink key={key} to={url} onClick={onClose}>
          {label}
        </RowLink>
      );
    }
    return (
      <RowAnchor key={key} href={url} onClick={onClose}>
        {label}
      </RowAnchor>
    );
  };

  return createPortal(
    <Dropdown
      ref={ref}
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
      role="menu"
      aria-label={t('Настройки и профиль')}
    >
      {!navbarRight?.user_is_anonymous && user ? (
        <UserCard>
          <Avatar aria-hidden>{initials || '·'}</Avatar>
          <UserInfo>
            <UserName>{fullName || t('Пользователь')}</UserName>
            {user.email ? <UserEmail>{user.email}</UserEmail> : null}
          </UserInfo>
        </UserCard>
      ) : null}

      {/* Временный раздел: нативные Superset tool-страницы перенесены сюда
          из ToolsDrawer, пока «Инструменты» у нас отражают только мокап
          (Гео/Таблицы/Документы). Когда появятся собственные реализации —
          эту секцию можно сократить. */}
      <Section>
        <SectionLabel>{t('Инструменты администратора')}</SectionLabel>
        {renderLink(t('SQL Lab'), '/sqllab/', 'admin-sqllab')}
        {renderLink(
          t('Сохранённые запросы'),
          '/savedqueryview/list/',
          'admin-saved-queries',
        )}
        {renderLink(
          t('История запросов'),
          '/sqllab/history/',
          'admin-query-history',
        )}
        {renderLink(t('Датасеты'), '/tablemodelview/list/', 'admin-datasets')}
        {renderLink(t('Базы данных'), '/databaseview/list/', 'admin-databases')}
        {renderLink(t('Оповещения'), '/alert/list/', 'admin-alerts')}
        {renderLink(t('Отчёты'), '/report/list/', 'admin-reports')}
        {renderLink(
          t('CSS шаблоны'),
          '/csstemplatemodelview/list/',
          'admin-css',
        )}
        {renderLink(
          t('Аннотации'),
          '/annotationlayer/list/',
          'admin-annotations',
        )}
      </Section>

      {settings?.map(section => {
        if (!section.childs || section.childs.length === 0) return null;
        const links = section.childs
          .map((child, i) => {
            if (typeof child === 'string') return null;
            return renderLink(
              child.label,
              child.url,
              `${section.label}-${child.label}-${i}`,
            );
          })
          .filter(Boolean);
        if (links.length === 0) return null;
        return (
          <Section key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            {links}
          </Section>
        );
      })}

      <Section>
        <SectionLabel>{t('Вид')}</SectionLabel>
        <ThemeRow as="div">
          <span>{t('Тёмная тема')}</span>
          <Toggle
            type="button"
            $on={!!isDark}
            aria-pressed={!!isDark}
            aria-label={t('Переключить тёмную тему')}
            onClick={handleToggleTheme}
          />
        </ThemeRow>
        {showLangPicker ? (
          <LangRow as="div">
            <span>{t('Язык интерфейса')}</span>
            <LangSwitch
              value={currentLocale}
              aria-label={t('Язык интерфейса')}
              onChange={e => {
                const lang = languages[e.target.value];
                if (lang?.url) {
                  window.location.href = lang.url;
                }
              }}
            >
              {Object.keys(languages).map(key => (
                <option key={key} value={key}>
                  {languages[key].name}
                </option>
              ))}
            </LangSwitch>
          </LangRow>
        ) : null}
      </Section>

      {!navbarRight?.user_is_anonymous ? (
        <Section>
          <SectionLabel>{t('Профиль')}</SectionLabel>
          {navbarRight?.user_info_url
            ? renderLink(
                t('Личные данные'),
                navbarRight.user_info_url,
                'user-info',
              )
            : null}
          {navbarRight?.user_logout_url ? (
            <RowButton
              type="button"
              $danger
              onClick={() => {
                window.location.href = navbarRight.user_logout_url as string;
                onClose();
              }}
            >
              {t('Выход')}
            </RowButton>
          ) : null}
        </Section>
      ) : navbarRight?.user_login_url ? (
        <Section>
          <SectionLabel>{t('Профиль')}</SectionLabel>
          {renderLink(t('Войти'), navbarRight.user_login_url, 'login')}
        </Section>
      ) : null}

      <Footer>
        {appTitle} {appVersion}
        {navbarRight?.version_string ? ` · ${navbarRight.version_string}` : ''}
      </Footer>
    </Dropdown>,
    document.body,
  );
};
