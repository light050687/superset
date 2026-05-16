import { computePareto } from '../src/echarts/computePareto';
import { ParetoItem } from '../src/types';

const sampleItems: ParetoItem[] = [
  { id: 'a', name: 'A', value: 50, valuePrev: 60 },
  { id: 'b', name: 'B', value: 30, valuePrev: 20 },
  { id: 'c', name: 'C', value: 15, valuePrev: 12 },
  { id: 'd', name: 'D', value: 5, valuePrev: 8 },
];

describe('computePareto — сортировка и кумулятивы', () => {
  it('сортирует по убыванию value и считает cumPct корректно', () => {
    const { items, total } = computePareto(sampleItems, 80);
    expect(total).toBe(100);
    expect(items.map(i => i.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(items[0].cumPct).toBeCloseTo(50, 5);
    expect(items[1].cumPct).toBeCloseTo(80, 5);
    expect(items[2].cumPct).toBeCloseTo(95, 5);
    expect(items[3].cumPct).toBeCloseTo(100, 5);
  });

  it('share корректно в сумме даёт 100', () => {
    const { items } = computePareto(sampleItems, 80);
    const sumShare = items.reduce((s, i) => s + i.share, 0);
    expect(sumShare).toBeCloseTo(100, 5);
  });
});

describe('computePareto — ABC-зоны', () => {
  it('threshold=80: A → B по границе 80% (A первое, B второе)', () => {
    const { items } = computePareto(sampleItems, 80);
    expect(items[0].zone).toBe('A'); // cumPrev = 0
    expect(items[1].zone).toBe('A'); // cumPrev = 50 < 80
    expect(items[2].zone).toBe('B'); // cumPrev = 80 → B
    expect(items[3].zone).toBe('C'); // cumPrev = 95 → C
  });

  it('threshold=50: зона A стягивается', () => {
    const { items } = computePareto(sampleItems, 50);
    expect(items[0].zone).toBe('A'); // cumPrev 0 < 50
    expect(items[1].zone).toBe('B'); // cumPrev 50 → B
    expect(items[2].zone).toBe('B'); // cumPrev 80 < 95 → B
    expect(items[3].zone).toBe('C'); // cumPrev 95 → C
  });

  it('threshold=95: зона A поглощает почти всё', () => {
    const { items } = computePareto(sampleItems, 95);
    expect(items[0].zone).toBe('A');
    expect(items[1].zone).toBe('A');
    expect(items[2].zone).toBe('A');
    expect(items[3].zone).toBe('C'); // cumPrev 95 — граница
  });
});

describe('computePareto — ranks', () => {
  it('rank 1..N по текущему периоду', () => {
    const { items } = computePareto(sampleItems, 80);
    expect(items.map(i => i.rank)).toEqual([1, 2, 3, 4]);
  });

  it('rankPrev и rankDelta считаются из valuePrev', () => {
    const { items } = computePareto(sampleItems, 80);
    const a = items.find(i => i.id === 'a')!;
    const b = items.find(i => i.id === 'b')!;
    // Прошлый порядок по valuePrev: a(60) > b(20) > c(12) > d(8)
    // Ранги прошлого: a=1, b=2, c=3, d=4
    expect(a.rankPrev).toBe(1);
    expect(b.rankPrev).toBe(2);
    expect(a.rankDelta).toBe(0);
    expect(b.rankDelta).toBe(0);
  });
});

describe('computePareto — граничные случаи', () => {
  it('одна категория даёт 100% кумул. и зону A', () => {
    const { items, vitalFew } = computePareto([
      { id: 'x', name: 'X', value: 42 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].cumPct).toBe(100);
    expect(items[0].zone).toBe('A');
    expect(vitalFew.countA).toBe(1);
  });

  it('все нули — total=1 (защита), всё попадает в A', () => {
    const { items, total } = computePareto([
      { id: 'a', name: 'A', value: 0 },
      { id: 'b', name: 'B', value: 0 },
    ]);
    expect(total).toBe(1);
    // При 0/1 все cumPct = 0 → cumPrev = 0 → zone A
    expect(items.every(i => i.zone === 'A')).toBe(true);
  });

  it('valuePrev=null даёт rankPrev=null и rankDelta=null', () => {
    const { items } = computePareto([
      { id: 'a', name: 'A', value: 10 },
      { id: 'b', name: 'B', value: 5 },
    ]);
    items.forEach(i => {
      expect(i.rankPrev).toBeNull();
      expect(i.rankDelta).toBeNull();
      expect(i.wasInA).toBe(false);
      expect(i.isNewInA).toBe(false);
    });
  });

  it('lossPctOfRevenue корректно считается', () => {
    const { items } = computePareto([
      { id: 'a', name: 'A', value: 10, revenueRub: 100 },
      { id: 'b', name: 'B', value: 5, revenueRub: 0 },
      { id: 'c', name: 'C', value: 2, revenueRub: null },
    ]);
    const a = items.find(i => i.id === 'a')!;
    const b = items.find(i => i.id === 'b')!;
    const c = items.find(i => i.id === 'c')!;
    expect(a.lossPctOfRevenue).toBeCloseTo(10, 5);
    expect(b.lossPctOfRevenue).toBeNull();
    expect(c.lossPctOfRevenue).toBeNull();
  });
});

describe('computePareto — VitalFew', () => {
  it('считает countA, cumPctA и sumA корректно', () => {
    const { vitalFew } = computePareto(sampleItems, 80);
    // zoneA = a+b → 2 категории, cumPctA = 80, sumA = 80
    expect(vitalFew.countA).toBe(2);
    expect(vitalFew.total).toBe(4);
    expect(vitalFew.cumPctA).toBeCloseTo(80, 5);
    expect(vitalFew.sumA).toBe(80);
  });
});

describe('computePareto — защита от деления на 0', () => {
  it('все valuePrev=0 — не падает, ранги/зоны корректны', () => {
    const { items } = computePareto(
      [
        { id: 'a', name: 'A', value: 10, valuePrev: 0 },
        { id: 'b', name: 'B', value: 5, valuePrev: 0 },
      ],
      80,
    );
    items.forEach(i => {
      expect(Number.isFinite(i.cumPct)).toBe(true);
      expect(['A', 'B', 'C']).toContain(i.zone);
      expect(i.rankPrev).not.toBeNull();
    });
  });

  it('valuePrev=0 учитывается как хвост ранжирования (не null)', () => {
    const { items } = computePareto(
      [
        { id: 'a', name: 'A', value: 10, valuePrev: 100 },
        { id: 'b', name: 'B', value: 5, valuePrev: 0 },
      ],
      80,
    );
    const a = items.find(i => i.id === 'a')!;
    const b = items.find(i => i.id === 'b')!;
    expect(a.rankPrev).toBe(1);
    expect(b.rankPrev).toBe(2);
  });
});

describe('computePareto — isNewInA', () => {
  it('категория, которая была в B/C и стала в A, помечается isNewInA', () => {
    // Прошлый период: b > a > c > d (порядок 1,2,3,4), threshold 80
    // cumPrev (prev period): b=0→'A', a=b_v/total → prev total = 40
    //   b_prev=20 (50% выручки) → cumPrev 0 → A
    //   a_prev=15 → cumPrev 50 → B (50 < 80, значит A)
    //   c_prev=3  → cumPrev 87.5 → B
    //   d_prev=2  → cumPrev 95 → C
    // Сейчас: a=100, b=10, c=5, d=1 → a попадает в A
    // a была в A → isNewInA=false; если мы сконструируем так, чтобы a НЕ была в A
    // прошлого периода — получим isNewInA=true.
    const items: ParetoItem[] = [
      { id: 'new', name: 'New', value: 80, valuePrev: 1 },
      { id: 'x',   name: 'X',   value: 10, valuePrev: 50 },
      { id: 'y',   name: 'Y',   value: 10, valuePrev: 49 },
    ];
    const { items: out } = computePareto(items, 80);
    const newOne = out.find(i => i.id === 'new')!;
    expect(newOne.zone).toBe('A');
    expect(newOne.wasInA).toBe(false);
    expect(newOne.isNewInA).toBe(true);
  });
});
