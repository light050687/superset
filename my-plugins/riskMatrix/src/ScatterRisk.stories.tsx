import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ScatterRisk from './ScatterRisk';
import {
  ScatterRiskProps,
  QuadrantKey,
  QuadrantDef,
  DetailQueryParams,
  FormatMeta,
} from './types';
import { getMockPreset } from './mocks/presets';
import { LIGHT_TOKENS, DARK_TOKENS, DEFAULT_FORMAT_PALETTE } from './themeTokens';

/* =========================================================
 * Helpers для конфигурации story
 * ========================================================= */

const makeFormatMeta = (
  stores: ReturnType<typeof getMockPreset>['stores'],
  tokens: typeof LIGHT_TOKENS,
): FormatMeta[] => {
  const map = new Map<string, FormatMeta>();
  stores.forEach((s) => {
    if (map.has(s.format)) return;
    const paletteKey = DEFAULT_FORMAT_PALETTE[map.size % DEFAULT_FORMAT_PALETTE.length];
    const color = tokens[paletteKey];
    map.set(s.format, {
      id: s.format,
      name: s.formatName,
      color,
      count: 0,
      planX: s.planX,
      planY: s.planY,
    });
  });
  stores.forEach((s) => {
    const m = map.get(s.format);
    if (m) m.count += 1;
  });
  return Array.from(map.values());
};

const makeQuadrants = (tokens: typeof LIGHT_TOKENS): Record<QuadrantKey, QuadrantDef> => ({
  tl: { key: 'tl', label: 'НЕДОСТАЧИ', semantic: 'y', color: tokens.cSky, description: 'Только недостачи' },
  tr: { key: 'tr', label: 'КРИТИЧЕСКИ ⚠', semantic: 'dn', color: tokens.dn, description: 'Обе проблемы' },
  bl: { key: 'bl', label: 'НОРМА ✓', semantic: 'up', color: tokens.up, description: 'В норме' },
  br: { key: 'br', label: 'СПИСАНИЯ', semantic: 'x', color: tokens.cTangerine, description: 'Только списания' },
});

const EMPTY_DETAIL: DetailQueryParams = {
  trendWeeks: 12,
  causesTopN: 3,
  skusTopN: 5,
  baseFilters: [],
};

const fmtPct = (decimals: number) => (n: number) =>
  Number.isFinite(n) ? `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)}\u00A0%` : '—';
const fmtMln = (n: number) =>
  Number.isFinite(n) ? `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)}\u00A0млн ₽` : '—';
const fmtCount = (n: number) =>
  Number.isFinite(n) ? new Intl.NumberFormat('ru-RU').format(n) : '—';

const makeProps = (isDarkMode: boolean, overrides: Partial<ScatterRiskProps> = {}): ScatterRiskProps => {
  const tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
  const preset = getMockPreset('retail');
  const formats = makeFormatMeta(preset.stores, tokens);
  const quadrants = makeQuadrants(tokens);

  return {
    width: 1200,
    height: 720,
    stores: preset.stores,
    formats,
    thresholdX: 1.5,
    thresholdY: 0.5,
    hasThresholds: true,
    quadrants,
    enableQuadrantAnnotations: true,
    enableWorstStar: true,
    title: 'Матрица рисков магазинов',
    subtitle: 'Списания × Недостачи',
    xLabel: 'Уровень списаний',
    yLabel: 'Уровень недостач',
    xUnit: '%',
    yUnit: '%',
    sizeUnit: 'млн ₽',
    formatX: fmtPct(2),
    formatY: fmtPct(2),
    formatSize: fmtMln,
    formatLoss: fmtMln,
    formatCount: fmtCount,
    xShort: 'Списания',
    yShort: 'Недостачи',
    isDarkMode,
    storeColumn: 'store_id',
    drillEnabled: true,
    detailQueryParams: EMPTY_DETAIL,
    shortcutsHint: 'Click — фильтр · Ctrl+Click — детализация · Drag — перемещение · Scroll — масштаб',
    ...overrides,
  };
};

/* =========================================================
 * Stories
 * ========================================================= */

const meta: Meta<typeof ScatterRisk> = {
  title: 'ScatterRisk / Матрица рисков',
  component: ScatterRisk,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ScatterRisk>;

export const Dark: Story = {
  render: () => (
    <div style={{ padding: 24, background: DARK_TOKENS.bg, minHeight: '100vh' }}>
      <ScatterRisk {...makeProps(true)} />
    </div>
  ),
};

export const Light: Story = {
  render: () => (
    <div style={{ padding: 24, background: LIGHT_TOKENS.bg, minHeight: '100vh' }}>
      <ScatterRisk {...makeProps(false)} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ padding: 24, background: DARK_TOKENS.bg, minHeight: '100vh' }}>
      <ScatterRisk
        {...makeProps(true, {
          stores: [],
          formats: [],
          hasThresholds: false,
        })}
      />
    </div>
  ),
};

export const WithoutThresholds: Story = {
  render: () => (
    <div style={{ padding: 24, background: DARK_TOKENS.bg, minHeight: '100vh' }}>
      <ScatterRisk
        {...makeProps(true, {
          hasThresholds: false,
          enableQuadrantAnnotations: false,
        })}
      />
    </div>
  ),
};

export const SmallViewport: Story = {
  render: () => (
    <div
      style={{
        padding: 12,
        background: DARK_TOKENS.bg,
        minHeight: '100vh',
        maxWidth: 640,
      }}
    >
      <ScatterRisk {...makeProps(true, { width: 600, height: 420 })} />
    </div>
  ),
};
