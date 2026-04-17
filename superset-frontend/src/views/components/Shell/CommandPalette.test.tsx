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
import { CommandPalette } from './CommandPalette';

describe('<CommandPalette>', () => {
  it('не рендерится когда open=false', () => {
    render(<CommandPalette open={false} onClose={() => {}} />, {
      useRouter: true,
      useTheme: true,
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('рендерит placeholder и ESC-хинт', () => {
    render(<CommandPalette open onClose={() => {}} />, {
      useRouter: true,
      useTheme: true,
    });
    expect(
      screen.getByPlaceholderText('Поиск, навигация или вопрос ИИ…'),
    ).toBeInTheDocument();
    expect(screen.getByText('ESC')).toBeInTheDocument();
  });

  it('показывает быстрые действия при пустом query', () => {
    render(<CommandPalette open onClose={() => {}} />, {
      useRouter: true,
      useTheme: true,
    });
    expect(screen.getByText('Быстрые действия')).toBeInTheDocument();
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Открыть SQL Lab')).toBeInTheDocument();
    expect(screen.getByText('Создать дашборд')).toBeInTheDocument();
  });

  it('когда onAskAi передан — показывает пункт ИИ первым', () => {
    const askAi = jest.fn();
    render(
      <CommandPalette open onClose={() => {}} onAskAi={askAi} />,
      { useRouter: true, useTheme: true },
    );
    expect(screen.getByText('Спросить ИИ-аналитика')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });

  it('Escape вызывает onClose', () => {
    const onClose = jest.fn();
    render(<CommandPalette open onClose={onClose} />, {
      useRouter: true,
      useTheme: true,
    });
    const input = screen.getByPlaceholderText(
      'Поиск, навигация или вопрос ИИ…',
    );
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('Tab вызывает onAskAi с текущим query', () => {
    const askAi = jest.fn();
    render(
      <CommandPalette open onClose={() => {}} onAskAi={askAi} />,
      { useRouter: true, useTheme: true },
    );
    const input = screen.getByPlaceholderText(
      'Поиск, навигация или вопрос ИИ…',
    );
    fireEvent.change(input, { target: { value: 'какая маржа по мясу' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(askAi).toHaveBeenCalledWith('какая маржа по мясу');
  });

  it('клик на backdrop закрывает палитру', () => {
    const onClose = jest.fn();
    render(<CommandPalette open onClose={onClose} />, {
      useRouter: true,
      useTheme: true,
    });
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });
});
