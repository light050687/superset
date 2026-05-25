import type { ComparisonMode, FormatDef, Store } from '../types';

/**
 * Группирует плоские строки SQL-запроса в Store[] — period-over-period.
 *
 * Структура входа: GROUP BY (store_code, store_name, city, format) и метрики
 * `<lossLabel>` (current) + `<lossLabel>__<shift>` (comparison). Аналогично
 * для turnover. Каждый магазин занимает РОВНО одну строку (без агрегации
 * по неделям). Маркер shift зависит от выбранного `comparisonMode`.
 *
 * - `prev_period` → suffix `__inherit`
 * - `prev_week`   → suffix `__1 week ago`
 * - `prev_month`  → suffix `__1 month ago`
 * - `prev_quarter`→ suffix `__1 quarter ago`
 * - `prev_year`   → suffix `__1 year ago`
 * - `custom`      → отдельный query (comp), здесь не используется
 *
 * Если comparison-колонок нет (например main-query при custom) — prevValue = 0.
 */
export interface RowsToStoresColumns {
  codeCol?: string;
  nameCol?: string;
  cityCol?: string;
  formatCol?: string;
  weekCol?: string;
  lossLabel?: string;
  turnoverLabel?: string;
  /**
   * Режим сравнения — определяет какой suffix искать для comparison-колонок.
   * Если не передан или = 'custom' — comparison не парсится из этих rows.
   */
  comparisonMode?: ComparisonMode;
}

/** Маппинг режима сравнения на time-compare суффикс. */
export function comparisonModeToShift(mode: ComparisonMode): string {
  switch (mode) {
    case 'prev_period':
      return 'inherit';
    case 'prev_week':
      return '1 week ago';
    case 'prev_month':
      return '1 month ago';
    case 'prev_quarter':
      return '1 quarter ago';
    case 'prev_year':
      return '1 year ago';
    case 'custom':
    default:
      return '';
  }
}

/**
 * Группирует rows в Store[]. Каждая row = один магазин (один уникальный
 * groupby-ключ). prev/curr собираются по имени колонок:
 *   `<lossLabel>`           — current
 *   `<lossLabel>__<shift>`  — previous
 */
export function rowsToStores(
  rows: Record<string, unknown>[],
  columns: RowsToStoresColumns,
  formatsMap: Map<string, FormatDef>,
  prevRows?: Record<string, unknown>[],
): Store[] {
  const {
    codeCol,
    nameCol,
    cityCol,
    formatCol,
    lossLabel,
    turnoverLabel,
    comparisonMode,
  } = columns;

  const shift =
    comparisonMode && comparisonMode !== 'custom'
      ? comparisonModeToShift(comparisonMode)
      : '';
  const lossPrevKey = lossLabel && shift ? `${lossLabel}__${shift}` : undefined;
  const toPrevKey =
    turnoverLabel && shift ? `${turnoverLabel}__${shift}` : undefined;

  const num = (v: unknown): number => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const buildKey = (r: Record<string, unknown>): string => {
    const code = codeCol ? String(r[codeCol] ?? '') : '';
    const name = nameCol ? String(r[nameCol] ?? '') : '';
    const city = cityCol ? String(r[cityCol] ?? '') : '';
    return code || `${name}|${city}`;
  };

  // Index prevRows by groupby-key (для custom-режима, когда prev приходит
  // отдельным query).
  const prevByKey = new Map<string, Record<string, unknown>>();
  if (prevRows && prevRows.length) {
    for (const r of prevRows) {
      prevByKey.set(buildKey(r), r);
    }
  }

  const storeMap = new Map<string, Store>();
  rows.forEach(r => {
    const code = codeCol ? String(r[codeCol] ?? '') : '';
    const name = nameCol ? String(r[nameCol] ?? '') : code || '—';
    const city = cityCol ? String(r[cityCol] ?? '') : '';
    const formatId = formatCol ? String(r[formatCol] ?? '') : '';
    const key = buildKey(r);

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
        prevValueRub: 0,
        currValueRub: 0,
        prevValuePct: 0,
        currValuePct: 0,
      };
      storeMap.set(key, store);
    }

    // Current period (main row).
    const currLoss = lossLabel ? num(r[lossLabel]) : 0;
    const currTo = turnoverLabel ? num(r[turnoverLabel]) : 0;
    store.currValueRub += currLoss;
    store.to = Math.max(store.to, currTo);
    if (currTo > 0) {
      store.currValuePct = +((store.currValueRub / currTo) * 100).toFixed(2);
    }

    // Previous period — либо из той же row через time-compare suffix,
    // либо из prevRows (custom-режим).
    let prevLoss = 0;
    let prevTo = 0;
    if (lossPrevKey && r[lossPrevKey] !== undefined) {
      prevLoss = num(r[lossPrevKey]);
    }
    if (toPrevKey && r[toPrevKey] !== undefined) {
      prevTo = num(r[toPrevKey]);
    }
    // Fallback: prevRows (custom-режим).
    const prevRow = prevByKey.get(key);
    if (prevRow) {
      if (lossLabel && prevRow[lossLabel] !== undefined && !lossPrevKey) {
        prevLoss = num(prevRow[lossLabel]);
      }
      if (
        turnoverLabel &&
        prevRow[turnoverLabel] !== undefined &&
        !toPrevKey
      ) {
        prevTo = num(prevRow[turnoverLabel]);
      }
    }
    store.prevValueRub += prevLoss;
    if (prevTo > 0) {
      store.prevValuePct = +((store.prevValueRub / prevTo) * 100).toFixed(2);
    }
  });

  return Array.from(storeMap.values());
}
