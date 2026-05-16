import { ChartProps, getMetricLabel } from '@superset-ui/core';
import type {
  DataState,
  FormatDef,
  Horizon,
  MetricMode,
  PartialWarning,
  Store,
  VelocityDivergingFormData,
  VelocityDivergingProps,
} from '../types';
import { getPreset } from '../mocks/presets';
import { DEFAULT_FORMATS } from '../utils/mockGenerator';

/**
 * Расширенная форма ChartProps — queriesData типизируется на уровне плагина,
 * т.к. @superset-ui/core по-разному типизирует его в разных минорных версиях.
 */
type VelocityChartProps = ChartProps<VelocityDivergingFormData> & {
  queriesData?: Array<{
    data?: Record<string, unknown>[];
    error?: string | null;
    errorMessage?: string | null;
  }>;
};

/**
 * DS 2.0 локализация Superset time_range пресетов в русский subtitle.
 */
function formatTimeRangeRu(tr: string | undefined): string {
  if (!tr || tr === 'No filter') return 'за период';
  const map: Record<string, string> = {
    'Last day': 'за день',
    'Last week': 'за неделю',
    'Last month': 'за месяц',
    'Last quarter': 'за квартал',
    'Last year': 'за год',
    Today: 'сегодня',
    'This week': 'за эту неделю',
    'This month': 'за этот месяц',
    'This year': 'за этот год',
    'previous calendar week': 'за прошлую неделю',
    'previous calendar month': 'за прошлый месяц',
    'previous calendar year': 'за прошлый год',
  };
  return map[tr] ?? tr;
}

function detectDarkMode(theme: unknown): boolean {
  const bg = (theme as { colorBgContainer?: string } | undefined)
    ?.colorBgContainer;
  if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
  const hex = bg.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function parseFormats(raw: string | undefined): FormatDef[] {
  if (!raw || raw.trim().length === 0) return DEFAULT_FORMATS;
  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      { name?: string; color?: string; plan?: number }
    >;
    const out: FormatDef[] = Object.entries(parsed).map(([id, cfg]) => ({
      id,
      name: cfg.name ?? id,
      color: cfg.color ?? 'c-sky',
      plan: cfg.plan,
    }));
    return out.length ? out : DEFAULT_FORMATS;
  } catch {
    return DEFAULT_FORMATS;
  }
}

function firstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length && typeof v[0] === 'string')
    return v[0] as string;
  return undefined;
}

/** Группирует плоские строки запроса в Store[] с 12 неделями. */
function rowsToStores(
  rows: Record<string, unknown>[],
  columns: {
    codeCol?: string;
    nameCol?: string;
    cityCol?: string;
    formatCol?: string;
    weekCol?: string;
    lossLabel?: string;
    turnoverLabel?: string;
  },
  formatsMap: Map<string, FormatDef>,
): Store[] {
  const { codeCol, nameCol, cityCol, formatCol, weekCol, lossLabel, turnoverLabel } =
    columns;

  // Собираем уникальные недели и сортируем по возрастанию (12 последних берём в конце).
  const weekSet = new Set<string>();
  rows.forEach(r => {
    if (weekCol) {
      const w = r[weekCol];
      if (w != null) weekSet.add(String(w));
    }
  });
  const weeksSorted = Array.from(weekSet).sort();
  const weeksToUse = weeksSorted.slice(-12);
  const weekIndex = new Map<string, number>();
  weeksToUse.forEach((w, i) => weekIndex.set(w, i));

  // Ключ магазина — code, если есть, иначе name+city.
  const storeMap = new Map<string, Store>();
  rows.forEach(r => {
    const code = codeCol ? String(r[codeCol] ?? '') : '';
    const name = nameCol ? String(r[nameCol] ?? '') : code || '—';
    const city = cityCol ? String(r[cityCol] ?? '') : '';
    const formatId = formatCol ? String(r[formatCol] ?? '') : '';
    const weekVal = weekCol ? String(r[weekCol] ?? '') : '';
    const idx = weekIndex.get(weekVal);
    if (idx === undefined) return;

    const key = code || `${name}|${city}`;
    let store = storeMap.get(key);
    if (!store) {
      const fmtDef = formatsMap.get(formatId);
      store = {
        id: key,
        code: code || name,
        name,
        shortLabel: name,
        city,
        format: formatId,
        formatName: fmtDef?.name ?? formatId ?? '—',
        plan: fmtDef?.plan ?? 0,
        to: 0,
        weeksRub: new Array(12).fill(0),
        weeksPct: new Array(12).fill(0),
      };
      storeMap.set(key, store);
    }

    const loss = lossLabel ? Number(r[lossLabel] ?? 0) : 0;
    const to = turnoverLabel ? Number(r[turnoverLabel] ?? 0) : 0;
    store.weeksRub[idx] = Number.isFinite(loss) ? loss : 0;
    // % к ТО для этой недели; если ТО = 0, то 0
    const pct = to > 0 ? (loss / to) * 100 : 0;
    store.weeksPct[idx] = +pct.toFixed(2);
    store.to = Math.max(store.to, Number.isFinite(to) ? to : 0);
  });

  return Array.from(storeMap.values());
}

export default function transformProps(
  chartProps: VelocityChartProps,
): VelocityDivergingProps {
  const { formData, queriesData, width, height, theme } = chartProps;
  const isDarkMode = detectDarkMode(theme);

  const headerText =
    (formData.header_text as string | undefined) ??
    (formData as unknown as { headerText?: string }).headerText ??
    'Скорость роста потерь';

  const userSubtitle =
    (formData.subtitle_text as string | undefined) ??
    (formData as unknown as { subtitleText?: string }).subtitleText;
  const timeRange =
    (formData as unknown as { time_range?: string; timeRange?: string }).time_range ??
    (formData as unknown as { timeRange?: string }).timeRange;
  const subtitleText = (userSubtitle?.trim() || formatTimeRangeRu(timeRange));

  const defaultHorizon: Horizon =
    ((formData.default_horizon ??
      (formData as unknown as { defaultHorizon?: Horizon }).defaultHorizon) as Horizon) ?? '4w';
  const defaultMetric: MetricMode =
    ((formData.default_metric ??
      (formData as unknown as { defaultMetric?: MetricMode }).defaultMetric) as MetricMode) ?? 'rub';

  const showCumulativeView =
    (formData as unknown as { show_cumulative_view?: boolean; showCumulativeView?: boolean })
      .show_cumulative_view ??
    (formData as unknown as { showCumulativeView?: boolean }).showCumulativeView ??
    true;
  const showDetailModal =
    (formData as unknown as { show_detail_modal?: boolean; showDetailModal?: boolean })
      .show_detail_modal ??
    (formData as unknown as { showDetailModal?: boolean }).showDetailModal ??
    true;
  const showCsvExport =
    (formData as unknown as { show_csv_export?: boolean; showCsvExport?: boolean })
      .show_csv_export ??
    (formData as unknown as { showCsvExport?: boolean }).showCsvExport ??
    true;
  const showSummaryStrip =
    (formData as unknown as { show_summary_strip?: boolean; showSummaryStrip?: boolean })
      .show_summary_strip ??
    (formData as unknown as { showSummaryStrip?: boolean }).showSummaryStrip ??
    true;

  const formats = parseFormats(
    (formData as unknown as { format_mapping_json?: string; formatMappingJson?: string })
      .format_mapping_json ??
      (formData as unknown as { formatMappingJson?: string }).formatMappingJson,
  );

  const baseProps = {
    width,
    height,
    headerText,
    subtitleText,
    defaultHorizon,
    defaultMetric,
    showCumulativeView,
    showDetailModal,
    showCsvExport,
    showSummaryStrip,
    isDarkMode,
    formats,
    theme,
  };

  const mockModeEnabled =
    (formData as unknown as { mock_mode_enabled?: boolean; mockModeEnabled?: boolean })
      .mock_mode_enabled ??
    (formData as unknown as { mockModeEnabled?: boolean }).mockModeEnabled ??
    false;

  // ── Mock mode: возвращаем сгенерированные данные, игнорируя queriesData ──
  if (mockModeEnabled) {
    const preset = getPreset(
      (formData as unknown as { mock_preset?: string }).mock_preset ??
        'losses_velocity',
    );
    return {
      ...baseProps,
      dataState: 'populated' as DataState,
      stores: preset.stores,
      formats: preset.formats,
    };
  }

  // ── Real data mode ──
  const firstQuery = queriesData?.[0];
  const errMsg = firstQuery?.error || firstQuery?.errorMessage;
  if (errMsg) {
    return {
      ...baseProps,
      dataState: 'error' as DataState,
      stores: [],
      errorMessage: errMsg,
    };
  }

  const rows = (firstQuery?.data as Record<string, unknown>[] | undefined) ?? [];
  if (rows.length === 0) {
    return {
      ...baseProps,
      dataState: 'empty' as DataState,
      stores: [],
    };
  }

  const codeCol = firstString(
    (formData as unknown as { groupby_store_code?: unknown; groupbyStoreCode?: unknown })
      .groupby_store_code ??
      (formData as unknown as { groupbyStoreCode?: unknown }).groupbyStoreCode,
  );
  const nameCol = firstString(
    (formData as unknown as { groupby_store_name?: unknown; groupbyStoreName?: unknown })
      .groupby_store_name ??
      (formData as unknown as { groupbyStoreName?: unknown }).groupbyStoreName,
  );
  const cityCol = firstString(
    (formData as unknown as { groupby_city?: unknown; groupbyCity?: unknown })
      .groupby_city ??
      (formData as unknown as { groupbyCity?: unknown }).groupbyCity,
  );
  const formatCol = firstString(
    (formData as unknown as { groupby_format?: unknown; groupbyFormat?: unknown })
      .groupby_format ??
      (formData as unknown as { groupbyFormat?: unknown }).groupbyFormat,
  );
  const weekCol = firstString(
    (formData as unknown as { groupby_week?: unknown; groupbyWeek?: unknown })
      .groupby_week ??
      (formData as unknown as { groupbyWeek?: unknown }).groupbyWeek,
  );

  const metricLoss =
    (formData as unknown as { metric_loss?: unknown }).metric_loss ??
    (formData as unknown as { metricLoss?: unknown }).metricLoss;
  const metricTurnover =
    (formData as unknown as { metric_turnover?: unknown }).metric_turnover ??
    (formData as unknown as { metricTurnover?: unknown }).metricTurnover;
  const lossLabel = metricLoss ? getMetricLabel(metricLoss as never) : undefined;
  const turnoverLabel = metricTurnover
    ? getMetricLabel(metricTurnover as never)
    : undefined;

  // Partial — если не хватает ключевых колонок, предупреждаем.
  const missing: string[] = [];
  if (!weekCol) missing.push('неделя');
  if (!lossLabel) missing.push('метрика потерь');
  if (!codeCol && !nameCol) missing.push('код или название магазина');

  const formatsMap = new Map<string, FormatDef>();
  formats.forEach(f => formatsMap.set(f.id, f));

  const stores = rowsToStores(
    rows,
    {
      codeCol,
      nameCol,
      cityCol,
      formatCol,
      weekCol,
      lossLabel,
      turnoverLabel,
    },
    formatsMap,
  );

  if (stores.length === 0) {
    return {
      ...baseProps,
      dataState: 'empty' as DataState,
      stores: [],
    };
  }

  const partialWarning: PartialWarning | undefined = missing.length
    ? {
        message: `Не хватает колонок: ${missing.join(', ')}. Отображаются частичные данные.`,
      }
    : undefined;

  return {
    ...baseProps,
    dataState: partialWarning ? ('partial' as DataState) : ('populated' as DataState),
    stores,
    partialWarning,
  };
}
