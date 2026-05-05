import React from 'react';
import ParetoCard from './ParetoCard';
import { ParetoCardProps } from './types';
import { LOSSES_PRESET } from './mocks/presets';

/*
 * Storybook stories для Pareto Card.
 * Mock-данные взяты из прототипа ref/pareto-prototype.html.
 *
 * Запуск: npm run storybook (порт 6013 в package.json).
 */

const baseArgs: Omit<ParetoCardProps, 'theme'> = {
  width: 860,
  height: 540,
  items: LOSSES_PRESET.items,
  headerText: LOSSES_PRESET.headerText,
  metricLabel: LOSSES_PRESET.metricLabel,
  metricUnit: LOSSES_PRESET.metricUnit,
  metricGenitive: LOSSES_PRESET.metricGenitive,
  breakdownTitle: LOSSES_PRESET.breakdownTitle,
  defaultThreshold: 80,
  chartAriaLabel: 'Парето-диаграмма списаний по категориям',
  dataState: 'populated',
  isDarkMode: false,
  mockModeEnabled: true,
};

export default {
  title: 'Plugins/ParetoCard',
  component: ParetoCard,
  argTypes: {
    width: { control: { type: 'range', min: 480, max: 1280, step: 20 } },
    height: { control: { type: 'range', min: 380, max: 800, step: 20 } },
    isDarkMode: { control: 'boolean' },
    headerText: { control: 'text' },
    metricLabel: { control: 'text' },
    metricUnit: { control: 'text' },
    metricGenitive: { control: 'text' },
    breakdownTitle: { control: 'text' },
    defaultThreshold: {
      control: { type: 'range', min: 50, max: 95, step: 5 },
    },
    chartAriaLabel: { control: 'text' },
    dataState: {
      control: 'select',
      options: ['loading', 'error', 'empty', 'partial', 'stale', 'populated'],
    },
    mockModeEnabled: { control: 'boolean' },
    // hidden
    items: { control: false },
    theme: { control: false },
  },
  parameters: {
    backgrounds: {
      default: 'design-system',
      values: [
        // Источник правды — CSS-переменные DS v2.0 (--bg light/dark
        // переключается через :root в head_custom_extra.html / темизацию).
        { name: 'design-system', value: 'var(--bg)' },
      ],
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

const Template = (args: Omit<ParetoCardProps, 'theme'>) => (
  <div
    style={{
      padding: 32,
      // Фон уезжает в DS v2.0 через `--bg` (см. decorator выше);
      // wrapper нужен только для padding'a.
      minHeight: '100vh',
    }}
  >
    {/* theme передаётся Superset'ом — в Storybook передаём заглушку. */}
    <ParetoCard {...(args as ParetoCardProps)} theme={{} as never} />
  </div>
);

// ═══════════════════════════════════════
// Stories
// ═══════════════════════════════════════

export const LightPopulated = Template.bind({});
(LightPopulated as unknown as { args: unknown }).args = {
  ...baseArgs,
  isDarkMode: false,
};

export const DarkPopulated = Template.bind({});
(DarkPopulated as unknown as { args: unknown }).args = {
  ...baseArgs,
  isDarkMode: true,
};

export const Threshold50 = Template.bind({});
(Threshold50 as unknown as { args: unknown }).args = {
  ...baseArgs,
  defaultThreshold: 50,
};

export const Threshold95 = Template.bind({});
(Threshold95 as unknown as { args: unknown }).args = {
  ...baseArgs,
  defaultThreshold: 95,
};

export const Empty = Template.bind({});
(Empty as unknown as { args: unknown }).args = {
  ...baseArgs,
  items: [],
  dataState: 'empty',
};

export const Loading = Template.bind({});
(Loading as unknown as { args: unknown }).args = {
  ...baseArgs,
  dataState: 'loading',
};

export const Error = Template.bind({});
(Error as unknown as { args: unknown }).args = {
  ...baseArgs,
  dataState: 'error',
};

export const OnlyPositive = Template.bind({});
(OnlyPositive as unknown as { args: unknown }).args = {
  ...baseArgs,
  // Убираем valuePrev — проверяем, что hasPrevData=false и chip «Пред.период» скрыт
  items: LOSSES_PRESET.items.map(i => ({ ...i, valuePrev: null, revenueRub: null })),
};
