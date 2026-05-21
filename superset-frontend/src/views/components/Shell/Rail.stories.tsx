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
import { DEFAULT_AI_CONTEXT, DEFAULT_AI_MODEL } from './CentralPillTypes';
import { ShellProvider } from './ShellContext';

const pillProps = {
  contexts: [
    DEFAULT_AI_CONTEXT,
    {
      id: 'dashboard_loss_q1',
      label: 'Потери Q1',
      colorVar: 'var(--c-sky)',
      hint: 'Дашборд потерь за 1 квартал',
    },
    {
      id: 'dashboard_sales',
      label: 'Продажи магазинов',
      colorVar: 'var(--c-tangerine)',
      hint: 'Дашборд продаж по магазинам',
    },
  ],
  contextId: DEFAULT_AI_CONTEXT.id,
  onContextChange: () => {},
  modelId: DEFAULT_AI_MODEL,
  onModelChange: () => {},
};

const Story = (args: any) => (
  <MemoryRouter>
    <ShellProvider>
      <div
        style={{
          position: 'relative',
          minHeight: 600,
          background: 'var(--bg)',
          padding: 24,
          paddingBottom: 'var(--dock-content-pad)',
          color: 'var(--ink)',
        }}
      >
        <p style={{ color: 'var(--g500)', fontSize: 12 }}>
          Floating Dock — плавающая навигация внизу экрана (Liquid Glass)
        </p>
        <Rail {...pillProps} {...args} />
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
          'Floating Dock (58px) — горизонтальный плавающий dock внизу экрана, ' +
          'пришёл на смену вертикальному Rail. Liquid Glass + magnification. ' +
          '9 кнопок: Главная, Каталог, Инструменты, Создать, Поиск (будет заменено ' +
          'на CentralPill в Этапе 2), Календарь, Тема, ИИ-аналитик, Настройки/Профиль.',
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
  catalogBadgeColor: '#3B8BD9',
};

export const NoUser = Story.bind({});
NoUser.args = {
  userInitials: '',
};
