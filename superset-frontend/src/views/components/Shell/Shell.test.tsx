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
import {
  DEFAULT_AI_CONTEXT,
  DEFAULT_AI_MODEL,
  type AiContext,
  type AiModelId,
} from './CentralPillTypes';
import { Drawer } from './Drawer';
import { Shell } from './Shell';
import { ShellProvider } from './ShellContext';

const uiConfigShown = {
  hideTitle: false,
  hideTab: false,
  hideNav: false,
  hideChartControls: false,
  emitDataMasks: false,
  showRowLimitWarning: false,
};

const defaultPillProps = {
  contexts: [DEFAULT_AI_CONTEXT] as readonly AiContext[],
  contextId: DEFAULT_AI_CONTEXT.id,
  onContextChange: jest.fn(),
  modelId: DEFAULT_AI_MODEL as AiModelId,
  onModelChange: jest.fn(),
};

const renderRail = (props = {}) =>
  render(
    <UiConfigContext.Provider value={uiConfigShown}>
      <ShellProvider>
        <Rail userInitials="ДК" {...defaultPillProps} {...props} />
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
    expect(screen.getByLabelText('Календарь')).toBeInTheDocument();
    expect(screen.getByLabelText('Сменить тему')).toBeInTheDocument();
    expect(screen.getByLabelText('ИИ-аналитик')).toBeInTheDocument();
    expect(screen.getByLabelText('Настройки и профиль')).toBeInTheDocument();
  });

  it('рендерит CentralPill с input и chip контекста', () => {
    renderRail();
    expect(screen.getByLabelText('Запрос ИИ или поиск')).toBeInTheDocument();
    // Chip показывает label контекста «Общий» по умолчанию.
    expect(screen.getByText(DEFAULT_AI_CONTEXT.label)).toBeInTheDocument();
  });

  it('CentralPill Enter с текстом вызывает onOpenAi(query, meta)', () => {
    const onOpenAi = jest.fn();
    renderRail({ onOpenAi });
    const input = screen.getByLabelText('Запрос ИИ или поиск') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Какая маржа?' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(onOpenAi).toHaveBeenCalledTimes(1);
    expect(onOpenAi).toHaveBeenCalledWith(
      'Какая маржа?',
      expect.objectContaining({
        contextId: DEFAULT_AI_CONTEXT.id,
        modelId: DEFAULT_AI_MODEL,
      }),
    );
  });

  it('CentralPill Enter с пустым текстом НЕ вызывает onOpenAi', () => {
    const onOpenAi = jest.fn();
    renderRail({ onOpenAi });
    const input = screen.getByLabelText('Запрос ИИ или поиск') as HTMLInputElement;
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(onOpenAi).not.toHaveBeenCalled();
  });

  it('кнопка ИИ-аналитика вызывает onOpenAi без seed', () => {
    const onOpenAi = jest.fn();
    renderRail({ onOpenAi });
    fireEvent.click(screen.getByLabelText('ИИ-аналитик'));
    expect(onOpenAi).toHaveBeenCalledTimes(1);
    expect(onOpenAi).toHaveBeenCalledWith();
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
    expect(screen.queryByText('Содержимое появится в следующем этапе.')).toBeNull();
  });

  it('открывается при toggleDrawer через ShellContext', () => {
    const { container } = render(
      <ShellProvider>
        <Rail userInitials="ДК" {...defaultPillProps} />
        <Drawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByLabelText('Каталог'));
    expect(
      screen.getByText('Содержимое появится в следующем этапе.'),
    ).toBeInTheDocument();
    expect(container.textContent).toContain('Каталог');
  });

  it('закрывается при повторном клике по той же кнопке rail', () => {
    render(
      <ShellProvider>
        <Rail userInitials="ДК" {...defaultPillProps} />
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
        <Rail userInitials="ДК" {...defaultPillProps} />
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
        <Rail userInitials="ДК" {...defaultPillProps} />
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

describe('<Shell> embedded-режим', () => {
  it('при hideNav=true рендерит только children без Rail/Drawer', () => {
    const uiHidden = { ...uiConfigShown, hideNav: true };
    render(
      <UiConfigContext.Provider value={uiHidden}>
        <Shell user={undefined}>
          <div>Дашборд без shell</div>
        </Shell>
      </UiConfigContext.Provider>,
      { useRouter: true, useTheme: true },
    );
    expect(screen.getByText('Дашборд без shell')).toBeInTheDocument();
    expect(screen.queryByLabelText('Главная навигация')).toBeNull();
  });

  it('при hideNav=false рендерит Rail + children', () => {
    render(
      <UiConfigContext.Provider value={uiConfigShown}>
        <Shell user={undefined}>
          <div>Обычный режим</div>
        </Shell>
      </UiConfigContext.Provider>,
      { useRouter: true, useTheme: true },
    );
    expect(screen.getByText('Обычный режим')).toBeInTheDocument();
    expect(screen.getByLabelText('Главная навигация')).toBeInTheDocument();
  });
});
