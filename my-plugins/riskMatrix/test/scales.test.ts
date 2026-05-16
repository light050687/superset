import {
  pickStep,
  formatStep,
  radius,
  hexToRgba,
  pointInRect,
  pointInPolygon,
  seededRandom,
  randNormal,
} from '../src/utils/scales';

describe('pickStep', () => {
  it('возвращает степень 10 для range ~= 10', () => {
    const step = pickStep(10, 7);
    expect(step).toBeGreaterThan(0);
    expect(10 / step).toBeLessThanOrEqual(14);
  });

  it('возвращает разумный шаг для мелких диапазонов', () => {
    const step = pickStep(0.5, 5);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThanOrEqual(0.2);
  });

  it('возвращает 1 для нулевого или отрицательного range', () => {
    expect(pickStep(0, 7)).toBe(1);
    expect(pickStep(-5, 7)).toBe(1);
  });
});

describe('formatStep', () => {
  it('1 знак для step >= 1', () => {
    expect(formatStep(10, 1)).toBe('10.0');
  });

  it('2 знака для step 0.1..1', () => {
    expect(formatStep(1.23, 0.5)).toBe('1.23');
  });

  it('3 знака для step < 0.1', () => {
    expect(formatStep(0.005, 0.01)).toBe('0.005');
  });
});

describe('radius', () => {
  it('возвращает минимум 3 для некорректных значений', () => {
    expect(radius(NaN, 1, 100)).toBe(3);
    expect(radius(-5, 1, 100)).toBe(3);
    expect(radius(0, 1, 100)).toBe(3);
  });

  it('интерполирует между min и max в [3, 14]', () => {
    expect(radius(1, 1, 100)).toBeCloseTo(3, 5);
    expect(radius(100, 1, 100)).toBeCloseTo(14, 5);
    const mid = radius(50, 1, 100);
    expect(mid).toBeGreaterThan(3);
    expect(mid).toBeLessThan(14);
  });
});

describe('hexToRgba', () => {
  it('конвертирует 6-значный hex', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(hexToRgba('00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
  });

  it('разворачивает короткий hex #RGB', () => {
    expect(hexToRgba('#f00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('возвращает fallback для невалидного ввода', () => {
    expect(hexToRgba('не цвет', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
  });
});

describe('pointInRect', () => {
  const r = { x: 10, y: 10, w: 20, h: 20 };
  it('внутри прямоугольника', () => {
    expect(pointInRect({ x: 15, y: 15 }, r)).toBe(true);
  });
  it('на границе', () => {
    expect(pointInRect({ x: 10, y: 10 }, r)).toBe(true);
    expect(pointInRect({ x: 30, y: 30 }, r)).toBe(true);
  });
  it('снаружи', () => {
    expect(pointInRect({ x: 5, y: 15 }, r)).toBe(false);
    expect(pointInRect({ x: 31, y: 15 }, r)).toBe(false);
  });
});

describe('pointInPolygon', () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 5, y: 10 },
  ];
  it('внутри треугольника', () => {
    expect(pointInPolygon({ x: 5, y: 3 }, triangle)).toBe(true);
  });
  it('снаружи треугольника', () => {
    expect(pointInPolygon({ x: 15, y: 5 }, triangle)).toBe(false);
  });
});

describe('seededRandom + randNormal', () => {
  it('seededRandom детерминирован', () => {
    const r1 = seededRandom(42);
    const r2 = seededRandom(42);
    expect(r1()).toBe(r2());
    expect(r1()).toBe(r2());
  });

  it('randNormal возвращает числа около среднего', () => {
    const rng = seededRandom(1);
    let sum = 0;
    const N = 500;
    for (let i = 0; i < N; i++) sum += randNormal(rng, 10, 2);
    const mean = sum / N;
    expect(mean).toBeGreaterThan(9);
    expect(mean).toBeLessThan(11);
  });
});
