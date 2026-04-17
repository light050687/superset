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
import { Rail } from './Rail';
import { ShellProvider } from './ShellContext';

const Story = (args: any) => (
  <MemoryRouter>
    <ShellProvider>
      <div style={{ display: 'flex', minHeight: 600, background: 'var(--bg)' }}>
        <Rail {...args} />
        <div style={{ flex: 1, padding: 24, color: 'var(--ink)' }}>
          <p style={{ color: 'var(--g500)', fontSize: 12 }}>
            Rail (56px) — главная навигация
          </p>
        </div>
      </div>
    </ShellProvider>
  </MemoryRouter>
);

export default {
  title: 'Shell/Rail',
  component: Rail,
  parameters: {
    docs: {
      description: {
        component:
          'Вертикальный rail (56px) — заменяет классический top-bar Menu Superset. ' +
          'Содержит 9 кнопок: Главная, Каталог, Инструменты, Создать, Поиск, ' +
          'Календарь, Тема, ИИ-аналитик, Настройки/Профиль.',
      },
    },
  },
};

export const Default = Story.bind({});
Default.args = {
  userInitials: 'ДК',
};

export const WithBadges = Story.bind({});
WithBadges.args = {
  userInitials: 'ИП',
  aiBadgeColor: '#16A34A',
  calendarBadgeColor: '#E87C3E',
};

export const NoUser = Story.bind({});
NoUser.args = {
  userInitials: '',
};
