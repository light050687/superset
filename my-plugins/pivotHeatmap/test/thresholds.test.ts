import { cellStatus, statusFromRatio, totalsStatus } from '../src/utils/thresholds';
import type { Thresholds } from '../src/types';

const WORSE: Thresholds = { ok: 1.0, wn: 1.3, polarity: 'higher_is_worse' };
const BETTER: Thresholds = { ok: 1.0, wn: 1.3, polarity: 'higher_is_better' };

describe('statusFromRatio', () => {
  test('returns nd for null/undefined/non-finite', () => {
    expect(statusFromRatio(null, WORSE)).toBe('nd');
    expect(statusFromRatio(undefined, WORSE)).toBe('nd');
    expect(statusFromRatio(NaN, WORSE)).toBe('nd');
    expect(statusFromRatio(Infinity, WORSE)).toBe('nd');
  });

  test('higher_is_worse: ratio 0.8 → ok, 1.2 → wn, 1.5 → dn', () => {
    expect(statusFromRatio(0.8, WORSE)).toBe('ok');
    expect(statusFromRatio(1.0, WORSE)).toBe('ok');
    expect(statusFromRatio(1.2, WORSE)).toBe('wn');
    expect(statusFromRatio(1.3, WORSE)).toBe('wn');
    expect(statusFromRatio(1.5, WORSE)).toBe('dn');
  });

  test('higher_is_better: inverse — ratio ≥ 1/ok → ok, ≥ 1/wn → wn, lower → dn', () => {
    // 1/ok = 1.0, 1/wn ≈ 0.77
    expect(statusFromRatio(1.2, BETTER)).toBe('ok');
    expect(statusFromRatio(1.0, BETTER)).toBe('ok');
    expect(statusFromRatio(0.8, BETTER)).toBe('wn');
    expect(statusFromRatio(0.5, BETTER)).toBe('dn');
  });
});

describe('cellStatus / totalsStatus', () => {
  test('null cell → nd', () => {
    expect(cellStatus(null, WORSE)).toBe('nd');
    expect(cellStatus(undefined, WORSE)).toBe('nd');
  });
  test('null slice → nd', () => {
    expect(totalsStatus(null, WORSE)).toBe('nd');
  });
  test('delegates to statusFromRatio with ratio property', () => {
    expect(cellStatus(
      { rowId: 'r', colId: 'c', value: 10, plan: 10, ratio: 1.0, pct: null, planPct: null, revenue: null, shops: null },
      WORSE,
    )).toBe('ok');
  });
});
