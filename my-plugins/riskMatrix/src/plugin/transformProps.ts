import {
  ChartProps,
  CategoricalColorNamespace,
  getMetricLabel,
  QueryFormMetric,
  AdhocFilter,
} from '@superset-ui/core';
import {
  ScatterRiskFormData,
  ScatterRiskProps,
  StorePoint,
  FormatMeta,
  QuadrantDef,
  QuadrantKey,
  SemanticColor,
  SupersetThemeExtended,
  DetailQueryParams,
  SimpleAdhocFilter,
  FormatValueFn,
} from '../types';
import { formatRussianSmartEx } from '../utils/formatRussian';
import {
  LIGHT_TOKENS,
  DARK_TOKENS,
  DEFAULT_FORMAT_PALETTE,
} from '../themeTokens';
import { computeWeightedAverage, computeAverage } from '../utils/quadrants';
import { getMockPreset } from '../mocks/presets';

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function toNumber(v: unknown): number {
  if (v == null) return NaN;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function getColumnValue(row: Record<string, unknown>, col?: string): string | undefined {
  if (!col) return undefined;
  const v = row[col];
  return v == null ? undefined : String(v);
}

/** Конвертация AdhocFilter[] → simple filters + freeform WHERE */
function splitAdhocFilters(filters: AdhocFilter[] = []): {
  simple: SimpleAdhocFilter[];
  where: string;
  having: string;
} {
  const simple: SimpleAdhocFilter[] = [];
  const whereParts: string[] = [];
  const havingParts: string[] = [];

  filters.forEach((f) => {
    if (!f) return;
    const expr = f as unknown as {
      expressionType?: string;
      clause?: string;
      subject?: string;
      operator?: string;
      comparator?: unknown;
      sqlExpression?: string;
    };
    if (expr.expressionType === 'SIMPLE' && expr.subject && expr.operator) {
      simple.push({
        col: expr.subject,
        op: expr.operator,
        val: (expr.comparator as string | number | string[] | number[]) ?? '',
      });
    } else if (expr.expressionType === 'SQL' && expr.sqlExpression) {
      if (expr.clause === 'HAVING') {
        havingParts.push(expr.sqlExpression);
      } else {
        whereParts.push(expr.sqlExpression);
      }
    }
  });

  return {
    simple,
    where: whereParts.join(' AND '),
    having: havingParts.join(' AND '),
  };
}

function resolveSemanticColor(
  semantic: SemanticColor,
  tokens: typeof LIGHT_TOKENS,
  xColor: string,
  yColor: string,
): string {
  switch (semantic) {
    case 'up':
      return tokens.up;
    case 'dn':
      return tokens.dn;
    case 'wn':
      return tokens.wn;
    case 'x':
      return xColor;
    case 'y':
      return yColor;
    default:
      return tokens.g500;
  }
}

function makeValueFormatter(decimals: number, unit: string): FormatValueFn {
  const suffix = unit || '';
  return (n: number) => {
    if (!Number.isFinite(n)) return '—';
    // Если явно проценты — используем fixed decimals без abbreviation
    if (suffix === '%' || suffix === ' %') {
      const abs = Math.abs(n);
      const sign = n < 0 ? '−' : '';
      return `${sign}${new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(abs)}\u00A0${suffix.trim()}`;
    }
    return formatRussianSmartEx(n, decimals, suffix);
  };
}

// ═══════════════════════════════════════
// Main
// ═══════════════════════════════════════

export default function transformProps(chartProps: ChartProps): ScatterRiskProps {
  const { width, height, formData: fd, queriesData, theme } = chartProps;
  const formData = fd as ScatterRiskFormData & Record<string, unknown>;

  // Поля с normalisation array → scalar
  const groupbyStore = (Array.isArray(formData.groupbyStore)
    ? formData.groupbyStore[0]
    : formData.groupbyStore) as string | undefined;
  const groupbyFormat = (Array.isArray(formData.groupbyFormat)
    ? formData.groupbyFormat[0]
    : formData.groupbyFormat) as string | undefined;
  const groupbyCity = (Array.isArray(formData.groupbyCity)
    ? formData.groupbyCity[0]
    : formData.groupbyCity) as string | undefined;

  // Metric labels
  const metricX = formData.metricX as QueryFormMetric | undefined;
  const metricY = formData.metricY as QueryFormMetric | undefined;
  const metricSize = formData.metricSize as QueryFormMetric | undefined;
  const metricPlanX = formData.metricPlanX as QueryFormMetric | undefined;
  const metricPlanY = formData.metricPlanY as QueryFormMetric | undefined;
  const metricSumLoss = formData.metricSumLoss as QueryFormMetric | undefined;

  const labelX = metricX ? getMetricLabel(metricX) : '';
  const labelY = metricY ? getMetricLabel(metricY) : '';
  const labelSize = metricSize ? getMetricLabel(metricSize) : '';
  const labelPlanX = metricPlanX ? getMetricLabel(metricPlanX) : '';
  const labelPlanY = metricPlanY ? getMetricLabel(metricPlanY) : '';
  const labelSumLoss = metricSumLoss ? getMetricLabel(metricSumLoss) : '';

  // ── Theme detection ──
  const isDarkMode = (() => {
    const bg = (theme as unknown as SupersetThemeExtended)?.colorBgContainer ?? '';
    if (typeof bg === 'string') {
      // Грубая эвристика: если фон тёмный (<50% brightness) — dark mode
      const cleaned = bg.replace('#', '');
      if (cleaned.length === 6) {
        const r = parseInt(cleaned.slice(0, 2), 16);
        const g = parseInt(cleaned.slice(2, 4), 16);
        const b = parseInt(cleaned.slice(4, 6), 16);
        return (r + g + b) / 3 < 128;
      }
    }
    return false;
  })();

  const tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;

  // ── Raw data ──
  const rawData = (queriesData?.[0]?.data as Record<string, unknown>[] | undefined) ?? [];

  // Mock mode fallback
  const mockEnabled = Boolean(formData.mockModeEnabled);
  const usingMock = mockEnabled && (rawData.length === 0 || !groupbyStore);
  const mock = usingMock ? getMockPreset(String(formData.mockPreset ?? 'retail')) : null;

  // ── Build StorePoint[] ──
  const stores: StorePoint[] = [];
  if (mock) {
    stores.push(...mock.stores);
  } else {
    rawData.forEach((row, idx) => {
      const id = getColumnValue(row, groupbyStore) ?? `row-${idx}`;
      const format = getColumnValue(row, groupbyFormat) ?? 'default';
      const city = getColumnValue(row, groupbyCity);
      const x = toNumber(row[labelX]);
      const y = toNumber(row[labelY]);
      const size = metricSize ? toNumber(row[labelSize]) : 1;
      const planX = metricPlanX ? toNumber(row[labelPlanX]) : undefined;
      const planY = metricPlanY ? toNumber(row[labelPlanY]) : undefined;
      const sumLoss = metricSumLoss ? toNumber(row[labelSumLoss]) : undefined;

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      stores.push({
        id,
        name: id,
        city,
        format,
        formatName: format,
        x,
        y,
        size: Number.isFinite(size) && size > 0 ? size : 1,
        planX: Number.isFinite(planX as number) ? (planX as number) : undefined,
        planY: Number.isFinite(planY as number) ? (planY as number) : undefined,
        sumLoss: Number.isFinite(sumLoss as number) ? (sumLoss as number) : undefined,
      });
    });
  }

  // ── Aggregate formats ──
  const colorScheme = formData.colorScheme as string | undefined;
  // CategoricalColorNamespace.getScale() возвращает CategoricalColorScale instance.
  // Берём цвет через .getColor(key); если scheme не задана — используем fallback из DS 2.0.
  const colorScale = CategoricalColorNamespace.getScale(colorScheme);

  const formatMap = new Map<string, FormatMeta>();
  stores.forEach((s) => {
    let meta = formatMap.get(s.format);
    if (!meta) {
      const paletteIndex = formatMap.size % DEFAULT_FORMAT_PALETTE.length;
      const tokenKey = DEFAULT_FORMAT_PALETTE[paletteIndex];
      const fallback = tokens[tokenKey];
      let color = fallback;
      try {
        const scheme = colorScale.getColor(s.format);
        if (typeof scheme === 'string' && scheme.length > 0) color = scheme;
      } catch {
        // Если color scale упал (нет scheme) — остаёмся на fallback
      }
      meta = {
        id: s.format,
        name: s.formatName || s.format,
        color,
        count: 0,
      };
      formatMap.set(s.format, meta);
    }
    meta.count += 1;
  });

  // Если у формата есть plan-значения — усредняем для отображения
  if (metricPlanX || metricPlanY) {
    formatMap.forEach((fmt) => {
      const sublist = stores.filter((s) => s.format === fmt.id);
      if (metricPlanX) {
        const planValues = sublist.map((s) => s.planX ?? NaN);
        const weights = sublist.map((s) => s.size);
        fmt.planX = computeWeightedAverage(planValues, weights);
      }
      if (metricPlanY) {
        const planValues = sublist.map((s) => s.planY ?? NaN);
        const weights = sublist.map((s) => s.size);
        fmt.planY = computeWeightedAverage(planValues, weights);
      }
    });
  }

  const formats: FormatMeta[] = Array.from(formatMap.values());

  // Применяем цвет формата обратно к StorePoint.formatName (человекочитаемое имя = formatName)
  stores.forEach((s) => {
    const meta = formatMap.get(s.format);
    if (meta) s.formatName = meta.name;
  });

  // ── Thresholds ──
  const thresholdMode = (formData.thresholdMode ?? 'metric') as ScatterRiskFormData['thresholdMode'];
  let thresholdX = 0;
  let thresholdY = 0;
  let hasThresholds = false;

  if (thresholdMode === 'static') {
    thresholdX = toNumber(formData.staticThresholdX) || 0;
    thresholdY = toNumber(formData.staticThresholdY) || 0;
    hasThresholds = true;
  } else if (thresholdMode === 'avg') {
    thresholdX = computeAverage(stores.map((s) => s.x));
    thresholdY = computeAverage(stores.map((s) => s.y));
    hasThresholds = stores.length > 0;
  } else {
    // 'metric' — средневзвешенное per-row plan
    if (metricPlanX) {
      thresholdX = computeWeightedAverage(
        stores.map((s) => s.planX ?? NaN),
        stores.map((s) => s.size),
      );
    }
    if (metricPlanY) {
      thresholdY = computeWeightedAverage(
        stores.map((s) => s.planY ?? NaN),
        stores.map((s) => s.size),
      );
    }
    hasThresholds = Boolean(metricPlanX || metricPlanY);
    // Если пороги не заданы — падаем в среднее фактических значений, чтобы квадранты имели смысл
    if (!metricPlanX) thresholdX = computeAverage(stores.map((s) => s.x));
    if (!metricPlanY) thresholdY = computeAverage(stores.map((s) => s.y));
  }

  // ── Quadrants ──
  const xColorToken = tokens.cTangerine; // X-ось (писания)
  const yColorToken = tokens.cSky; // Y-ось (недостачи)

  const mkQuadrant = (
    key: QuadrantKey,
    labelFieldName: keyof ScatterRiskFormData,
    semanticFieldName: keyof ScatterRiskFormData,
    defaultLabel: string,
    defaultSemantic: SemanticColor,
    description: string,
  ): QuadrantDef => {
    const label = (formData[labelFieldName] as string | undefined) || defaultLabel;
    const semantic = ((formData[semanticFieldName] as string | undefined) ||
      defaultSemantic) as SemanticColor;
    const color = resolveSemanticColor(semantic, tokens, xColorToken, yColorToken);
    return { key, label, semantic, color, description };
  };

  const quadrants: Record<QuadrantKey, QuadrantDef> = {
    tl: mkQuadrant(
      'tl',
      'quadTlLabel',
      'quadTlSemantic',
      'НЕДОСТАЧИ',
      'y',
      'Высокие Y, X в норме',
    ),
    tr: mkQuadrant(
      'tr',
      'quadTrLabel',
      'quadTrSemantic',
      'КРИТИЧЕСКИ ⚠',
      'dn',
      'Обе проблемы — требуют немедленных действий',
    ),
    bl: mkQuadrant(
      'bl',
      'quadBlLabel',
      'quadBlSemantic',
      'НОРМА ✓',
      'up',
      'Оба показателя в норме',
    ),
    br: mkQuadrant(
      'br',
      'quadBrLabel',
      'quadBrSemantic',
      'СПИСАНИЯ',
      'x',
      'Высокие X, Y в норме',
    ),
  };

  // ── Formatters ──
  const xDecimals = Number.isFinite(Number(formData.xDecimals))
    ? Number(formData.xDecimals)
    : 2;
  const yDecimals = Number.isFinite(Number(formData.yDecimals))
    ? Number(formData.yDecimals)
    : 2;

  const xUnit = (formData.xUnit as string | undefined) ?? '%';
  const yUnit = (formData.yUnit as string | undefined) ?? '%';
  const sizeUnit = (formData.sizeUnit as string | undefined) ?? 'млн ₽';

  const formatX = makeValueFormatter(xDecimals, xUnit);
  const formatY = makeValueFormatter(yDecimals, yUnit);
  // Size/Loss: значения обычно уже в "млн ₽" — просто форматируем с суффиксом,
  // НЕ используя abbreviation (иначе получим "1,2 млрд млн ₽").
  // Валюта идёт ПОСЛЕ числа согласно DS 2.0.
  const formatNumberRu = (n: number, decimals: number): string =>
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  const formatSize = (n: number) =>
    Number.isFinite(n) ? `${formatNumberRu(n, 1)}\u00A0${sizeUnit}` : '—';
  const formatLoss = (n: number) =>
    Number.isFinite(n) ? `${formatNumberRu(n, 2)}\u00A0${sizeUnit}` : '—';
  const formatCount = (n: number) =>
    Number.isFinite(n)
      ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)
      : '—';

  // ── Labels ──
  const xLabel = (formData.xLabel as string | undefined) || labelX || 'X';
  const yLabel = (formData.yLabel as string | undefined) || labelY || 'Y';
  const xShort = xLabel.length > 20 ? xLabel.slice(0, 18) + '…' : xLabel;
  const yShort = yLabel.length > 20 ? yLabel.slice(0, 18) + '…' : yLabel;

  // ── Detail query params ──
  const { simple: baseFilters, where: baseWhere, having: baseHaving } = splitAdhocFilters(
    formData.adhocFilters ?? [],
  );

  const detailQueryParams: DetailQueryParams = {
    datasetId: formData.detailDatasetId as number | undefined,
    storeColumn: groupbyStore,
    trendTimeColumn: formData.trendTimeColumn as string | undefined,
    trendWeeks: Number(formData.trendWeeks ?? 12) || 12,
    trendMetric: metricX,
    causesDimension: formData.causesDimension as string | undefined,
    causesMetric: formData.causesMetric as QueryFormMetric | undefined,
    causesTopN: Number(formData.causesTopN ?? 3) || 3,
    skusDimension: formData.skusDimension as string | undefined,
    skusMetric: formData.skusMetric as QueryFormMetric | undefined,
    skusTopN: Number(formData.skusTopN ?? 5) || 5,
    rankDimension: (formData.rankDimension as string | undefined) ?? groupbyFormat,
    baseFilters,
    baseWhere,
    baseHaving,
    timeRange: formData.time_range as string | undefined,
  };

  return {
    width,
    height,
    stores,
    formats,
    thresholdX,
    thresholdY,
    hasThresholds,
    quadrants,
    enableQuadrantAnnotations: (formData.enableQuadrantAnnotations as boolean | undefined) ?? true,
    enableWorstStar: (formData.enableWorstStar as boolean | undefined) ?? true,
    title: (formData.title as string | undefined) || 'Матрица рисков',
    subtitle: (formData.subtitle as string | undefined) || '',
    xLabel,
    yLabel,
    xUnit,
    yUnit,
    sizeUnit,
    formatX,
    formatY,
    formatSize,
    formatLoss,
    formatCount,
    xShort,
    yShort,
    isDarkMode,
    setDataMask: chartProps.hooks?.setDataMask as ScatterRiskProps['setDataMask'],
    filterState: (chartProps as unknown as { filterState?: { value?: unknown } }).filterState,
    storeColumn: groupbyStore,
    drillEnabled: (formData.drillEnabled as boolean | undefined) ?? true,
    detailQueryParams,
    shortcutsHint:
      (formData.shortcutsHint as string | undefined) ||
      'Click — фильтр · Ctrl+Click — детализация · Drag — перемещение · Scroll — масштаб',
  };
}
