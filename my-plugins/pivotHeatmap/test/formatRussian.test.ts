import {
  formatRussianDeltaPercent,
  formatRussianInt,
  formatRussianPercent,
  formatRussianSmartEx,
} from '../src/utils/formatRussian';

describe('formatRussianSmartEx', () => {
  test('< 10,000 renders plain with locale', () => {
    // ru-RU Intl uses NARROW NO-BREAK SPACE (U+202F) as thousands separator
    expect(formatRussianSmartEx(1234, 0)).toMatch(/1.234/);
  });
  test('>= 10,000 uses "тыс"', () => {
    expect(formatRussianSmartEx(12345, 1)).toMatch(/12,3 тыс/);
  });
  test('>= 1,000,000 uses "млн"', () => {
    expect(formatRussianSmartEx(1234567, 2)).toMatch(/1,23 млн/);
  });
  test('>= 1,000,000,000 uses "млрд"', () => {
    expect(formatRussianSmartEx(1234567890, 2)).toMatch(/1,23 млрд/);
  });
  test('suffix is appended', () => {
    expect(formatRussianSmartEx(1500000, 1, 'млн ₽')).toMatch(/1,5 млн млн ₽/);
  });
});

describe('formatRussianPercent', () => {
  test('formats value directly as percent', () => {
    expect(formatRussianPercent(2.5, 2)).toBe('2,50%');
  });
  test('default decimals = 1 (DS 2.0 §11)', () => {
    expect(formatRussianPercent(12.45)).toBe('12,5%');
  });
});

describe('formatRussianDeltaPercent', () => {
  test('positive: + and ↑ arrow (DS §11)', () => {
    expect(formatRussianDeltaPercent(14.8)).toBe('+14,8% ↑');
  });
  test('negative: − and ↓ arrow (DS §11)', () => {
    expect(formatRussianDeltaPercent(-5.3)).toBe('−5,3% ↓');
  });
  test('near-zero: no sign, no arrow', () => {
    expect(formatRussianDeltaPercent(0.001)).toBe('0,0%');
  });
});

describe('formatRussianInt', () => {
  test('renders integer without fractional', () => {
    expect(formatRussianInt(12)).toBe('12');
    // ru-RU Intl uses U+202F between thousands
    expect(formatRussianInt(12345)).toMatch(/12.345/);
  });
});
