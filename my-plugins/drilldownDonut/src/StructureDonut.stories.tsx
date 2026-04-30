import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import StructureDonut from './StructureDonut';
import { LIGHT_TOKENS, DARK_TOKENS } from './themeTokens';
import { getStructurePreset } from './mocks/presets';
import type { StructureDonutProps } from './types';

const meta: Meta<typeof StructureDonut> = {
  title: 'Plugins/StructureDonut',
  component: StructureDonut,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    width: { control: { type: 'number' } },
    height: { control: { type: 'number' } },
    padAngle: { control: { type: 'range', min: 0, max: 4, step: 0.5 } },
    borderRadius: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    showOuterLabelsPct: { control: 'boolean' },
    isDarkMode: { control: 'boolean' },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <>
        {/* DS 2.0 шрифты для standalone Storybook. В Superset-хосте
            Manrope + JetBrains Mono приходят из head_custom_extra.html. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <Story />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StructureDonut>;

function buildArgs(isDark: boolean): StructureDonutProps {
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  const { categories, totalRevenue } = getStructurePreset('losses', undefined, tokens);
  return {
    width: 720,
    height: 520,
    headerText: 'Структура потерь',
    subtitleText: 'за год',
    dataState: 'populated',
    categories,
    hasSubcategories: true,
    totalRevenue,
    padAngle: 1.5,
    borderRadius: 2,
    showOuterLabelsPct: true,
    isDarkMode: isDark,
    theme: {},
    mockModeEnabled: true,
  };
}

export const Dark: Story = {
  args: buildArgs(true),
  decorators: [
    (Story) => (
      <div style={{ background: DARK_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  args: buildArgs(false),
  decorators: [
    (Story) => (
      <div style={{ background: LIGHT_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    ...buildArgs(false),
    dataState: 'empty',
    categories: [],
    hasSubcategories: false,
    totalRevenue: null,
  },
  decorators: [
    (Story) => (
      <div style={{ background: LIGHT_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    ...buildArgs(false),
    dataState: 'loading',
    categories: [],
  },
  decorators: [
    (Story) => (
      <div style={{ background: LIGHT_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export const ErrorState: Story = {
  args: {
    ...buildArgs(false),
    dataState: 'error',
    errorMessage: 'Превышен лимит ожидания запроса',
    categories: [],
  },
  decorators: [
    (Story) => (
      <div style={{ background: LIGHT_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export const Partial: Story = {
  args: {
    ...buildArgs(false),
    dataState: 'partial',
  },
  decorators: [
    (Story) => (
      <div style={{ background: LIGHT_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export const NoSubcategories: Story = {
  args: {
    ...buildArgs(false),
    hasSubcategories: false,
    categories: buildArgs(false).categories.map((c) => ({ ...c, children: [] })),
  },
  decorators: [
    (Story) => (
      <div style={{ background: LIGHT_TOKENS.bg, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};
