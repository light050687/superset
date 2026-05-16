import {
  getQuadrant,
  getQuadrantStats,
  storeBadness,
  getWorstN,
  computeAverage,
  computeWeightedAverage,
} from '../src/utils/quadrants';
import { StorePoint } from '../src/types';

const makeStore = (overrides: Partial<StorePoint> = {}): StorePoint => ({
  id: overrides.id ?? 's1',
  name: overrides.name ?? 'Store 1',
  format: overrides.format ?? 'express',
  formatName: overrides.formatName ?? 'Экспресс',
  x: overrides.x ?? 1,
  y: overrides.y ?? 1,
  size: overrides.size ?? 10,
  planX: overrides.planX,
  planY: overrides.planY,
  sumLoss: overrides.sumLoss,
  city: overrides.city,
});

const thresholds = { x: 1.5, y: 0.5 };

describe('getQuadrant', () => {
  it('BL при x<tx && y<ty', () => {
    expect(getQuadrant(makeStore({ x: 1, y: 0.3 }), thresholds)).toBe('bl');
  });
  it('TR при x>=tx && y>=ty', () => {
    expect(getQuadrant(makeStore({ x: 2, y: 0.7 }), thresholds)).toBe('tr');
  });
  it('TL при x<tx && y>=ty', () => {
    expect(getQuadrant(makeStore({ x: 1, y: 0.7 }), thresholds)).toBe('tl');
  });
  it('BR при x>=tx && y<ty', () => {
    expect(getQuadrant(makeStore({ x: 2, y: 0.3 }), thresholds)).toBe('br');
  });
});

describe('getQuadrantStats', () => {
  it('считает count и loss по квадрантам', () => {
    const stores = [
      makeStore({ id: 'a', x: 1, y: 0.3, sumLoss: 1.0 }), // bl
      makeStore({ id: 'b', x: 2, y: 0.7, sumLoss: 5.0 }), // tr
      makeStore({ id: 'c', x: 2, y: 0.8, sumLoss: 3.0 }), // tr
    ];
    const stats = getQuadrantStats(stores, thresholds);
    expect(stats.bl.count).toBe(1);
    expect(stats.bl.loss).toBeCloseTo(1.0);
    expect(stats.tr.count).toBe(2);
    expect(stats.tr.loss).toBeCloseTo(8.0);
    expect(stats.tl.count).toBe(0);
    expect(stats.br.count).toBe(0);
  });

  it('обрабатывает пустой список', () => {
    const stats = getQuadrantStats([], thresholds);
    expect(stats.tl.count).toBe(0);
    expect(stats.tr.count).toBe(0);
    expect(stats.bl.count).toBe(0);
    expect(stats.br.count).toBe(0);
  });
});

describe('storeBadness', () => {
  it('нулевая при равенстве плана и факта', () => {
    const s = makeStore({ x: 1, y: 0.5, planX: 1, planY: 0.5 });
    expect(storeBadness(s)).toBe(0);
  });
  it('положительная когда факт хуже плана', () => {
    const s = makeStore({ x: 2, y: 1, planX: 1, planY: 0.5 });
    expect(storeBadness(s)).toBeGreaterThan(0);
  });
  it('игнорирует отрицательное отклонение по Y (good variance)', () => {
    // x=1 (план), y=0.1 (план 0.5) — ниже плана, badness=0 от y, должно быть ~0 total
    const s = makeStore({ x: 1, y: 0.1, planX: 1, planY: 0.5 });
    expect(storeBadness(s)).toBe(0);
  });
});

describe('getWorstN', () => {
  it('возвращает N самых плохих', () => {
    const stores = [
      makeStore({ id: 'a', x: 1, y: 0.5, planX: 1, planY: 0.5 }), // 0
      makeStore({ id: 'b', x: 2, y: 1.0, planX: 1, planY: 0.5 }), // +2
      makeStore({ id: 'c', x: 1.5, y: 0.8, planX: 1, planY: 0.5 }), // +1.1
    ];
    const worst = getWorstN(stores, 2);
    expect(worst.has('b')).toBe(true);
    expect(worst.has('c')).toBe(true);
    expect(worst.has('a')).toBe(false);
  });
});

describe('computeAverage', () => {
  it('считает среднее', () => {
    expect(computeAverage([1, 2, 3, 4])).toBe(2.5);
  });
  it('игнорирует NaN/Infinity', () => {
    expect(computeAverage([1, NaN, 3, Infinity])).toBe(2);
  });
  it('возвращает 0 для пустого', () => {
    expect(computeAverage([])).toBe(0);
  });
});

describe('computeWeightedAverage', () => {
  it('считает взвешенное среднее', () => {
    // weighted avg([10, 20], [1, 3]) = (10*1 + 20*3) / (1+3) = 70/4 = 17.5
    expect(computeWeightedAverage([10, 20], [1, 3])).toBeCloseTo(17.5);
  });
  it('возвращает 0 при нулевых весах', () => {
    expect(computeWeightedAverage([10, 20], [0, 0])).toBe(0);
  });
});
