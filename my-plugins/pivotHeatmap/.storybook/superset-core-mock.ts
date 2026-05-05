/**
 * Mock for @superset-ui/core used in standalone Storybook.
 *
 * Mirror of kpiCard's .storybook/superset-core-mock.ts with identical semantics.
 */

export { default as styled } from '@emotion/styled';

export const supersetTheme = {} as Record<string, unknown>;

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

export const NumberFormats = {
  SMART_NUMBER: 'SMART_NUMBER',
};

export const t = (s: string): string => s;

export function buildQueryContext(
  formData: Record<string, unknown>,
  _opts: unknown,
): Record<string, unknown> {
  return { formData };
}

export class ChartProps {
  width: number;
  height: number;
  formData: Record<string, unknown>;
  queriesData: Array<{ data: unknown[] }>;
  theme: Record<string, unknown>;
  hooks: Record<string, unknown>;
  datasource: Record<string, unknown>;

  constructor(opts: {
    width: number;
    height: number;
    formData: Record<string, unknown>;
    queriesData: Array<{ data: unknown[] }>;
    theme?: Record<string, unknown>;
    hooks?: Record<string, unknown>;
    datasource?: Record<string, unknown>;
  }) {
    this.width = opts.width;
    this.height = opts.height;
    this.formData = opts.formData;
    this.queriesData = opts.queriesData;
    this.theme = opts.theme ?? {};
    this.hooks = opts.hooks ?? {};
    this.datasource = opts.datasource ?? {};
  }
}

export class ChartMetadata {
  constructor(_opts: Record<string, unknown>) {}
}

export class ChartPlugin<T = unknown> {
  constructor(_opts: Record<string, unknown>) {}
  configure(_opts: Record<string, unknown>): this {
    return this;
  }
}

export const SupersetClient = {
  post: (_opts: unknown): Promise<{ json: { result: Array<{ data: unknown[] }> } }> =>
    Promise.resolve({ json: { result: [{ data: [] }] } }),
};
