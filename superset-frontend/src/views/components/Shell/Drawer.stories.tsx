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
import { MemoryRouter } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Rail } from './Rail';
import { ShellProvider } from './ShellContext';
import type { DrawerKind } from './types';

interface Args {
  openedKind: DrawerKind | null;
  withContent?: boolean;
}

const DemoOpener = ({ openedKind }: { openedKind: DrawerKind | null }) => {
  // Маленький хелпер, чтобы открыть drawer на mount через ShellProvider API.
  // В реальном приложении drawer открывается кликом по rail.
  const { toggleDrawer } = require('./ShellContext').useShell();
  if (openedKind) {
    setTimeout(() => toggleDrawer(openedKind), 0);
  }
  return null;
};

const Story = ({ openedKind, withContent }: Args) => (
  <MemoryRouter>
    <ShellProvider>
      <DemoOpener openedKind={openedKind} />
      <div style={{ display: 'flex', minHeight: 600, background: 'var(--bg)' }}>
        <Rail userInitials="ДК" />
        <Drawer
          content={
            withContent
              ? {
                  catalog: (
                    <div style={{ padding: 12, fontSize: 12 }}>
                      <div style={{ color: 'var(--g500)', marginBottom: 8 }}>
                        Избранное · Недавние · Департаменты
                      </div>
                      <div style={{ color: 'var(--ink)' }}>
                        Здесь дерево папок каталога (этап 3)
                      </div>
                    </div>
                  ),
                  tools: (
                    <div style={{ padding: 12, fontSize: 12, color: 'var(--ink)' }}>
                      Гео · Таблицы · Документы · Self-service (этап 6)
                    </div>
                  ),
                  create: (
                    <div style={{ padding: 12, fontSize: 12, color: 'var(--ink)' }}>
                      Дашборд · Диаграмма · Датасет · SQL (этап 6)
                    </div>
                  ),
                }
              : undefined
          }
        />
        <div style={{ flex: 1, padding: 24, color: 'var(--ink)' }}>
          <p style={{ color: 'var(--g500)', fontSize: 12 }}>
            Кликните по кнопке rail, чтобы открыть/закрыть drawer
          </p>
        </div>
      </div>
    </ShellProvider>
  </MemoryRouter>
);

export default {
  title: 'Shell/Drawer',
  component: Drawer,
  parameters: {
    docs: {
      description: {
        component:
          'Выдвижная панель (220px), открывается кликом по кнопке rail. ' +
          'Типы: catalog, tools, create. Содержимое наполняется по мере ' +
          'реализации этапов (каркас показывает placeholder).',
      },
    },
  },
  argTypes: {
    openedKind: {
      control: { type: 'select' },
      options: [null, 'catalog', 'tools', 'create'],
    },
    withContent: { control: 'boolean' },
  },
};

export const Closed = Story.bind({});
Closed.args = { openedKind: null, withContent: false };

export const CatalogEmpty = Story.bind({});
CatalogEmpty.args = { openedKind: 'catalog', withContent: false };

export const CatalogWithContent = Story.bind({});
CatalogWithContent.args = { openedKind: 'catalog', withContent: true };

export const ToolsWithContent = Story.bind({});
ToolsWithContent.args = { openedKind: 'tools', withContent: true };

export const CreateWithContent = Story.bind({});
CreateWithContent.args = { openedKind: 'create', withContent: true };
