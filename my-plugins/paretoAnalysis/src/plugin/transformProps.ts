import { ChartProps, getMetricLabel } from '@superset-ui/core';
import {
  DataState,
  ParetoCardFormData,
  ParetoCardProps,
  ParetoItem,
  SupersetThemeExtended,
} from '../types';
import { getParetoPreset } from '../mocks/presets';

/**
 * Детектор dark mode через W3C luminance от `theme.colorBgContainer`
 * (копия логики из kpiCard). Работает для любой AntD v5 темы Superset.
 */
function detectDarkMode(theme: unknown): boolean {
  const bg = (theme as SupersetThemeExtended | undefined)?.colorBgContainer;
  if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
  const hex = bg.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function toFiniteNumber(
  value: unknown,
  fallback: number | null = null,
): number | null {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function transformProps(chartProps: ChartProps): ParetoCardProps {
  const { width, height, formData: fd, queriesData, theme } = chartProps;
  const formData = fd as ParetoCardFormData;

  // Нормализуем dimension: sharedControls.groupby хранит массив даже при multi:false.
  const dimension: string | undefined = Array.isArray(formData.dimension)
    ? (formData.dimension[0] as string | undefined)
    : (formData.dimension as string | undefined);

  const isDarkMode = detectDarkMode(theme);

  // ── Mock mode — early return ──
  if (formData.mockModeEnabled) {
    const preset = getParetoPreset(
      formData.mockPreset,
      formData.mockCustomJson,
    );
    return {
      width,
      height,
      items: preset.items,
      headerText: formData.headerText || preset.headerText,
      metricLabel: formData.metricLabel || preset.metricLabel,
      metricUnit: formData.metricUnit || preset.metricUnit,
      metricGenitive: formData.metricGenitive || preset.metricGenitive,
      breakdownTitle: formData.breakdownTitle || preset.breakdownTitle,
      defaultThreshold: Number(formData.defaultThreshold) || 80,
      chartAriaLabel: formData.chartAriaLabel || 'Парето-диаграмма',
      dataState: preset.items.length === 0 ? 'empty' : 'populated',
      isDarkMode,
      theme: theme as ParetoCardProps['theme'],
      mockModeEnabled: true,
    };
  }

  // ── Real data ──
  const rows = (queriesData?.[0]?.data ?? []) as Record<string, unknown>[];

  // Нет сконфигурированной метрики → пустое состояние.
  if (!formData.metricValue) {
    return {
      width,
      height,
      items: [],
      headerText: formData.headerText || 'Парето',
      metricLabel: formData.metricLabel || 'Значение',
      metricUnit: formData.metricUnit || '',
      metricGenitive: formData.metricGenitive || 'всего',
      breakdownTitle: formData.breakdownTitle || 'Разложение',
      defaultThreshold: Number(formData.defaultThreshold) || 80,
      chartAriaLabel: formData.chartAriaLabel || 'Парето-диаграмма',
      dataState: 'empty',
      isDarkMode,
      theme: theme as ParetoCardProps['theme'],
      mockModeEnabled: false,
    };
  }

  const metricValueLabel = getMetricLabel(formData.metricValue);
  const metricRevenueLabel = formData.metricRevenue
    ? getMetricLabel(formData.metricRevenue)
    : null;
  const metricPrevLabel = formData.metricPrev
    ? getMetricLabel(formData.metricPrev)
    : null;

  // TODO: при подключении реальных данных — если name категории отличается от id,
  // нужен второй столбец в GROUP BY или join. Сейчас id === name.
  const items: ParetoItem[] = rows.map((row, idx) => {
    const raw = dimension ? row[dimension] : undefined;
    const name = raw != null ? String(raw) : `#${idx + 1}`;
    return {
      id: name,
      name,
      value: toFiniteNumber(row[metricValueLabel], 0) ?? 0,
      revenueRub: metricRevenueLabel
        ? toFiniteNumber(row[metricRevenueLabel])
        : null,
      valuePrev: metricPrevLabel
        ? toFiniteNumber(row[metricPrevLabel])
        : null,
    };
  });

  const dataState: DataState = items.length === 0 ? 'empty' : 'populated';

  return {
    width,
    height,
    items,
    headerText: formData.headerText || formData.metricLabel || 'Парето',
    metricLabel: formData.metricLabel || metricValueLabel,
    metricUnit: formData.metricUnit || '',
    metricGenitive: formData.metricGenitive || 'всего',
    breakdownTitle: formData.breakdownTitle || 'Разложение',
    defaultThreshold: Number(formData.defaultThreshold) || 80,
    chartAriaLabel: formData.chartAriaLabel || 'Парето-диаграмма',
    dataState,
    isDarkMode,
    theme: theme as ParetoCardProps['theme'],
    mockModeEnabled: false,
  };
}
