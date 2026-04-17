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
import { fireEvent, render, screen } from 'spec/helpers/testing-library';
import { UiConfigContext } from 'src/components/UiConfigContext';
import { Rail } from './Rail';
import { Drawer } from './Drawer';
import { ShellProvider } from './ShellContext';

const uiConfigShown = {
  hideTitle: false,
  hideTab: false,
  hideNav: false,
  hideChartControls: false,
  emitDataMasks: false,
  showRowLimitWarning: false,
};

const renderRail = (props = {}) =>
  render(
    <UiConfigContext.Provider value={uiConfigShown}>
      <ShellProvider>
        <Rail userInitials="ДК" {...props} />
      </ShellProvider>
    </UiConfigContext.Provider>,
    { useRouter: true, useTheme: true },
  );

describe('<Rail>', () => {
  it('рендерит все основные кнопки навигации с aria-label', () => {
    renderRail();
    expect(screen.getByLabelText('На главную')).toBeInTheDocument();
    expect(screen.getByLabelText('Главная')).toBeInTheDocument();
    expect(screen.getByLabelText('Каталог')).toBeInTheDocument();
    expect(screen.getByLabelText('Инструменты')).toBeInTheDocument();
    expect(screen.getByLabelText('Создать')).toBeInTheDocument();
    expect(screen.getByLabelText(/Поиск/)).toBeInTheDocument();
    expect(screen.getByLabelText('Календарь')).toBeInTheDocument();
    expect(screen.getByLabelText('Сменить тему')).toBeInTheDocument();
    expect(screen.getByLabelText('ИИ-аналитик')).toBeInTheDocument();
    expect(screen.getByLabelText('Настройки и профиль')).toBeInTheDocument();
  });

  it('вызывает onOpenSearch при клике на кнопку поиска', () => {
    const onOpenSearch = jest.fn();
    renderRail({ onOpenSearch });
    fireEvent.click(screen.getByLabelText(/Поиск/));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('кнопка ИИ-аналитика вызывает onOpenAi', () => {
    const onOpenAi = jest.fn();
    renderRail({ onOpenAi });
    fireEvent.click(screen.getByLabelText('ИИ-аналитик'));
    expect(onOpenAi).toHaveBeenCalledTimes(1);
  });

  it('nav имеет aria-label главной навигации', () => {
    renderRail();
    expect(screen.getByLabelText('Главная навигация')).toBeInTheDocument();
  });

  it('отображает инициалы пользователя на аватаре', () => {
    renderRail({ userInitials: 'ИП' });
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });
});

describe('<Drawer>', () => {
  it('закрыт по умолчанию (aria-hidden=true, 0 видимого контента)', () => {
    render(
      <ShellProvider>
        <Drawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    // Без открытия — контент не в DOM.
    expect(screen.queryByText('Содержимое появится в следующем этапе.')).toBeNull();
  });

  it('открывается при toggleDrawer через ShellContext', () => {
    const { container } = render(
      <ShellProvider>
        <Rail userInitials="ДК" />
        <Drawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByLabelText('Каталог'));
    expect(
      screen.getByText('Содержимое появится в следующем этапе.'),
    ).toBeInTheDocument();
    // Title — uppercase в DS 2.0, проверяем наличие обоих регистров (CSS-трансформ).
    expect(container.textContent).toContain('Каталог');
  });

  it('закрывается при повторном клике по той же кнопке rail', () => {
    render(
      <ShellProvider>
        <Rail userInitials="ДК" />
        <Drawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByLabelText('Каталог'));
    expect(
      screen.getByText('Содержимое появится в следующем этапе.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Каталог'));
    expect(screen.queryByText('Содержимое появится в следующем этапе.')).toBeNull();
  });

  it('Escape закрывает открытый drawer', () => {
    render(
      <ShellProvider>
        <Rail userInitials="ДК" />
        <Drawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByLabelText('Инструменты'));
    expect(
      screen.getByText('Содержимое появится в следующем этапе.'),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Содержимое появится в следующем этапе.')).toBeNull();
  });

  it('рендерит переданный content вместо placeholder', () => {
    render(
      <ShellProvider>
        <Rail userInitials="ДК" />
        <Drawer
          content={{
            create: <div data-test="create-body">Я контент create</div>,
          }}
        />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByLabelText('Создать'));
    expect(screen.getByText('Я контент create')).toBeInTheDocument();
  });
});
