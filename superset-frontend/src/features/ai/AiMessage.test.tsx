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
import { AiMessage } from './AiMessage';
import type { AiAnswerBlocks } from './types';

describe('<AiMessage>', () => {
  it('user — рендерит пузырь с текстом', () => {
    render(<AiMessage role="user" text="Какая маржа?" />, {
      useRouter: true,
      useTheme: true,
    });
    expect(screen.getByText('Какая маржа?')).toBeInTheDocument();
  });

  it('thinking — показывает индикатор «Анализирую ваши данные»', () => {
    render(<AiMessage role="thinking" />, {
      useRouter: true,
      useTheme: true,
    });
    expect(screen.getByText('Анализирую ваши данные')).toBeInTheDocument();
  });

  it('bot — рендерит все блоки: title, text, kpi, insight, actions, followups', () => {
    const blocks: AiAnswerBlocks = {
      title: 'Маржа по мясу',
      text: 'Факт 24,7%, план 26,0%.',
      kpi: [
        { label: 'Факт', value: '24,7%' },
        {
          label: 'Отклонение',
          value: '−1,3 п.п.',
          deltaLabel: '↓ ниже плана',
          deltaKind: 'dn',
        },
      ],
      insight: { prefix: 'Инсайт', text: 'Говядина бьёт категорию' },
      actions: [
        {
          kind: 'open_dashboard',
          label: 'Открыть KPI',
          url: '/dashboard/list/',
        },
        { kind: 'download', label: 'Экспорт' },
      ],
      source: {
        chips: ['Sales', 'StarRocks'],
        updatedHuman: '2 ч назад',
      },
      followups: [
        { text: 'Какая маржа в феврале?' },
        { text: 'Сравни форматы' },
      ],
    };
    render(<AiMessage role="bot" blocks={blocks} />, {
      useRouter: true,
      useTheme: true,
    });
    expect(screen.getByText('Маржа по мясу')).toBeInTheDocument();
    expect(screen.getByText('Факт 24,7%, план 26,0%.')).toBeInTheDocument();
    expect(screen.getByText('Факт')).toBeInTheDocument();
    expect(screen.getByText('24,7%')).toBeInTheDocument();
    expect(screen.getByText('↓ ниже плана')).toBeInTheDocument();
    expect(screen.getByText(/Говядина бьёт категорию/)).toBeInTheDocument();
    expect(screen.getByText('Открыть KPI')).toBeInTheDocument();
    expect(screen.getByText('Экспорт')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('StarRocks')).toBeInTheDocument();
    expect(screen.getByText('Какая маржа в феврале?')).toBeInTheDocument();
    expect(screen.getByText('Сравни форматы')).toBeInTheDocument();
  });

  it('followup клик вызывает onFollowup', () => {
    const onFollowup = jest.fn();
    render(
      <AiMessage
        role="bot"
        blocks={{ followups: [{ text: 'Повтори в феврале' }] }}
        onFollowup={onFollowup}
      />,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByText('Повтори в феврале'));
    expect(onFollowup).toHaveBeenCalledWith('Повтори в феврале');
  });

  it('action клик вызывает onAction с label и url', () => {
    const onAction = jest.fn();
    render(
      <AiMessage
        role="bot"
        blocks={{
          actions: [
            { kind: 'open_dashboard', label: 'Открыть', url: '/dashboard/1/' },
          ],
        }}
        onAction={onAction}
      />,
      { useRouter: true, useTheme: true },
    );
    fireEvent.click(screen.getByText('Открыть'));
    expect(onAction).toHaveBeenCalledWith('Открыть', '/dashboard/1/');
  });
});
