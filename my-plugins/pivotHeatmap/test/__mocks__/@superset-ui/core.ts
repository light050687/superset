/**
 * Jest mock for @superset-ui/core — используется в unit-тестах transformProps / utils.
 */

export type QueryFormData = Record<string, unknown>;
export type QueryFormMetric = string | { label?: string; metric_name?: string };
export type QueryFormColumn = string | { label?: string; column_name?: string };

export function getMetricLabel(metric: QueryFormMetric): string {
  if (typeof metric === 'string') return metric;
  return metric?.label ?? '';
}

export function getColumnLabel(col: QueryFormColumn): string {
  if (typeof col === 'string') return col;
  return col?.label ?? col?.column_name ?? '';
}

export function ensureIsArray<T>(input: T | T[] | null | undefined): T[] {
  if (input == null) return [];
  return Array.isArray(input) ? input : [input];
}

export function getNumberFormatter(_format?: string) {
  return (n: number) => String(n);
}

export const NumberFormats = { SMART_NUMBER: 'SMART_NUMBER' };
export const t = (s: string): string => s;
export const styled: unknown = undefined;
export const supersetTheme = {};

export function buildQueryContext(
  _formData: QueryFormData,
  builder: (baseQueryObject: Record<string, unknown>) => unknown[],
): { queries: unknown[] } {
  const base = {
    time_range: 'No filter',
    filters: [],
    extras: {},
    applied_time_extras: {},
    annotation_layers: [],
    url_params: {},
    custom_params: {},
  };
  return { queries: builder(base) };
}

export class ChartProps {
  constructor(public opts: unknown) {}
}
export class ChartMetadata {
  constructor(public opts: unknown) {}
}
export class ChartPlugin<T = unknown> {
  constructor(public opts: unknown) {}
  configure(_opts: unknown): this {
    return this;
  }
}

export const SupersetClient = {
  post: (): Promise<unknown> => Promise.resolve({ json: { result: [{ data: [] }] } }),
};
