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
import { MobileNav } from './MobileNav';
import { ShellProvider } from './ShellContext';

const renderNav = (props = {}) =>
  render(
    <ShellProvider>
      <MobileNav userInitials="ДК" {...props} />
    </ShellProvider>,
    { useRouter: true, useTheme: true },
  );

describe('<MobileNav>', () => {
  it('рендерит 4 tab-кнопки с aria-label', () => {
    renderNav();
    expect(screen.getByLabelText('Главная')).toBeInTheDocument();
    expect(screen.getByLabelText('Каталог')).toBeInTheDocument();
    expect(screen.getByLabelText('ИИ-аналитик')).toBeInTheDocument();
    expect(screen.getByLabelText('Настройки и профиль')).toBeInTheDocument();
  });

  it('nav имеет aria-label мобильной навигации', () => {
    renderNav();
    expect(
      screen.getByLabelText('Главная навигация (мобильная)'),
    ).toBeInTheDocument();
  });

  it('клик по "ИИ-аналитик" вызывает onOpenAi', () => {
    const onOpenAi = jest.fn();
    renderNav({ onOpenAi });
    fireEvent.click(screen.getByLabelText('ИИ-аналитик'));
    expect(onOpenAi).toHaveBeenCalledTimes(1);
  });

  it('клик по "Настройки и профиль" вызывает onOpenSettings', () => {
    const onOpenSettings = jest.fn();
    renderNav({ onOpenSettings });
    fireEvent.click(screen.getByLabelText('Настройки и профиль'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('клик по "Каталог" переключает drawer через ShellContext', () => {
    // Проверяем aria-pressed после клика — подтверждает что toggleDrawer сработал
    renderNav();
    const catalog = screen.getByLabelText('Каталог');
    expect(catalog).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(catalog);
    expect(catalog).toHaveAttribute('aria-pressed', 'true');
  });

  it('отображает инициалы пользователя в avatar-tab', () => {
    renderNav({ userInitials: 'ИП' });
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });
});
