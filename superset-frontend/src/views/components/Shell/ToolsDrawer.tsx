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

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s1}px;
  padding: ${DS2_SPACE.s1}px 0;
  font-family: ${DS2_VARS.fontSans};
`;

const ToolRow = styled.button`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  width: 100%;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  background: transparent;
  border: none;
  border-radius: ${DS2_RADIUS.control}px;
  color: ${DS2_VARS.g700};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: ${DS2_VARS.g500};
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Badge = styled.span`
  margin-left: auto;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g400};
`;

interface Tool {
  key: string;
  label: string;
  url: string;
  color?: string;
  icon?: ReactNode;
  count?: string;
}

export const ToolsDrawer: FC = () => {
  const history = useHistory();
  const { closeDrawer } = useShell();

  const go = (url: string) => {
    history.push(url);
    closeDrawer();
  };

  const tools: Tool[] = [
    {
      key: 'sql-lab',
      label: t('SQL Lab'),
      url: '/sqllab/',
      color: DS2_VARS.wn,
    },
    {
      key: 'saved-queries',
      label: t('Сохранённые запросы'),
      url: '/savedqueryview/list/',
      color: DS2_VARS.cSky,
    },
    {
      key: 'query-history',
      label: t('История запросов'),
      url: '/sqllab/history/',
      color: DS2_VARS.g500,
    },
    {
      key: 'geo',
      label: t('Гео-аналитика'),
      url: '/geomap/',
      color: '#2DD4BF',
    },
    {
      key: 'tags',
      label: t('Теги'),
      url: '/tags/',
      color: DS2_VARS.cFuchsia,
    },
    {
      key: 'databases',
      label: t('Подключения'),
      url: '/databaseview/list/',
      color: DS2_VARS.cTangerine,
    },
    {
      key: 'datasets',
      label: t('Датасеты'),
      url: '/tablemodelview/list/',
      color: DS2_VARS.cViolet,
    },
  ];

  return (
    <Body role="menu" aria-label={t('Инструменты')}>
      {tools.map(tool => (
        <ToolRow
          key={tool.key}
          type="button"
          onClick={() => go(tool.url)}
          aria-label={tool.label}
        >
          {tool.color ? <Dot $color={tool.color} /> : null}
          <span>{tool.label}</span>
          {tool.count ? <Badge>{tool.count}</Badge> : null}
        </ToolRow>
      ))}
    </Body>
  );
};
