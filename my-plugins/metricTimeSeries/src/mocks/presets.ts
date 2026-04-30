import { TimePoint, CategorySeries } from '../types';
import { CATEGORY_PALETTE, OTHER_COLOR } from '../utils/colorPalette';
import { ruMonthName } from '../utils/dateHelpers';

/**
 * Mock preset: 13 months from Apr 2025 to Apr 2026, values in millions of rubles.
 * Raw arrays copied verbatim from `ref/writeoffs-timeseries-prototype.html`.
 *
 * CATEGORIES order (index-aligned with `categoriesM`):
 *   0 — Списания      (--c-sky)
 *   1 — Инвентаризации (--c-tangerine)
 *   2 — Кражи         (--c-fuchsia)
 *   3 — Повреждения   (--c-amber)
 *   4 — Прочее        (--g500)
 */

const RAW_MONTHS: Array<{ y: number; mn: number }> = [
  { y: 2025, mn: 4 },
  { y: 2025, mn: 5 },
  { y: 2025, mn: 6 },
  { y: 2025, mn: 7 },
  { y: 2025, mn: 8 },
  { y: 2025, mn: 9 },
  { y: 2025, mn: 10 },
  { y: 2025, mn: 11 },
  { y: 2025, mn: 12 },
  { y: 2026, mn: 1 },
  { y: 2026, mn: 2 },
  { y: 2026, mn: 3 },
  { y: 2026, mn: 4 },
];

const CATEGORIES_M: number[][] = [
  [28, 53, 55, 60, 58, 52, 48, 47, 59, 60, 50, 60, 25],
  [16, 29, 30, 33, 33, 29, 27, 27, 33, 33, 29, 34, 14],
  [7, 14, 14, 16, 15, 14, 13, 13, 16, 16, 14, 16, 7],
  [6, 12, 13, 13, 15, 12, 11, 11, 13, 14, 12, 14, 6],
  [5, 10, 10, 10, 10, 8, 9, 9, 10, 10, 9, 10, 4],
];

const PLAN_M = [13, 22, 24, 25, 24, 23, 25, 28, 45, 152, 127, 131, 55];
const PY_M = [55, 105, 110, 120, 122, 102, 98, 100, 118, 125, 108, 120, 50];

const CATEGORY_LABELS = [
  'Списания',
  'Инвентаризации',
  'Кражи',
  'Повреждения',
  'Прочее',
] as const;

function computeWeekNumber(y: number, mn: number): number {
  // Cheap approximation — use the first day of the month's ISO week number.
  // Fine for mock data; real data goes through isoWeekNumber from dateHelpers.
  const d = new Date(y, mn - 1, 1);
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

/**
 * Returns a mock dataset matching the shape expected by the main component.
 *
 * The `preset` parameter currently toggles between three thematic variants,
 * but they all share the same shape — only labels/scales differ.
 */
export interface MockDataset {
  label: string;
  timePoints: TimePoint[];
  categories: CategorySeries[];
}

/** Raw mock values are expressed in millions of rubles.
 * Multiply by 1e6 so the runtime formatter (fmtSmart) sees actual ruble amounts
 * and auto-selects the right suffix (тыс / млн / млрд). */
const SCALE_TO_RUB = 1_000_000;

function buildWriteoffsDataset(): MockDataset {
  const timePoints: TimePoint[] = RAW_MONTHS.map((m, i) => {
    const factTotal = CATEGORIES_M.reduce((sum, row) => sum + row[i], 0);
    return {
      t: `${m.y}-${String(m.mn).padStart(2, '0')}-01`,
      year: m.y,
      month: m.mn,
      monthName: ruMonthName(m.mn),
      day: 1,
      week: computeWeekNumber(m.y, m.mn),
      fact: factTotal * SCALE_TO_RUB,
      plan: PLAN_M[i] * SCALE_TO_RUB,
      py: PY_M[i] * SCALE_TO_RUB,
    };
  });

  const categories: CategorySeries[] = CATEGORY_LABELS.map((name, ci) => {
    const values = CATEGORIES_M[ci].map(v => v * SCALE_TO_RUB);
    const total = values.reduce((s, v) => s + (v ?? 0), 0);
    const palette = ci < CATEGORY_PALETTE.length ? CATEGORY_PALETTE[ci] : OTHER_COLOR;
    // Prototype: last category "Прочее" uses grey (--g500)
    const entry = ci === CATEGORY_LABELS.length - 1 ? OTHER_COLOR : palette;
    return {
      id: name,
      name,
      colorLight: entry.colorLight,
      colorDark: entry.colorDark,
      colorToken: entry.colorToken,
      values,
      total,
    };
  });

  return {
    label: 'Списания по категориям',
    timePoints,
    categories,
  };
}

/**
 * Losses preset — smaller scale (thousands of rubles instead of millions)
 * to verify the "тыс" suffix path.
 */
function buildLossesDataset(): MockDataset {
  const base = buildWriteoffsDataset();
  const scale = 0.4; // 40% of writeoffs
  return {
    label: 'Потери по категориям',
    timePoints: base.timePoints.map(p => ({
      ...p,
      fact: p.fact != null ? Math.round(p.fact * scale) : null,
      plan: p.plan != null ? Math.round(p.plan * scale) : null,
      py: p.py != null ? Math.round(p.py * scale) : null,
    })),
    categories: base.categories.map(c => ({
      ...c,
      values: c.values.map(v => (v != null ? Math.round(v * scale) : null)),
      total: Math.round(c.total * scale),
    })),
  };
}

/**
 * Incidents preset — 3 categories only, to verify shorter legend layouts.
 */
function buildIncidentsDataset(): MockDataset {
  const base = buildWriteoffsDataset();
  return {
    label: 'Инциденты по типам',
    timePoints: base.timePoints,
    categories: base.categories.slice(0, 3), // только Списания/Инвентаризации/Кражи
  };
}

export function getPreset(preset?: string): MockDataset {
  switch (preset) {
    case 'losses':
      return buildLossesDataset();
    case 'incidents':
      return buildIncidentsDataset();
    case 'writeoffs':
    default:
      return buildWriteoffsDataset();
  }
}
