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
 * ToolsDrawer — сетка инструментов Superset в формате мокапа
 * (.dc-sections / .dc-grid / .dc-tile). Каждая tile: цветная иконка
 * 38×38 в rounded bg + label 12px. Секции: SQL, Данные, Автоматизация.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, type ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { useShell } from './ShellContext';

/* ─── Structure по мокапу (dc-sections) ─── */

/* Мокап .drawer-body.dc-sections: padding 10 22 18 суммарно.
   Внешний DrawerBody даёт 4 22 18, здесь добавляем 6 сверху → итого 10/22/18. */
const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 0 0;
  font-family: ${DS2_VARS.fontSans};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s2}px;
`;

const SecLabel = styled.div`
  font-size: var(--fs-micro);
  font-weight: 600;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 2px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  gap: ${DS2_SPACE.s1 + 2}px;
`;

const Tile = styled.button<{ $disabled?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: ${DS2_SPACE.s2}px;
  padding: 14px 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.72 : 1)};
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease},
    transform 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $disabled }) =>
      $disabled ? 'transparent' : DS2_VARS.tileHoverBg};
    border-color: ${({ $disabled }) =>
      $disabled ? 'transparent' : DS2_VARS.tileHoverBorder};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const TileIcon = styled.div<{ $accent: string; $disabled?: boolean }>`
  position: relative;
  width: 38px;
  height: 38px;
  box-sizing: border-box;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $accent, $disabled }) =>
    $disabled
      ? DS2_VARS.bg3
      : `color-mix(in oklab, ${$accent} 12%, ${DS2_VARS.bg3})`};
  border: 1px solid ${DS2_VARS.g200};
  color: ${({ $accent, $disabled }) => ($disabled ? DS2_VARS.g400 : $accent)};
  filter: ${({ $disabled }) => ($disabled ? 'grayscale(1)' : 'none')};

  svg {
    width: 19px;
    height: 19px;
  }
`;

const TileName = styled.span<{ $disabled?: boolean }>`
  font-size: var(--fs-meta);
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? DS2_VARS.g500 : DS2_VARS.ink)};
  text-align: center;
  line-height: 1.1;
`;

/* «Скоро» бейдж — absolutely-positioned относительно Tile (не TileIcon!),
   чтобы остаться цветным: grayscale-фильтр на TileIcon обесцвечивал бы
   вложенный бейдж. Единый цвет cAmber для всех бейджей «Скоро» по DS 2.0. */
const ComingSoonBadge = styled.span`
  position: absolute;
  top: 8px;
  right: 14px;
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: ${DS2_VARS.cAmber};
  padding: 1px 5px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  white-space: nowrap;
  z-index: 2;
`;

/* ─── Inline SVG иконки (16×16 viewBox, stroke currentColor) ─── */

/* Мокап toolDefs — Гео-аналитика, Таблицы, Документы. */
const IconGeo: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12M8 2a8 8 0 010 12M8 2a8 8 0 000 12" />
  </svg>
);

const IconTablesBig: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <path d="M2 6h12M2 10h12M6 2v12" />
  </svg>
);

const IconDoc: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
    <path d="M10 2v4h4" />
  </svg>
);

/* ─── Data model ─── */

interface Tool {
  key: string;
  label: string;
  url: string;
  accent: string;
  icon: ReactNode;
  /** true — серая плитка с бейджем «Скоро», клик отключён. */
  disabled?: boolean;
}

interface SectionDef {
  label: string;
  tools: Tool[];
}

export const ToolsDrawer: FC<React.PropsWithChildren<unknown>> = () => {
  const history = useHistory();
  const { closeDrawer } = useShell();

  const go = (url: string) => {
    history.push(url);
    closeDrawer();
  };

  // Мокап structure (analytics-floating-dock.html):
  //   - Карты: Гео-аналитика
  //   - Таблицы и документы: Таблицы, Документы
  // Нативные Superset-инструменты (SQL Lab, Сохранённые, История запросов,
  // Датасеты, Базы данных, Оповещения, Отчёты, CSS шаблоны, Аннотации)
  // временно перенесены в SettingsDropdown (раздел «Инструменты администратора»),
  // пока у нас нет собственных страниц Гео/Таблиц/Документов.
  const sections: SectionDef[] = [
    {
      label: t('Карты'),
      tools: [
        {
          key: 'geo',
          /* Гео-аналитика — кастомный плагин пользователя. URL ведёт на
             создание чарта с viz_type плагина. TODO: заменить на точный
             viz_type когда плагин зарегистрирован (ext-geo-*). */
          label: t('Гео-аналитика'),
          url: '/chart/add?viz_type=deck_geojson',
          accent: DS2_VARS.up,
          icon: <IconGeo />,
        },
      ],
    },
    {
      label: t('Таблицы и документы'),
      tools: [
        {
          key: 'tables',
          label: t('Таблицы'),
          url: '/chart/add?viz_type=table',
          accent: DS2_VARS.cTangerine,
          icon: <IconTablesBig />,
          disabled: true,
        },
        {
          key: 'docs',
          label: t('Документы'),
          url: '/dashboard/new/?type=doc',
          accent: DS2_VARS.cFuchsia,
          icon: <IconDoc />,
          disabled: true,
        },
      ],
    },
  ];

  return (
    <Sections role="menu" aria-label={t('Инструменты')}>
      {sections.map(sec => (
        <Section key={sec.label}>
          <SecLabel>{sec.label}</SecLabel>
          <Grid>
            {sec.tools.map(tool => (
              <Tile
                key={tool.key}
                type="button"
                $disabled={tool.disabled}
                disabled={tool.disabled}
                onClick={() => {
                  if (tool.disabled) return;
                  go(tool.url);
                }}
                aria-label={tool.label}
                aria-disabled={tool.disabled}
                title={tool.disabled ? t('Скоро будет доступно') : tool.label}
              >
                <TileIcon $accent={tool.accent} $disabled={tool.disabled}>
                  {tool.icon}
                </TileIcon>
                {tool.disabled ? (
                  <ComingSoonBadge>{t('Скоро')}</ComingSoonBadge>
                ) : null}
                <TileName $disabled={tool.disabled}>{tool.label}</TileName>
              </Tile>
            ))}
          </Grid>
        </Section>
      ))}
    </Sections>
  );
};
