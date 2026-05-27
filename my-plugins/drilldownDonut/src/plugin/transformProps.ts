import { ChartProps, getMetricLabel } from '@superset-ui/core';
import {
  CategoryColorOverride,
  CategoryNode,
  DataState,
  QueryResultItem,
  StructureDonutFormData,
  StructureDonutProps,
  SupersetFormDataExtended,
  SupersetThemeExtended,
} from '../types';
import { LIGHT_TOKENS, DARK_TOKENS, Tokens } from '../themeTokens';
import { isDarkTheme } from '../utils/isDarkTheme';
import { resolveCategoryColor } from '../utils/resolveColor';
import { groupRows } from '../utils/groupRows';
import { applyChildShades } from '../utils/buildOption';
import { getStructurePreset } from '../mocks/presets';

/**
 * Преобразует ChartProps от Superset в props компонента StructureDonut.
 *
 * Шаги:
 *   1. Нормализация groupby-массивов.
 *   2. Определение dark/light темы → выбор набора токенов.
 *   3. Mock-путь: вернуть preset'овские данные.
 *   4. Empty-путь: нет метрики/колонки/данных.
 *   5. Real-data путь: group rows, resolve colors, compute totalRevenue, DataState.
 */
export default function transformProps(chartProps: ChartProps): StructureDonutProps {
  const { width, height, formData, queriesData, theme } = chartProps as ChartProps & {
    formData: StructureDonutFormData;
    queriesData: QueryResultItem[];
  };

  const fd = formData as unknown as SupersetFormDataExtended & StructureDonutFormData;

  // 1. Нормализация групбая
  for (const k of [
    'groupby_category',
    'groupby_subcategory',
    'groupbyCategory',
    'groupbySubcategory',
  ]) {
    const v = (fd as Record<string, unknown>)[k];
    if (Array.isArray(v)) {
      (fd as Record<string, unknown>)[k] = v[0] ?? undefined;
    }
  }

  const catCol = (fd.groupbyCategory ?? (fd as Record<string, unknown>).groupby_category) as
    | string
    | undefined;
  const subCol = (fd.groupbySubcategory ??
    (fd as Record<string, unknown>).groupby_subcategory) as string | undefined;

  // 2. Dark/light mode
  const colorBgContainer = (theme as unknown as SupersetThemeExtended)?.colorBgContainer;
  const isDarkMode = isDarkTheme(colorBgContainer);
  const tokens: Tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;

  // Header + subtitle (UI строки на русском — по умолчанию из прототипа)
  const headerText = fd.headerText?.trim() || 'Структура потерь';
  const subtitleText = fd.subtitleText?.trim() || '';

  // Style props
  const padAngle = typeof fd.padAngle === 'number' ? fd.padAngle : 1.5;
  const borderRadius = typeof fd.borderRadius === 'number' ? fd.borderRadius : 2;
  const showOuterLabelsPct = fd.showOuterLabelsPct !== false; // default true
  // rub_decimals — сколько знаков после запятой в hero-числе (controlPanel slider 0-3)
  const fdRubDecimals = (fd as Record<string, unknown>).rubDecimals
    ?? (fd as Record<string, unknown>).rub_decimals;
  const rubDecimals =
    typeof fdRubDecimals === 'number' && fdRubDecimals >= 0 && fdRubDecimals <= 3
      ? fdRubDecimals
      : 2;

  const mockModeEnabled =
    (fd.mock_mode_enabled as boolean | undefined) ?? fd.mockModeEnabled ?? false;

  // Color overrides из controlPanel (CategoryColorMapControl)
  const colorMap: CategoryColorOverride[] = Array.isArray(fd.colorMap)
    ? fd.colorMap.filter(
        (o): o is CategoryColorOverride =>
          !!o &&
          typeof o === 'object' &&
          typeof (o as CategoryColorOverride).name === 'string' &&
          typeof (o as CategoryColorOverride).accent === 'string',
      )
    : [];

  // 3. Mock-путь
  if (mockModeEnabled) {
    const { categories, totalRevenue } = getStructurePreset(
      fd.mockPreset as string | undefined,
      fd.mockCustomJson as string | undefined,
      tokens,
    );

    return {
      width,
      height,
      headerText,
      subtitleText,
      dataState: categories.length === 0 ? 'empty' : 'populated',
      categories,
      hasSubcategories: categories.some((c) => c.children.length > 0),
      totalRevenue,
      padAngle,
      borderRadius,
      showOuterLabelsPct,
      rubDecimals,
      isDarkMode,
      theme,
      mockModeEnabled: true,
    };
  }

  // 4. Валидация
  const q0 = queriesData?.[0];
  const q0Data = (q0?.data ?? []) as Record<string, unknown>[];
  const q0Error = q0?.error;
  const isStale = q0?.is_cached === true;

  const hasValueMetric = !!formData.valueMetric;

  if (q0Error) {
    return {
      width,
      height,
      headerText,
      subtitleText,
      dataState: 'error',
      errorMessage: typeof q0Error === 'string' ? q0Error : 'Ошибка загрузки данных',
      categories: [],
      hasSubcategories: false,
      totalRevenue: null,
      padAngle,
      borderRadius,
      showOuterLabelsPct,
      rubDecimals,
      isDarkMode,
      theme,
      mockModeEnabled: false,
    };
  }

  if (!catCol || !hasValueMetric || q0Data.length === 0) {
    return {
      width,
      height,
      headerText,
      subtitleText,
      dataState: 'empty',
      categories: [],
      hasSubcategories: false,
      totalRevenue: null,
      padAngle,
      borderRadius,
      showOuterLabelsPct,
      rubDecimals,
      isDarkMode,
      theme,
      mockModeEnabled: false,
    };
  }

  // 5. Реальные данные
  const valueLabel = getMetricLabel(formData.valueMetric);
  const countLabel = formData.countMetric ? getMetricLabel(formData.countMetric) : undefined;
  const revenueLabel = formData.revenueMetric ? getMetricLabel(formData.revenueMetric) : undefined;

  const { categories } = groupRows(q0Data, catCol, subCol, valueLabel, countLabel);

  // Резолв цветов + шейды детей
  categories.forEach((cat: CategoryNode, idx: number) => {
    const { accent, color } = resolveCategoryColor(cat.name, colorMap, tokens, idx);
    cat.accent = accent;
    cat.color = color;
    applyChildShades(cat);
  });

  // Суммарная выручка
  let totalRevenue: number | null = null;
  if (revenueLabel) {
    totalRevenue = q0Data.reduce((acc, row) => {
      const v = row[revenueLabel];
      const n = typeof v === 'number' ? v : Number(v);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    if (totalRevenue === 0) totalRevenue = null;
  }

  // DataState
  let dataState: DataState = 'populated';
  if (categories.length === 0) {
    dataState = 'empty';
  } else if (q0Data.length >= 500) {
    dataState = 'partial';
  } else if (isStale) {
    dataState = 'stale';
  }

  return {
    width,
    height,
    headerText,
    subtitleText,
    dataState,
    categories,
    hasSubcategories: !!subCol && categories.some((c) => c.children.length > 0),
    totalRevenue,
    rubDecimals,
    padAngle,
    borderRadius,
    showOuterLabelsPct,
    isDarkMode,
    theme,
    mockModeEnabled: false,
  };
}
