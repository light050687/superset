import { ChartProps, getMetricLabel } from '@superset-ui/core';
import type {
  FormatCode,
  MockPreset,
  RankedStoresFormData,
  RankedStoresTransformedProps,
  SortKey,
  Store,
} from '../types';
import { enrichStoreWithMocks, StoreBase } from '../mocks/storeEnrichment';
import { DIVISION_BY_FORMAT, FORMATS_META } from '../mocks/rankedStoresMock';
import { generateByPreset } from '../mocks/generateMockStores';
import { BUILD_QUERY_DEFAULTS as D } from './buildQuery';

/** Универсальный привод к числу; NaN → fallback. */
function toNum(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toStr(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

/**
 * Читает значение formData по двум ключам (snake+camelCase) с fallback.
 * Superset иногда конвертирует имена через lodash camelCase, иногда нет.
 */
function readFd<T>(
  fd: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
  fallback: T,
): T {
  const v = fd[camelKey] ?? fd[snakeKey];
  if (v === undefined || v === null || v === '') return fallback;
  return v as T;
}

/** Нормализует код формата — приводит к одному из известных enum'ов. */
function normalizeFormat(raw: unknown): FormatCode {
  const s = toStr(raw).toLowerCase();
  if (
    s === 'express' ||
    s === 'minimarket' ||
    s === 'super' ||
    s === 'home' ||
    s === 'superstore'
  ) {
    return s;
  }
  if (s.includes('экспресс')) return 'express';
  if (s.includes('мини')) return 'minimarket';
  if (s.includes('суперстор')) return 'superstore';
  if (s.includes('супер')) return 'super';
  if (s.includes('дома') || s.includes('дом')) return 'home';
  return 'minimarket';
}

/**
 * Превращает queriesData[0].data → массив Store.
 *
 * 1. Если mockModeEnabled — возвращаем сгенерированный набор по пресету,
 *    игнорируя реальные queriesData.
 * 2. Иначе читаем строки по mapping (camel+snake), приводим типы,
 *    enrichStoreWithMocks дополняет tree/trend/distributions мок-полями.
 */
export default function transformProps(
  chartProps: ChartProps,
): RankedStoresTransformedProps {
  const {
    width,
    height,
    formData,
    queriesData,
    hooks = {},
    filterState,
  } = chartProps;
  const fd = formData as unknown as Record<string, unknown>;

  /* ── Mapping ── */
  const storeIdCol = readFd<string>(fd, 'storeIdCol', 'store_id_col', D.storeIdCol);
  const storeNameCol = readFd<string>(fd, 'storeNameCol', 'store_name_col', D.storeNameCol);
  const cityCol = readFd<string>(fd, 'cityCol', 'city_col', D.cityCol);
  const formatCol = readFd<string>(fd, 'formatCol', 'format_col', D.formatCol);
  const formatNameCol = readFd<string>(fd, 'formatNameCol', 'format_name_col', D.formatNameCol);
  const divisionCol = readFd<string>(fd, 'divisionCol', 'division_col', D.divisionCol);
  const toClassCol = readFd<string>(fd, 'toClassCol', 'to_class_col', D.toClassCol);
  const segmentIdCol = readFd<string>(fd, 'segmentIdCol', 'segment_id_col', 'segment_id');

  /* ── Метрики (имена колонок в data-row) ── */
  const resolveMetric = (v: unknown, fallback: string): string => {
    if (!v) return fallback;
    if (typeof v === 'string') return v;
    return getMetricLabel(v as never) ?? fallback;
  };
  const writeoffKey = resolveMetric(
    readFd(fd, 'writeoffMetric', 'writeoff_metric', D.writeoffMetric),
    D.writeoffMetric,
  );
  const shrinkageKey = resolveMetric(
    readFd(fd, 'shrinkageMetric', 'shrinkage_metric', D.shrinkageMetric),
    D.shrinkageMetric,
  );
  const planWriteoffKey = resolveMetric(
    readFd(fd, 'planWriteoffMetric', 'plan_writeoff_metric', D.planWriteoffMetric),
    D.planWriteoffMetric,
  );
  const planShrinkageKey = resolveMetric(
    readFd(fd, 'planShrinkageMetric', 'plan_shrinkage_metric', D.planShrinkageMetric),
    D.planShrinkageMetric,
  );
  const avgWriteoffKey = resolveMetric(
    readFd(fd, 'avgWriteoffMetric', 'avg_writeoff_metric', D.avgWriteoffMetric),
    D.avgWriteoffMetric,
  );
  const avgShrinkageKey = resolveMetric(
    readFd(fd, 'avgShrinkageCheckMetric', 'avg_shrinkage_check_metric', D.avgShrinkageCheckMetric),
    D.avgShrinkageCheckMetric,
  );

  /* ── Режим проектирования: возвращаем моки ── */
  const mockModeEnabled = readFd<boolean>(fd, 'mockModeEnabled', 'mock_mode_enabled', false);
  const mockPreset = readFd<MockPreset>(fd, 'mockPreset', 'mock_preset', 'losses_400');

  const periodLabel = readFd<string>(fd, 'periodLabel', 'period_label', '');
  const defaultSort = readFd<SortKey>(fd, 'defaultSort', 'default_sort', 'lossCombined');

  let stores: Store[];
  if (mockModeEnabled) {
    stores = generateByPreset(mockPreset);
  } else {
    const rawRows: Record<string, unknown>[] =
      (queriesData?.[0] as { data?: Record<string, unknown>[] } | undefined)?.data ??
      [];

    /* Warn если маппинг явно не совпадает */
    if (rawRows.length > 0 && rawRows[0][storeIdCol] === undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ext-ranked-stores] В первой строке нет поля "${storeIdCol}". ` +
          `Проверьте mapping колонок в настройках плагина.`,
      );
    }

    stores = rawRows.map((r, idx) => {
      const id = toStr(r[storeIdCol], `row-${idx}`);
      const name = toStr(r[storeNameCol], id);
      const city = toStr(r[cityCol], '');
      const format = normalizeFormat(r[formatCol]);
      const fmtMeta = FORMATS_META[format];
      const formatName =
        toStr(r[formatNameCol], '') || fmtMeta?.name || String(format);
      const division =
        toStr(r[divisionCol], '') || DIVISION_BY_FORMAT[format] || '';
      const toClass = Math.round(toNum(r[toClassCol], 0));
      const writeoff = toNum(r[writeoffKey], 0);
      const shrinkage = toNum(r[shrinkageKey], 0);
      const planWriteoff = toNum(r[planWriteoffKey], fmtMeta?.planWriteoff ?? 0);
      const planShrinkage = toNum(r[planShrinkageKey], fmtMeta?.planShrinkage ?? 0);
      const avgWriteoff = Math.round(toNum(r[avgWriteoffKey], 0));
      const avgShrinkageCheck = Math.round(toNum(r[avgShrinkageKey], 0));
      const shortLabel = name.split(/\s+/).slice(-1)[0] || name;

      const base: StoreBase = {
        id,
        code: toStr(r['store_code'], `Д${idx + 1}`),
        name,
        shortLabel,
        city,
        format,
        formatName,
        division,
        revenue: toNum(r['revenue_mln'], toClass),
        toClass,
        writeoff,
        shrinkage,
        planWriteoff,
        planShrinkage,
        avgWriteoff,
        avgShrinkageCheck,
      };
      return enrichStoreWithMocks(base);
    });
  }

  /* emitCrossFilters приходит из chartProps (опционально в Superset 6). По умолчанию false:
     плагин не должен пушить setDataMask, если пользователь явно не включил cross-filter
     на уровне дашборда. */
  const emitCrossFilters =
    (chartProps as { emitCrossFilters?: boolean }).emitCrossFilters === true;

  return {
    width,
    height,
    stores,
    formData: formData as RankedStoresFormData,
    hooks,
    filterState,
    emitCrossFilters,
    periodLabel,
    defaultSort,
    storeIdCol,
    segmentIdCol,
  };
}
