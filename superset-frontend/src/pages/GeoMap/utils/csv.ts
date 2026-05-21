/**
 * Parse CSV text into columns and rows.
 * Auto-detects separator: tab -> semicolon -> comma.
 */
export function parseCSV(text: string): {
  columns: string[];
  rows: Record<string, string>[];
} {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { columns: [], rows: [] };

  const firstLine = lines[0]!;
  const sep = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(';')
      ? ';'
      : ',';
  const columns = firstLine
    .split(sep)
    .map(c => c.trim().replace(/^["']|["']$/g, ''));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i]!.split(sep).map(v =>
      v.trim().replace(/^["']|["']$/g, ''),
    );
    if (vals.length !== columns.length) continue;
    const row: Record<string, string> = {};
    columns.forEach((col, j) => {
      row[col] = vals[j]!;
    });
    rows.push(row);
  }

  return { columns, rows };
}

/**
 * Auto-detect which column is the region key and which is the metric value.
 */
export function detectKeyAndValueFields(
  columns: string[],
  rows: Record<string, string>[],
): { keyField: string; valueField: string } {
  let keyField = '';
  let valueField = '';
  const sample = rows.slice(0, 5);

  for (const col of columns) {
    if (!keyField) {
      const values = sample.map(r => r[col] ?? '');
      const looksLikeOktmo = values.every(v => /^\d{8}$/.test(v));
      const looksLikeName = values.some(v => /[а-яА-ЯёЁ]/.test(v));
      const looksLikeIso = values.every(v => /^RU-[A-Z]{2,3}$/i.test(v));
      const colLower = col.toLowerCase();
      if (
        looksLikeOktmo ||
        looksLikeName ||
        looksLikeIso ||
        colLower.includes('oktmo') ||
        colLower.includes('region')
      ) {
        keyField = col;
      }
    }
    if (!valueField && keyField !== col) {
      const values = sample.map(r => r[col] ?? '');
      const looksNumeric = values.every(
        v => !isNaN(parseFloat(v)) && isFinite(Number(v)),
      );
      if (looksNumeric) valueField = col;
    }
  }

  return {
    keyField: keyField || columns[0] || '',
    valueField:
      valueField || (columns.length > 1 ? columns[1]! : columns[0] || ''),
  };
}
