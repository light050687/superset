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
import { CreateDrawer } from './CreateDrawer';
import { ShellProvider } from './ShellContext';

describe('<CreateDrawer>', () => {
  it('рендерит три группы с правильными пунктами', () => {
    render(
      <ShellProvider>
        <CreateDrawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    expect(screen.getByText('Визуализация')).toBeInTheDocument();
    expect(screen.getByText('Документы')).toBeInTheDocument();
    expect(screen.getByText('Данные')).toBeInTheDocument();
    expect(screen.getByText('Дашборд')).toBeInTheDocument();
    expect(screen.getByText('Диаграмма')).toBeInTheDocument();
    expect(screen.getByText('Гео-карта')).toBeInTheDocument();
    expect(screen.getByText('Таблица')).toBeInTheDocument();
    expect(screen.getByText('Документ')).toBeInTheDocument();
    expect(screen.getByText('Датасет')).toBeInTheDocument();
    expect(screen.getByText('SQL-запрос')).toBeInTheDocument();
  });

  it('показывает бейдж Univer для Таблицы и Документа', () => {
    render(
      <ShellProvider>
        <CreateDrawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    expect(screen.getAllByText('Univer')).toHaveLength(2);
  });

  it('клик на Дашборд вызывает onAfterNavigate', () => {
    const after = jest.fn();
    render(
      <ShellProvider>
        <CreateDrawer onAfterNavigate={after} />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByLabelText('Дашборд'));
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('aria-label "Создать" задан на root', () => {
    render(
      <ShellProvider>
        <CreateDrawer />
      </ShellProvider>,
      { useRouter: true, useTheme: true },
    );
    expect(screen.getByLabelText('Создать')).toBeInTheDocument();
  });
});
