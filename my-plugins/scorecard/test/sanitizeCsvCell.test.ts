import { describe, it, expect } from '@jest/globals';
import { sanitizeCsvCell } from '../src/utils/sanitizeCsvCell';

/**
 * CWE-1236 / OWASP "CSV Injection" guard.
 * The canonical helper lives in my-plugins/_shared/csv-escape/ and is copied
 * byte-identical into scorecard / divergingBars / leaderboard. Testing it once
 * here (the only plugin with a working jest setup) covers all three exporters.
 */
describe('sanitizeCsvCell - CSV formula injection guard (CWE-1236)', () => {
  it('neutralizes a =WEBSERVICE exfiltration payload', () => {
    expect(sanitizeCsvCell('=WEBSERVICE("http://x")')).toBe(
      `'=WEBSERVICE("http://x")`,
    );
  });

  it('neutralizes +, @, and - leading formulas', () => {
    expect(sanitizeCsvCell('+1+1')).toBe(`'+1+1`);
    expect(sanitizeCsvCell('@SUM(A1)')).toBe(`'@SUM(A1)`);
    expect(sanitizeCsvCell('-1+cmd|calc')).toBe(`'-1+cmd|calc`);
    expect(sanitizeCsvCell('=1+1')).toBe(`'=1+1`);
  });

  it('neutralizes leading TAB / CR / LF control chars', () => {
    expect(sanitizeCsvCell('\t=cmd')).toBe(`'\t=cmd`);
    expect(sanitizeCsvCell('\r=cmd')).toBe(`'\r=cmd`);
    expect(sanitizeCsvCell('\n=cmd')).toBe(`'\n=cmd`);
  });

  it('does NOT touch plain text (incl. cyrillic dimension labels)', () => {
    expect(sanitizeCsvCell('Магазин №5')).toBe('Магазин №5');
    expect(sanitizeCsvCell('Москва, ЦАО')).toBe('Москва, ЦАО');
    expect(sanitizeCsvCell('')).toBe('');
  });

  it('keeps negative numbers numeric (en + ru formats) - Excel SUM stays intact', () => {
    expect(sanitizeCsvCell('-1234')).toBe('-1234');
    expect(sanitizeCsvCell('-3.14')).toBe('-3.14');
    expect(sanitizeCsvCell('-3,50')).toBe('-3,50');
    expect(sanitizeCsvCell('-1 234,5')).toBe('-1 234,5'); // space thousands
    expect(sanitizeCsvCell('-1 234,50')).toBe('-1 234,50'); // NBSP thousands
  });

  it('keeps fraction-only numbers (.5 / ,5 / -.5 / -,5)', () => {
    expect(sanitizeCsvCell('.5')).toBe('.5');
    expect(sanitizeCsvCell(',5')).toBe(',5');
    expect(sanitizeCsvCell('-.5')).toBe('-.5');
    expect(sanitizeCsvCell('-,5')).toBe('-,5');
  });

  it('passes through positive numbers, %-suffixed values, and nullish input', () => {
    expect(sanitizeCsvCell('1234')).toBe('1234');
    expect(sanitizeCsvCell('12,4%')).toBe('12,4%'); // leading digit, not a trigger
    expect(sanitizeCsvCell(-5)).toBe('-5'); // number input
    expect(sanitizeCsvCell(0)).toBe('0');
    expect(sanitizeCsvCell(null)).toBe('');
    expect(sanitizeCsvCell(undefined)).toBe('');
  });
});
