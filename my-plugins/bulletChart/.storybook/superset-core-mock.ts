/**
 * Mock for @superset-ui/core used in standalone Storybook.
 *
 * Only exports what the plugin actually imports:
 * - styled (re-exported from @emotion/styled)
 * - QueryFormData, QueryFormMetric, supersetTheme (type stubs)
 * - getMetricLabel, getNumberFormatter, ChartProps, ChartPlugin, ChartMetadata (runtime stubs)
 */

export { default as styled } from '@emotion/styled';

export const supersetTheme = {} as Record<string, unknown>;

export type QueryFormData = Record<string, unknown>;
export type QueryFormMetric = string | { label?: string; metric_name?: string };

export function getMetricLabel(metric: QueryFormMetric): string {
  if (typeof metric === 'string') return metric;
  return metric?.label ?? '';
}

export function getNumberFormatter(_format?: string) {
  return (n: number) => String(n);
}

export const NumberFormats = {
  SMART_NUMBER: 'SMART_NUMBER',
};

// SupersetClient — для detailApi в модали
export const SupersetClient = {
  post: async (_opts: Record<string, unknown>) => ({ json: { result: [{ data: [] }] } }),
};

export function buildQueryContext(
  _formData: Record<string, unknown>,
  _builder: (baseQueryObject: Record<string, unknown>) => unknown[],
): unknown {
  return {};
}

export function t(s: string): string {
  return s;
}

export class ChartProps {
  width: number;
  height: number;
  formData: Record<string, unknown>;
  queriesData: Array<{ data: unknown[] }>;
  theme: Record<string, unknown>;

  constructor(opts: {
    width: number;
    height: number;
    formData: Record<string, unknown>;
    queriesData: Array<{ data: unknown[] }>;
    theme?: Record<string, unknown>;
  }) {
    this.width = opts.width;
    this.height = opts.height;
    this.formData = opts.formData;
    this.queriesData = opts.queriesData;
    this.theme = opts.theme ?? {};
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
