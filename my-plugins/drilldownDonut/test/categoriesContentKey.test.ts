import {
  getCategoriesIdKey,
  getCategoriesContentKey,
} from '../src/utils/categoriesContentKey';
import { CategoryNode } from '../src/types';

const mkCat = (overrides: Partial<CategoryNode> = {}): CategoryNode => ({
  id: 'A',
  name: 'A',
  rub: 100,
  count: null,
  color: '#aaa',
  accent: 'cSky',
  children: [],
  ...overrides,
});

describe('getCategoriesIdKey', () => {
  it('returns same key for identical id sets (different array refs)', () => {
    const a = [mkCat({ id: 'a' }), mkCat({ id: 'b' })];
    const b = [mkCat({ id: 'a' }), mkCat({ id: 'b' })];
    expect(getCategoriesIdKey(a)).toBe(getCategoriesIdKey(b));
  });

  it('changes when id set changes', () => {
    const a = [mkCat({ id: 'a' }), mkCat({ id: 'b' })];
    const b = [mkCat({ id: 'a' }), mkCat({ id: 'c' })];
    expect(getCategoriesIdKey(a)).not.toBe(getCategoriesIdKey(b));
  });

  it('does NOT change when only color/accent/rub differ (stable under theme switch / value refresh)', () => {
    const a = [mkCat({ id: 'a', color: '#111', accent: 'cSky', rub: 10 })];
    const b = [mkCat({ id: 'a', color: '#222', accent: 'cAmber', rub: 99 })];
    expect(getCategoriesIdKey(a)).toBe(getCategoriesIdKey(b));
  });
});

describe('getCategoriesContentKey', () => {
  it('returns same key for fully identical content (different array refs)', () => {
    const a = [
      mkCat({ id: 'a', rub: 10, color: '#111', accent: 'cSky' }),
      mkCat({ id: 'b', rub: 20, color: '#222', accent: 'cAmber' }),
    ];
    const b = [
      mkCat({ id: 'a', rub: 10, color: '#111', accent: 'cSky' }),
      mkCat({ id: 'b', rub: 20, color: '#222', accent: 'cAmber' }),
    ];
    expect(getCategoriesContentKey(a)).toBe(getCategoriesContentKey(b));
  });

  it('changes when an id changes', () => {
    const a = [mkCat({ id: 'a' })];
    const b = [mkCat({ id: 'b' })];
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });

  it('changes when only color changes (covers theme switch / colorMap edit)', () => {
    const a = [mkCat({ id: 'a', color: '#111' })];
    const b = [mkCat({ id: 'a', color: '#222' })];
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });

  it('changes when only accent changes', () => {
    const a = [mkCat({ id: 'a', accent: 'cSky' })];
    const b = [mkCat({ id: 'a', accent: 'cAmber' })];
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });

  it('changes when only rub value changes (numeric refresh)', () => {
    const a = [mkCat({ id: 'a', rub: 10 })];
    const b = [mkCat({ id: 'a', rub: 11 })];
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });

  it('changes when children added/removed (drill structure change)', () => {
    const empty = [mkCat({ id: 'a', children: [] })];
    const withChild = [
      mkCat({
        id: 'a',
        children: [
          { id: 'a/c1', name: 'c1', rub: 5, count: null, color: '#abc' },
        ],
      }),
    ];
    expect(getCategoriesContentKey(empty)).not.toBe(
      getCategoriesContentKey(withChild),
    );
  });

  it('changes when a child color changes (sub-level theme refresh)', () => {
    const a = [
      mkCat({
        id: 'a',
        children: [
          { id: 'a/c1', name: 'c1', rub: 5, color: '#111', count: null },
        ],
      }),
    ];
    const b = [
      mkCat({
        id: 'a',
        children: [
          { id: 'a/c1', name: 'c1', rub: 5, color: '#222', count: null },
        ],
      }),
    ];
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });

  it('handles undefined children array gracefully', () => {
    const a = [
      mkCat({ id: 'a', children: undefined as unknown as CategoryNode['children'] }),
    ];
    expect(() => getCategoriesContentKey(a)).not.toThrow();
  });
});

describe('idKey vs contentKey divergence', () => {
  it('idKey stable, contentKey changes when only color changes', () => {
    const a = [mkCat({ id: 'a', color: '#111' })];
    const b = [mkCat({ id: 'a', color: '#222' })];
    expect(getCategoriesIdKey(a)).toBe(getCategoriesIdKey(b));
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });

  it('both change when id set changes', () => {
    const a = [mkCat({ id: 'a' })];
    const b = [mkCat({ id: 'b' })];
    expect(getCategoriesIdKey(a)).not.toBe(getCategoriesIdKey(b));
    expect(getCategoriesContentKey(a)).not.toBe(getCategoriesContentKey(b));
  });
});
