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
import { CentralPill } from './CentralPill';
import {
  DEFAULT_AI_CONTEXT,
  DEFAULT_AI_MODEL,
  type AiContext,
} from './CentralPillTypes';

const extraCtx: AiContext = {
  id: 'dashboard_loss_q1',
  label: 'Потери Q1',
  colorVar: 'var(--c-sky)',
  hint: 'Дашборд потерь за Q1',
};

const baseProps = {
  contexts: [DEFAULT_AI_CONTEXT, extraCtx] as readonly AiContext[],
  contextId: DEFAULT_AI_CONTEXT.id,
  onContextChange: jest.fn(),
  modelId: DEFAULT_AI_MODEL,
  onModelChange: jest.fn(),
  onSubmit: jest.fn(),
};

describe('<CentralPill>', () => {
  beforeEach(() => {
    baseProps.onContextChange.mockReset();
    baseProps.onModelChange.mockReset();
    baseProps.onSubmit.mockReset();
  });

  it('рендерит input и context chip с дефолтным label "Общий"', () => {
    render(<CentralPill {...baseProps} />);
    expect(screen.getByLabelText('Запрос ИИ или поиск')).toBeInTheDocument();
    expect(screen.getByText('Общий')).toBeInTheDocument();
  });

  it('Enter с непустым текстом вызывает onSubmit(trimmed, meta)', () => {
    render(<CentralPill {...baseProps} />);
    const input = screen.getByLabelText('Запрос ИИ или поиск') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Какая маржа?  ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
    expect(baseProps.onSubmit).toHaveBeenCalledWith('Какая маржа?', {
      contextId: DEFAULT_AI_CONTEXT.id,
      modelId: DEFAULT_AI_MODEL,
    });
  });

  it('Enter с пустым/пробельным текстом не вызывает onSubmit', () => {
    render(<CentralPill {...baseProps} />);
    const input = screen.getByLabelText('Запрос ИИ или поиск') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('после submit input очищается', () => {
    render(<CentralPill {...baseProps} />);
    const input = screen.getByLabelText('Запрос ИИ или поиск') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Привет' } });
    expect(input.value).toBe('Привет');
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(input.value).toBe('');
  });

  it('Escape очищает input и снимает focus', () => {
    render(<CentralPill {...baseProps} />);
    const input = screen.getByLabelText('Запрос ИИ или поиск') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'черновик' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
    expect(document.activeElement).not.toBe(input);
  });

  it('клик по context chip открывает popover со списком контекстов', () => {
    render(<CentralPill {...baseProps} />);
    // chip = button с текстом "Общий"
    fireEvent.click(screen.getByText('Общий'));
    // popover рендерит оба контекста (DEFAULT + extraCtx)
    expect(screen.getByText('Потери Q1')).toBeInTheDocument();
    expect(screen.getByText('Дашборд потерь за Q1')).toBeInTheDocument();
  });

  it('выбор другого контекста вызывает onContextChange', () => {
    render(<CentralPill {...baseProps} />);
    fireEvent.click(screen.getByText('Общий'));
    fireEvent.click(screen.getByText('Потери Q1'));
    expect(baseProps.onContextChange).toHaveBeenCalledWith(extraCtx);
  });

  it('при фокусе в input расширяется и показывает row с model picker', () => {
    render(<CentralPill {...baseProps} />);
    const input = screen.getByLabelText('Запрос ИИ или поиск');
    fireEvent.focus(input);
    // Row 2 содержит label текущей модели "Haiku 4.5"
    expect(screen.getByText('Haiku 4.5')).toBeInTheDocument();
  });

  it('submit button отображается только когда есть текст', () => {
    render(<CentralPill {...baseProps} />);
    const input = screen.getByLabelText('Запрос ИИ или поиск');
    const submitBtn = screen.getByLabelText('Отправить запрос');
    // Без текста — кнопка не видна (display:none)
    expect(submitBtn).not.toBeVisible();
    fireEvent.change(input, { target: { value: 'Запрос' } });
    // С текстом — видна
    expect(submitBtn).toBeVisible();
  });
});
