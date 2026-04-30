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
 *
 * Storybook stories для AI-чата. Покрывают все формы bot-ответа,
 * чтобы регрессии форматирования ловились без живого ai-analytics.
 */
import { MemoryRouter } from 'react-router-dom';
import { AiMessage } from './AiMessage';

export default {
  title: 'Features/AI/AiMessage',
  component: AiMessage,
  decorators: [
    (Story: React.FC) => (
      <MemoryRouter>
        <div style={{ maxWidth: 720, padding: 24, background: '#fff' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

/* ─── User message (input bubble) ─── */

export const UserBubble = () => (
  <AiMessage role="user" text="Топ-10 категорий по потерям за январь 2026" />
);

/* ─── Thinking indicator (анимация «Анализирую...») ─── */

export const Thinking = () => <AiMessage role="thinking" />;

/* ─── Bot: простой markdown ─── */

const SAMPLE_MARKDOWN = `# Анализ потерь по категориям (Январь 2026)

## Ключевые выводы

1. **Абсолютный лидер потерь**: Категория **«СЫРЬЕ»** — потери составили
   **34 159 528,27 руб.** (63,5% от общего объёма).
2. **Второе место**: Категория **«ОВОЩИ СВЕЖИЕ»** — потери **21 354 158,25 руб.**
   (39,2% от общего объёма).
3. **Топ-3**: ЦИТРУСОВЫЕ — **13 106 821,86 руб.**, СЕМЕЧКОВЫЕ —
   **11 639 633,40 руб.**

## Рекомендации

- **Приоритет №1**: детальный аудит процессов хранения сырья.
- **Усилить контроль** сроков годности для свежих овощей.
- Для цитрусовых проверить сезонные нормы.
`;

export const BotMarkdown = () => (
  <AiMessage
    role="bot"
    blocks={{ text: SAMPLE_MARKDOWN }}
    meta={{ model: 'haiku-4.5' }}
  />
);

/* ─── Bot: KPI карточки ─── */

export const BotWithKpi = () => (
  <AiMessage
    role="bot"
    blocks={{
      text: SAMPLE_MARKDOWN,
      kpi: [
        { label: 'СЫРЬЕ', value: '34 159 528 руб.', deltaKind: 'dn' },
        { label: 'Доля', value: '63,5%', deltaLabel: '+5,2 пп', deltaKind: 'dn' },
        { label: 'Категорий в топе', value: '10' },
      ],
    }}
    meta={{ model: 'sonnet-4.6' }}
  />
);

/* ─── Bot: Таблица rawData ─── */

export const BotWithTable = () => (
  <AiMessage
    role="bot"
    blocks={{
      text: '## Таблица потерь',
      table: {
        rows: [
          { 'losses.category_name': 'СЫРЬЕ', 'losses.total': 34159528.27 },
          { 'losses.category_name': 'ОВОЩИ', 'losses.total': 21354158.25 },
          { 'losses.category_name': 'ЦИТРУСОВЫЕ', 'losses.total': 13106821.86 },
          { 'losses.category_name': 'СЕМЕЧКОВЫЕ', 'losses.total': 11639633.40 },
        ],
        title: 'Потери по категориям',
      },
    }}
  />
);

/* ─── Bot: Inline chart (cubeQuery) ─── */

export const BotWithChart = () => (
  <AiMessage
    role="bot"
    blocks={{
      text: '## Динамика потерь по месяцам',
      cubeQuery: {
        timeDimensions: [
          { dimension: 'losses.report_date', dateRange: ['2026-01-01', '2026-12-31'] },
        ],
        measures: ['losses.total'],
      },
      table: {
        rows: [
          { 'losses.report_date': '2026-01', 'losses.total': 34_000_000 },
          { 'losses.report_date': '2026-02', 'losses.total': 28_500_000 },
          { 'losses.report_date': '2026-03', 'losses.total': 31_200_000 },
          { 'losses.report_date': '2026-04', 'losses.total': 29_800_000 },
          { 'losses.report_date': '2026-05', 'losses.total': 33_100_000 },
          { 'losses.report_date': '2026-06', 'losses.total': 26_400_000 },
        ],
      },
    }}
  />
);

/* ─── Bot: Actionable Python-блок ─── */

const SAMPLE_WITH_ACTION = `## Готов создать дашборд

Для визуализации этих данных могу создать дашборд:

\`\`\`python
ss_create_dashboard(
    name="Топ потерь по категориям - Январь 2026",
    description="Распределение финансовых потерь",
    charts=[
        {
            "type": "bar",
            "title": "Топ-10 категорий",
            "data_source": "losses_analytics",
            "x_axis": "category_name",
            "y_axis": "total_losses"
        }
    ]
)
\`\`\`
`;

export const BotWithAction = () => (
  <AiMessage role="bot" blocks={{ text: SAMPLE_WITH_ACTION }} />
);

/* ─── Bot: Error state ─── */

export const BotError = () => (
  <AiMessage
    role="bot"
    blocks={{
      text: '⚠️ Не удалось получить ответ от ИИ: connection timeout (30s).',
    }}
  />
);
