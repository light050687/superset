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
 * CreateDrawer — сетка быстрого создания объектов в формате мокапа
 * (.dc-sections / .dc-grid / .dc-tile). Три секции:
 *   Визуализация  · Документы · Данные
 * Tile: цветная 38×38 иконка + label 12px.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, type ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { useShell } from './ShellContext';

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
  font-size: 9.5px;
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
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

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
  font-size: 12px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? DS2_VARS.g500 : DS2_VARS.ink)};
  text-align: center;
  line-height: 1.1;
`;

/* «Скоро» бейдж — absolutely-positioned внутри TileIcon, смещён в
   правый-верхний угол (top:-6 right:-10) чтобы перекрывать иконку
   на ~30-40% как просил пользователь. */
const ComingSoonBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -10px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${DS2_VARS.ink};
  background: ${DS2_VARS.cAmber};
  padding: 1px 5px;
  border-radius: 4px;
  box-shadow: none;
  pointer-events: none;
  white-space: nowrap;
  z-index: 1;
`;

/* ─── SVG иконки (мокап) ─── */

const IconDashboard: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="1" y="1" width="14" height="14" rx="2" />
    <path d="M1 5h14M5 1v14" />
  </svg>
);

const IconChart: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="6" width="3" height="8" rx="1" />
    <rect x="6.5" y="3" width="3" height="11" rx="1" />
    <rect x="11" y="1" width="3" height="13" rx="1" />
  </svg>
);

const IconTable: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <path d="M2 6h12M2 10h12M6 2v12" />
  </svg>
);

const IconDoc: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
    <path d="M10 2v4h4" />
  </svg>
);

/* ─── Data model ─── */

interface CreateItem {
  key: string;
  label: string;
  url: string;
  accent: string;
  icon: ReactNode;
  /** true — плитка серая, клик отключён, под лейблом «Скоро». */
  disabled?: boolean;
}

interface SectionDef {
  label: string;
  items: CreateItem[];
}

export const CreateDrawer: FC = () => {
  const history = useHistory();
  const { closeDrawer } = useShell();

  const go = (url: string) => {
    history.push(url);
    closeDrawer();
  };

  /* Все self-service плитки пока disabled с бейджем «Скоро» — включим
     когда будут готовы соответствующие потоки создания для not-admin
     пользователей. Секция «Данные» полностью убрана: Подключения/Датасеты
     живут в профиле (SettingsDropdown), SQL Lab — тоже там. */
  /* Гео-карта убрана из «Создать» — она живёт в «Инструментах» как
     отдельный кастомный плагин пользователя (ToolsDrawer → Карты). */
  const sections: SectionDef[] = [
    {
      label: t('Визуализация'),
      items: [
        {
          key: 'dashboard',
          label: t('Дашборд'),
          url: '/dashboard/new/',
          accent: DS2_VARS.cSky,
          icon: <IconDashboard />,
          disabled: true,
        },
        {
          key: 'chart',
          label: t('Диаграмма'),
          url: '/chart/add',
          accent: DS2_VARS.cViolet,
          icon: <IconChart />,
          disabled: true,
        },
      ],
    },
    {
      label: t('Документы'),
      items: [
        {
          key: 'table',
          label: t('Таблица'),
          url: '/chart/add?viz_type=table',
          accent: DS2_VARS.cTangerine,
          icon: <IconTable />,
          disabled: true,
        },
        {
          key: 'doc',
          label: t('Документ'),
          url: '/dashboard/new/?type=doc',
          accent: DS2_VARS.cFuchsia,
          icon: <IconDoc />,
          disabled: true,
        },
      ],
    },
  ];

  return (
    <Sections role="menu" aria-label={t('Создать')}>
      {sections.map(sec => (
        <Section key={sec.label}>
          <SecLabel>{sec.label}</SecLabel>
          <Grid>
            {sec.items.map(item => (
              <Tile
                key={item.key}
                type="button"
                $disabled={item.disabled}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  go(item.url);
                }}
                aria-label={item.label}
                aria-disabled={item.disabled}
                title={
                  item.disabled ? t('Скоро будет доступно') : item.label
                }
              >
                <TileIcon $accent={item.accent} $disabled={item.disabled}>
                  {item.icon}
                  {item.disabled ? (
                    <ComingSoonBadge>{t('Скоро')}</ComingSoonBadge>
                  ) : null}
                </TileIcon>
                <TileName $disabled={item.disabled}>{item.label}</TileName>
              </Tile>
            ))}
          </Grid>
        </Section>
      ))}
    </Sections>
  );
};
