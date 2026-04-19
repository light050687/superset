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

const Tile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: ${DS2_SPACE.s2}px;
  padding: 14px 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.tileHoverBg};
    border-color: ${DS2_VARS.tileHoverBorder};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const TileIcon = styled.div<{ $accent: string }>`
  width: 38px;
  height: 38px;
  box-sizing: border-box;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $accent }) =>
    `color-mix(in oklab, ${$accent} 12%, ${DS2_VARS.bg3})`};
  border: 1px solid ${DS2_VARS.g200};
  color: ${({ $accent }) => $accent};

  svg {
    width: 19px;
    height: 19px;
  }
`;

const TileName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${DS2_VARS.ink};
  text-align: center;
  line-height: 1.1;
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

const IconGeo: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12" />
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

const IconDataset: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M2 6h12" />
  </svg>
);

const IconSql: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 3h10v10H3z" />
    <path d="M3 7h10" />
  </svg>
);

const IconDatabase: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="8" cy="3" rx="5" ry="1.6" />
    <path d="M3 3v10c0 .9 2.2 1.6 5 1.6s5-.7 5-1.6V3M3 8c0 .9 2.2 1.6 5 1.6s5-.7 5-1.6" />
  </svg>
);

/* ─── Data model ─── */

interface CreateItem {
  key: string;
  label: string;
  url: string;
  accent: string;
  icon: ReactNode;
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
        },
        {
          key: 'chart',
          label: t('Диаграмма'),
          url: '/chart/add',
          accent: DS2_VARS.cViolet,
          icon: <IconChart />,
        },
        {
          key: 'geo',
          label: t('Гео-карта'),
          url: '/chart/add?viz_type=deck_geojson',
          accent: DS2_VARS.up,
          icon: <IconGeo />,
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
        },
        {
          key: 'doc',
          label: t('Документ'),
          url: '/dashboard/new/?type=doc',
          accent: DS2_VARS.cFuchsia,
          icon: <IconDoc />,
        },
      ],
    },
    {
      label: t('Данные'),
      items: [
        {
          key: 'dataset',
          label: t('Датасет'),
          url: '/tablemodelview/add',
          accent: DS2_VARS.g600,
          icon: <IconDataset />,
        },
        {
          key: 'sql',
          label: t('SQL-запрос'),
          url: '/sqllab/',
          accent: DS2_VARS.g600,
          icon: <IconSql />,
        },
        {
          key: 'database',
          label: t('Подключение к БД'),
          url: '/databaseview/add',
          accent: DS2_VARS.cAmber,
          icon: <IconDatabase />,
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
                onClick={() => go(item.url)}
                aria-label={item.label}
                title={item.label}
              >
                <TileIcon $accent={item.accent}>{item.icon}</TileIcon>
                <TileName>{item.label}</TileName>
              </Tile>
            ))}
          </Grid>
        </Section>
      ))}
    </Sections>
  );
};
