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

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 22px 18px;
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
    border-color 0.12s ${DS2_VARS.ease},
    transform 0.12s ${DS2_VARS.ease};

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

/* ─── Inline SVG иконки (16×16 viewBox, stroke currentColor) ─── */

const IconSql: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="8" cy="3.5" rx="5" ry="1.8" />
    <path d="M3 3.5v9c0 1 2.3 1.8 5 1.8s5-.8 5-1.8v-9" />
    <path d="M3 8c0 1 2.3 1.8 5 1.8s5-.8 5-1.8" />
  </svg>
);

const IconSaved: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M4 2h8v12l-4-3-4 3V2z" />
  </svg>
);

const IconHistory: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M8 4v4l3 2" />
    <path d="M8 14A6 6 0 108 2a6 6 0 000 12z" />
  </svg>
);

const IconDataset: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M2 6h12M6 2v12" />
  </svg>
);

const IconDatabase: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="8" cy="3" rx="5" ry="1.6" />
    <path d="M3 3v10c0 .9 2.2 1.6 5 1.6s5-.7 5-1.6V3M3 8c0 .9 2.2 1.6 5 1.6s5-.7 5-1.6" />
  </svg>
);

const IconAlert: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 12V7a5 5 0 0110 0v5l1.5 1.5h-13L3 12z" />
    <path d="M6.5 13.5a1.5 1.5 0 003 0" />
  </svg>
);

const IconReport: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="3" y="2" width="10" height="12" rx="1" />
    <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
  </svg>
);

const IconCss: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 2l1 12 4 1 4-1 1-12H3z" />
    <path d="M5 5h6l-.3 3H6l.2 2 2.3.7 2.3-.7.1-1" />
  </svg>
);

const IconAnnotation: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 3.5a1.5 1.5 0 011.5-1.5h9A1.5 1.5 0 0114 3.5v7a1.5 1.5 0 01-1.5 1.5H6l-3 3v-3H3.5a1.5 1.5 0 01-1.5-1.5v-7z" />
  </svg>
);

/* ─── Data model ─── */

interface Tool {
  key: string;
  label: string;
  url: string;
  accent: string;
  icon: ReactNode;
}

interface SectionDef {
  label: string;
  tools: Tool[];
}

export const ToolsDrawer: FC = () => {
  const history = useHistory();
  const { closeDrawer } = useShell();

  const go = (url: string) => {
    history.push(url);
    closeDrawer();
  };

  // Секции по мокапу (dc-section+dc-grid), пункты — native Superset
  // tool-страницы. Без визуализаций (Dashboards/Charts) — они в «Каталоге».
  const sections: SectionDef[] = [
    {
      label: t('SQL'),
      tools: [
        {
          key: 'sqllab',
          label: t('SQL Lab'),
          url: '/sqllab/',
          accent: DS2_VARS.cSky,
          icon: <IconSql />,
        },
        {
          key: 'saved-queries',
          label: t('Сохранённые'),
          url: '/savedqueryview/list/',
          accent: DS2_VARS.cViolet,
          icon: <IconSaved />,
        },
        {
          key: 'query-history',
          label: t('История запросов'),
          url: '/sqllab/history/',
          accent: DS2_VARS.g600,
          icon: <IconHistory />,
        },
      ],
    },
    {
      label: t('Данные'),
      tools: [
        {
          key: 'datasets',
          label: t('Датасеты'),
          url: '/tablemodelview/list/',
          accent: DS2_VARS.cTangerine,
          icon: <IconDataset />,
        },
        {
          key: 'databases',
          label: t('Базы данных'),
          url: '/databaseview/list/',
          accent: DS2_VARS.cAmber,
          icon: <IconDatabase />,
        },
      ],
    },
    {
      label: t('Автоматизация и стили'),
      tools: [
        {
          key: 'alerts',
          label: t('Оповещения'),
          url: '/alert/list/',
          accent: DS2_VARS.dn,
          icon: <IconAlert />,
        },
        {
          key: 'reports',
          label: t('Отчёты'),
          url: '/report/list/',
          accent: DS2_VARS.up,
          icon: <IconReport />,
        },
        {
          key: 'css-templates',
          label: t('CSS шаблоны'),
          url: '/csstemplatemodelview/list/',
          accent: DS2_VARS.cFuchsia,
          icon: <IconCss />,
        },
        {
          key: 'annotations',
          label: t('Аннотации'),
          url: '/annotationlayer/list/',
          accent: DS2_VARS.g600,
          icon: <IconAnnotation />,
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
                onClick={() => go(tool.url)}
                aria-label={tool.label}
                title={tool.label}
              >
                <TileIcon $accent={tool.accent}>{tool.icon}</TileIcon>
                <TileName>{tool.label}</TileName>
              </Tile>
            ))}
          </Grid>
        </Section>
      ))}
    </Sections>
  );
};
