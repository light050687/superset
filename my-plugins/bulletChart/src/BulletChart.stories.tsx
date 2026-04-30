import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BulletChart from './BulletChart';
import type { BulletChartProps, DataState, Direction } from './types';
import { getPreset } from './mocks/presets';
import { computeScaleMax } from './utils/aggregation';
import { makeFormatters } from './utils/format';

const meta: Meta<typeof BulletChart> = {
  title: 'BulletChart',
  component: BulletChart,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof BulletChart>;

function makeProps(
  overrides: Partial<BulletChartProps> = {},
  presetName: string = 'formats',
  direction: Direction = 'less_is_better',
): BulletChartProps {
  const preset = getPreset(presetName, undefined, direction, 5);
  const scaleMax = computeScaleMax(preset.rows);
  const formatters = makeFormatters({
    decimals: 2,
    suffix: '%',
    unitLabel: 'п.п.',
    autoRussian: true,
  });
  return {
    width: 1000,
    height: 560,
    dataState: preset.rows.length ? 'populated' : 'empty',
    headerText: preset.title || 'Bullet Chart',
    subheaderText: 'Факт vs план vs ПГ · Март 2026',
    rows: preset.rows,
    scaleMax,
    direction,
    defaultSort: 'factDesc',
    filterWorseThanPlanDefault: false,
    enableCrossFilter: true,
    enableDetailModal: true,
    formatters,
    valueSuffix: '%',
    valueUnitLabel: 'п.п.',
    isDarkMode: false,
    theme: {},
    detailQueryParams: undefined,
    mockModeEnabled: true,
    ...overrides,
  };
}

export const Populated: Story = { args: makeProps() };
export const DarkMode: Story = { args: makeProps({ isDarkMode: true }) };
export const Categories: Story = { args: makeProps({}, 'categories') };
export const ManyRows: Story = { args: makeProps({}, 'many_rows') };
export const LongNames: Story = { args: makeProps({}, 'long_names') };
export const Negative: Story = { args: makeProps({}, 'negative') };
export const SingleRow: Story = { args: makeProps({}, 'single_row') };
export const Empty: Story = {
  args: { ...makeProps({}, 'empty'), dataState: 'empty' as DataState },
};
export const Loading: Story = {
  args: { ...makeProps(), dataState: 'loading' as DataState },
};
export const Error: Story = {
  args: { ...makeProps(), dataState: 'error' as DataState },
};
export const FilterBadActive: Story = {
  args: makeProps({ filterWorseThanPlanDefault: true }),
};
export const SortByDeltaPlan: Story = {
  args: makeProps({ defaultSort: 'deltaPlanDesc' }),
};
export const MoreIsBetter: Story = {
  args: makeProps(
    {
      headerText: 'Выполнение плана продаж',
      subheaderText: 'Чем больше — тем лучше',
    },
    'categories',
    'more_is_better',
  ),
};
export const SmallWidth: Story = {
  args: makeProps({ width: 420, height: 560 }),
};
export const SmallHeight: Story = {
  args: makeProps({ width: 900, height: 320 }),
};
