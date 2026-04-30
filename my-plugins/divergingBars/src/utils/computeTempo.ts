import type { Horizon, MetricMode, Store, TempoResult } from '../types';

/**
 * Вычисляет темп и разницу между периодами для магазина на заданном
 * горизонте. Порт computeTempo() из `velocity-diverging-prototype.html`.
 *
 * - `wow`: неделя 11 vs неделя 10 (последняя vs предпоследняя).
 * - `4w`:  сумма недель 8..11 vs сумма 4..7 (4W vs 4W).
 * - `mom`: сумма недель 8..11 vs сумма 0..3 (этот месяц vs позапрошлый).
 * - `cum`: сумма 6..11 vs сумма 0..5 (вторые 6 недель vs первые 6).
 *
 * Возвращает NaN-безопасные значения: если prev=0 → tempo=1, pctChange=0.
 */
export function computeTempo(
  store: Store,
  horizon: Horizon,
  metric: MetricMode,
): TempoResult {
  const weeks = metric === 'rub' ? store.weeksRub : store.weeksPct;
  let prev = 0;
  let curr = 0;
  switch (horizon) {
    case 'wow':
      prev = weeks[10] ?? 0;
      curr = weeks[11] ?? 0;
      break;
    case '4w':
      prev = sum(weeks.slice(4, 8));
      curr = sum(weeks.slice(8, 12));
      break;
    case 'mom':
      prev = sum(weeks.slice(0, 4));
      curr = sum(weeks.slice(8, 12));
      break;
    case 'cum':
    default:
      prev = sum(weeks.slice(0, 6));
      curr = sum(weeks.slice(6, 12));
      break;
  }
  const tempo = prev > 0 ? curr / prev : 1;
  const pctChange = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  const absDelta = curr - prev;
  return {
    prev,
    curr,
    tempo: +tempo.toFixed(3),
    pctChange: +pctChange.toFixed(1),
    absDelta: +absDelta.toFixed(0),
  };
}

function sum(xs: number[]): number {
  let s = 0;
  for (let i = 0; i < xs.length; i += 1) s += xs[i];
  return s;
}

/** Классификация магазина по темпу: grow / shrink / flat. */
export function tempoDirection(tempo: number): 'grow' | 'shrink' | 'flat' {
  if (tempo > 1.05) return 'grow';
  if (tempo < 0.95) return 'shrink';
  return 'flat';
}
