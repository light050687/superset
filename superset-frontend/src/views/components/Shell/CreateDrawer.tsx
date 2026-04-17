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
import { type FC, type ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { useShell } from './ShellContext';

interface CreateDrawerProps {
  /** Колбэк, вызываемый после навигации — Shell закрывает drawer. */
  onAfterNavigate?: () => void;
}

interface CreateItem {
  key: string;
  label: string;
  url: string;
  accent: string;
  badge?: string;
  icon: ReactNode;
}

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s1}px;
  padding: ${DS2_SPACE.s1}px 0;
  font-family: ${DS2_VARS.fontSans};
`;

const GroupLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g500};
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s2}px ${DS2_SPACE.s1}px;
`;

const ItemRow = styled.button<{ $accent: string }>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  width: 100%;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  background: transparent;
  border: none;
  border-radius: ${DS2_RADIUS.control}px;
  color: ${({ $accent }) => $accent};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${DS2_VARS.g100};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

const Badge = styled.span`
  margin-left: auto;
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Divider = styled.div`
  height: 1px;
  background: ${DS2_VARS.g100};
  margin: ${DS2_SPACE.s2}px 0;
`;

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

const IconGlobe: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" />
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
    <path d="M3 7h10M3 11h10" />
  </svg>
);

export const CreateDrawer: FC<CreateDrawerProps> = ({ onAfterNavigate }) => {
  const history = useHistory();
  const { closeDrawer } = useShell();

  const go = (url: string) => {
    history.push(url);
    closeDrawer();
    onAfterNavigate?.();
  };

  const openExternal = (url: string) => {
    window.location.href = url;
  };

  const visualization: CreateItem[] = [
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
      url: '/chart/add?viz_type=deck_scatter',
      accent: '#2DD4BF',
      icon: <IconGlobe />,
    },
  ];

  const documents: CreateItem[] = [
    {
      key: 'table',
      label: t('Таблица'),
      url: '/univer/sheet/new',
      accent: DS2_VARS.cTangerine,
      badge: 'Univer',
      icon: <IconTable />,
    },
    {
      key: 'doc',
      label: t('Документ'),
      url: '/univer/doc/new',
      accent: DS2_VARS.cFuchsia,
      badge: 'Univer',
      icon: <IconDoc />,
    },
  ];

  const data: CreateItem[] = [
    {
      key: 'dataset',
      label: t('Датасет'),
      url: '/tablemodelview/list/?enable_create=true',
      accent: DS2_VARS.ink,
      icon: <IconDataset />,
    },
    {
      key: 'sql',
      label: t('SQL-запрос'),
      url: '/sqllab/?new=true',
      accent: DS2_VARS.ink,
      icon: <IconSql />,
    },
  ];

  const renderGroup = (label: string, items: CreateItem[]) => (
    <div key={label}>
      <GroupLabel>{label}</GroupLabel>
      {items.map(item => (
        <ItemRow
          key={item.key}
          type="button"
          $accent={item.accent}
          onClick={() => {
            // Univer-маршруты рендерятся не React Router, а внешним shell.
            if (item.url.startsWith('/univer/')) {
              openExternal(item.url);
              return;
            }
            go(item.url);
          }}
          aria-label={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge ? <Badge>{item.badge}</Badge> : null}
        </ItemRow>
      ))}
    </div>
  );

  return (
    <Body role="menu" aria-label={t('Создать')}>
      {renderGroup(t('Визуализация'), visualization)}
      <Divider />
      {renderGroup(t('Документы'), documents)}
      <Divider />
      {renderGroup(t('Данные'), data)}
    </Body>
  );
};
