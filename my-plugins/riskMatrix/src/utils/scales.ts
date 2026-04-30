/**
 * Математические утилиты для scatter-plot:
 *   - pickStep / formatStep — адаптивный шаг для gridlines
 *   - radius — нормализация метрики в радиус пузыря
 *   - hexToRgba — конверсия цвета
 *   - pointInRect / pointInPolygon — hit-test для выделения
 *   - seededRandom / randNormal — синтетика для fallback trend
 */

/** Адаптивный шаг для gridlines: range / targetTicks → 1/2/5/10 */
export function pickStep(range: number, targetTicks: number): number {
  if (range <= 0) return 1;
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3.5) step = 2;
  else if (norm < 7.5) step = 5;
  else step = 10;
  return step * mag;
}

/** Форматирование числа в соответствии с выбранным шагом */
export function formatStep(v: number, step: number): string {
  const decimals = step >= 1 ? 1 : step >= 0.1 ? 2 : 3;
  return v.toFixed(decimals);
}

/**
 * Нормализация метрики size в радиус пузыря (в px).
 *
 * @param rev      текущее значение
 * @param minSize  минимальное значение в выборке (для нормализации)
 * @param maxSize  максимальное значение в выборке
 * @returns        радиус в диапазоне [3, 14]
 */
export function radius(rev: number, minSize: number, maxSize: number): number {
  if (!Number.isFinite(rev) || rev <= 0) return 3;
  const minR = Math.sqrt(Math.max(minSize, 1));
  const maxR = Math.sqrt(Math.max(maxSize, minSize + 1));
  const r = Math.sqrt(rev);
  const t = Math.max(0, Math.min(1, (r - minR) / (maxR - minR)));
  return 3 + t * 11;
}

/** Hex → rgba. Принимает #RRGGBB или короткий #RGB. */
export function hexToRgba(hex: string, a: number): string {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
  if (full.length !== 6) return `rgba(0, 0, 0, ${a})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Rect2D {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function pointInRect(p: Point2D, r: Rect2D): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/** Алгоритм ray-casting */
export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Детерминированный PRNG — для стабильного fallback trend */
export function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Нормальное распределение (Box-Muller) */
export function randNormal(rng: () => number, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
}
