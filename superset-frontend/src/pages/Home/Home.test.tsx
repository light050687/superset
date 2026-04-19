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
import fetchMock from 'fetch-mock';
import { render, screen, waitFor } from 'spec/helpers/testing-library';
// Импортируем HomeBento напрямую, т.к. дефолтный экспорт Home
// типизирован как ComponentType без props (требование routes.tsx).
import { HomeBento as Welcome } from 'src/features/home/bento';

const dashboardsEndpoint = 'glob:*/api/v1/dashboard/?*';
const chartsEndpoint = 'glob:*/api/v1/chart/?*';
const recentActivityEndpoint = 'glob:*/api/v1/log/recent_activity/*';
const catalogTreeEndpoint = 'glob:*/api/v1/catalog_folder/tree*';

beforeEach(() => {
  fetchMock.reset();

  fetchMock.get(dashboardsEndpoint, {
    result: [
      {
        id: 3,
        dashboard_title: 'Мой любимый дашборд',
        url: '/superset/dashboard/3/',
        changed_on_delta_humanized: '2 ч',
        status: 'published',
      },
    ],
  });

  fetchMock.get(chartsEndpoint, {
    result: [
      {
        id: 4,
        slice_name: 'Маржа',
        url: '/explore/?slice_id=4',
        changed_on_delta_humanized: '1 д',
        viz_type: 'bar',
      },
    ],
  });

  fetchMock.get(recentActivityEndpoint, {
    result: [
      {
        action: 'dashboard',
        item_type: 'dashboard',
        item_url: '/superset/dashboard/19/',
        item_title: 'Недавний дашборд',
        time: 1741644942130,
        time_delta_humanized: 'час назад',
      },
      {
        action: 'dashboard',
        item_type: 'dashboard',
        // дубль — должен быть отфильтрован
        item_url: '/superset/dashboard/19/',
        item_title: 'Недавний дашборд',
        time: 1741644381695,
        time_delta_humanized: '2 часа назад',
      },
    ],
  });

  fetchMock.get(catalogTreeEndpoint, {
    result: [
      {
        id: 1,
        parent_id: null,
        name: 'Коммерция',
        description: null,
        color: '#3B8BD9',
        position: 0,
        item_count: 8,
      },
      {
        id: 2,
        parent_id: null,
        name: 'Потери',
        description: null,
        color: '#DC2626',
        position: 1,
        item_count: 5,
      },
    ],
  });
});

afterEach(() => {
  fetchMock.resetHistory();
});

const mockedUser = {
  username: 'alpha',
  firstName: 'Алексей',
  lastName: 'Петров',
  createdOn: '2016-11-11T12:34:17',
  userId: 5,
  email: 'alpha@alpha.com',
  isActive: true,
  isAnonymous: false,
  permissions: {},
  roles: {},
};

const renderWelcome = () =>
  render(<Welcome user={mockedUser} />, {
    useRedux: true,
    useRouter: true,
    useDnd: true,
    useTheme: true,
  });

test('рендерит приветствие с именем пользователя', async () => {
  renderWelcome();
  expect(await screen.findByText('Привет, Алексей')).toBeInTheDocument();
});

test('рендерит все три секции: Избранное, Недавние, Департаменты', async () => {
  renderWelcome();
  expect(await screen.findByText('Избранное')).toBeInTheDocument();
  expect(await screen.findByText('Недавние')).toBeInTheDocument();
  expect(await screen.findByText('Департаменты')).toBeInTheDocument();
});

test('загружает и показывает избранный дашборд', async () => {
  renderWelcome();
  expect(
    await screen.findByText('Мой любимый дашборд'),
  ).toBeInTheDocument();
});

test('показывает недавнюю активность без дублей', async () => {
  renderWelcome();
  await waitFor(() => {
    const hits = screen.queryAllByText('Недавний дашборд');
    expect(hits).toHaveLength(1);
  });
});

test('показывает папки каталога как тайлы департаментов', async () => {
  renderWelcome();
  expect(await screen.findByText('Коммерция')).toBeInTheDocument();
  expect(await screen.findByText('Потери')).toBeInTheDocument();
});

test('вызывает все API на монтировании', async () => {
  renderWelcome();
  await screen.findByText('Коммерция');
  // два favorite-вызова (dashboard + chart) + recent activity + catalog tree
  expect(fetchMock.calls(dashboardsEndpoint).length).toBeGreaterThanOrEqual(1);
  expect(fetchMock.calls(chartsEndpoint).length).toBeGreaterThanOrEqual(1);
  expect(fetchMock.calls(recentActivityEndpoint).length).toBeGreaterThanOrEqual(1);
  expect(fetchMock.calls(catalogTreeEndpoint).length).toBeGreaterThanOrEqual(1);
});

test('пустое избранное показывает подсказку', async () => {
  fetchMock.reset();
  fetchMock.get(dashboardsEndpoint, { result: [] });
  fetchMock.get(chartsEndpoint, { result: [] });
  fetchMock.get(recentActivityEndpoint, { result: [] });
  fetchMock.get(catalogTreeEndpoint, { result: [] });

  renderWelcome();
  expect(
    await screen.findByText(/В избранном пока пусто/i),
  ).toBeInTheDocument();
});
