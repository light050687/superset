/**
 * Synthetic losses dataset used in mock mode.
 *
 * Values mirror the prototype `ref/heatmap-pivot-prototype.html`
 * makeData() generator — deterministic pseudo-random numbers seeded
 * by row+col id strings.
 */

import type { AxisItem, BreakdownRow, CellData } from '../types';

export const MOCK_ROWS: AxisItem[] = [
  { id: 'express', name: 'Экспресс' },
  { id: 'supermarket', name: 'Супермаркет' },
  { id: 'minimarket', name: 'Минимаркет' },
  { id: 'near_home', name: 'Магазин у дома' },
  { id: 'superstore', name: 'Суперстор' },
];

export const MOCK_COLS_DIVISION: AxisItem[] = [
  { id: 'd_express', name: 'Экспресс' },
  { id: 'd_ne', name: 'Северо-Восточный дивизион' },
  { id: 'd_mini', name: 'Сеть минимаркетов' },
  { id: 'd_disc', name: 'Сеть Дискаунтеров' },
  { id: 'd_cenohit', name: 'Ценохит' },
  { id: 'd_south', name: 'Южный дивизион' },
  { id: 'd_central', name: 'Центральный дивизион' },
];

export const MOCK_COLS_REGION: AxisItem[] = [
  { id: 'r_far_east', name: 'Дальний Восток' },
  { id: 'r_siberia', name: 'Сибирь' },
  { id: 'r_ural', name: 'Урал' },
  { id: 'r_south', name: 'Юг' },
  { id: 'r_center', name: 'Центр' },
];

export const MOCK_COLS_UPR_REGION: AxisItem[] = [
  { id: 'u_primorye', name: 'Приморье' },
  { id: 'u_amur', name: 'Приамурье' },
  { id: 'u_sakha', name: 'Саха' },
  { id: 'u_buryat', name: 'Забайкалье' },
  { id: 'u_kuzbass', name: 'Кузбасс' },
  { id: 'u_volga', name: 'Поволжье' },
];

export const MOCK_COLS_CITY: AxisItem[] = [
  { id: 'c_vld', name: 'Владивосток' },
  { id: 'c_solk', name: 'Соловей-Ключ' },
  { id: 'c_novy', name: 'Новый' },
  { id: 'c_arsen', name: 'Арсеньев' },
  { id: 'c_ussur', name: 'Уссурийск' },
  { id: 'c_nakhod', name: 'Находка' },
  { id: 'c_amursk', name: 'Амурск' },
  { id: 'c_knaa', name: 'Комсомольск-на-Амуре' },
  { id: 'c_khv', name: 'Хабаровск' },
  { id: 'c_bla', name: 'Благовещенск' },
];

/** Default axis = division (matches prototype default). */
export const MOCK_COLS = MOCK_COLS_DIVISION;

/** Which cells are available per axis (rest are "нет данных") — mirrors prototype.*Avail */
const FORMAT_AVAIL_DIVISION: Record<string, string[]> = {
  express: ['d_express'],
  supermarket: ['d_express', 'd_ne'],
  minimarket: ['d_mini'],
  near_home: ['d_disc', 'd_cenohit'],
  superstore: ['d_ne', 'd_south', 'd_central'],
};

const FORMAT_AVAIL_REGION: Record<string, string[]> = {
  express: ['r_far_east', 'r_siberia'],
  supermarket: ['r_far_east', 'r_ural', 'r_center'],
  minimarket: ['r_siberia', 'r_south'],
  near_home: ['r_far_east', 'r_ural', 'r_center'],
  superstore: ['r_far_east', 'r_south', 'r_center', 'r_ural', 'r_siberia'],
};

const FORMAT_AVAIL_UPR_REGION: Record<string, string[]> = {
  express: ['u_primorye', 'u_amur', 'u_sakha'],
  supermarket: ['u_primorye', 'u_amur', 'u_volga'],
  minimarket: ['u_primorye', 'u_buryat', 'u_kuzbass'],
  near_home: ['u_primorye', 'u_amur', 'u_sakha', 'u_buryat'],
  superstore: ['u_primorye', 'u_amur', 'u_volga', 'u_kuzbass'],
};

const FORMAT_AVAIL_CITY: Record<string, string[]> = {
  express: ['c_vld', 'c_solk', 'c_novy', 'c_arsen', 'c_ussur', 'c_amursk', 'c_knaa', 'c_khv'],
  supermarket: ['c_vld', 'c_arsen', 'c_ussur', 'c_nakhod', 'c_amursk', 'c_knaa', 'c_khv'],
  minimarket: ['c_vld', 'c_khv'],
  near_home: ['c_vld', 'c_novy', 'c_arsen', 'c_ussur', 'c_nakhod', 'c_amursk', 'c_knaa', 'c_khv'],
  superstore: ['c_vld', 'c_ussur', 'c_nakhod', 'c_knaa', 'c_khv'],
};

const AXIS_REGISTRY: Record<string, { cols: AxisItem[]; avail: Record<string, string[]> }> = {
  division: { cols: MOCK_COLS_DIVISION, avail: FORMAT_AVAIL_DIVISION },
  region: { cols: MOCK_COLS_REGION, avail: FORMAT_AVAIL_REGION },
  upr_region: { cols: MOCK_COLS_UPR_REGION, avail: FORMAT_AVAIL_UPR_REGION },
  city: { cols: MOCK_COLS_CITY, avail: FORMAT_AVAIL_CITY },
};

export interface MockAxisDescriptor {
  key: string;
  label: string;
  cols: AxisItem[];
}

export const MOCK_AXES: MockAxisDescriptor[] = [
  { key: 'division', label: 'Дивизион', cols: MOCK_COLS_DIVISION },
  { key: 'region', label: 'Регион', cols: MOCK_COLS_REGION },
  { key: 'upr_region', label: 'Упр. регион', cols: MOCK_COLS_UPR_REGION },
  { key: 'city', label: 'Город', cols: MOCK_COLS_CITY },
];

/** Default fallback for buildMockCells() callers that don't specify axis. */
const FORMAT_AVAIL = FORMAT_AVAIL_DIVISION;

const BASE_BY_FORMAT: Record<string, { revenue: number; planPct: number }> = {
  express: { revenue: 12500, planPct: 2.8 },
  supermarket: { revenue: 28000, planPct: 2.2 },
  minimarket: { revenue: 8400, planPct: 2.5 },
  near_home: { revenue: 6800, planPct: 2.3 },
  superstore: { revenue: 32800, planPct: 1.8 },
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function seededRand(seed: number, lo: number, hi: number): number {
  const x = Math.abs(Math.sin(seed)) * 10000;
  return lo + (x - Math.floor(x)) * (hi - lo);
}

export interface MockCellFull extends CellData {
  breakdown: BreakdownRow[];
}

export function buildMockCells(axisKey: string = 'division'): Map<string, MockCellFull> {
  const cells = new Map<string, MockCellFull>();
  const reg = AXIS_REGISTRY[axisKey] ?? AXIS_REGISTRY.division;
  const cols = reg.cols;
  const avail = reg.avail;

  MOCK_ROWS.forEach((row) => {
    const colIds = avail[row.id] ?? [];
    const base = BASE_BY_FORMAT[row.id];
    if (!base) return;

    cols.forEach((col) => {
      if (!colIds.includes(col.id)) return;

      const seed = hashString(row.id + col.id);
      const ratio = seededRand(seed, 0.7, 1.6);
      const factPct = Number((base.planPct * ratio).toFixed(2));
      const factRub = Number(((base.revenue * factPct) / 100).toFixed(1));
      const planRub = Number(((base.revenue * base.planPct) / 100).toFixed(1));
      const shops = Math.floor(seededRand(seed + 1, 3, 24));

      const weights = [
        seededRand(seed + 3, 0.25, 0.45),
        seededRand(seed + 4, 0.15, 0.3),
        seededRand(seed + 5, 0.12, 0.25),
        seededRand(seed + 6, 0.08, 0.18),
      ];
      const wSum = weights.reduce((a, b) => a + b, 0);
      const breakdown: BreakdownRow[] = [
        { name: 'Списания', value: Number((factRub * (weights[0] / wSum)).toFixed(1)) },
        { name: 'Инвентаризации', value: Number((factRub * (weights[1] / wSum)).toFixed(1)) },
        { name: 'Кражи', value: Number((factRub * (weights[2] / wSum)).toFixed(1)) },
        { name: 'Повреждения', value: Number((factRub * (weights[3] / wSum)).toFixed(1)) },
      ];

      cells.set(`${row.id}|${col.id}`, {
        rowId: row.id,
        colId: col.id,
        value: factRub,
        plan: planRub,
        ratio: planRub !== 0 ? factRub / planRub : null,
        pct: factPct,
        planPct: base.planPct,
        revenue: base.revenue,
        shops,
        breakdown,
      });
    });
  });

  return cells;
}
