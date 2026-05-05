/**
 * Mock for @superset-ui/core used in standalone Storybook.
 *
 * Only exports what the plugin actually imports:
 * - styled (re-exported from @emotion/styled)
 * - t — i18n passthrough
 * - QueryFormData, QueryFormMetric, supersetTheme (type stubs)
 * - getMetricLabel, getNumberFormatter, NumberFormats, ChartProps (runtime stubs)
 * - ChartPlugin, ChartMetadata (classes used in plugin/index.ts)
 */

// Re-export Emotion's styled — identical to what @superset-ui/core provides
export { default as styled } from '@emotion/styled';

// i18n passthrough — Superset's t() in production
export const t = (s: string): string => s;

// Theme stub (only used for typeof in types.ts)
export const supersetTheme = {} as Record<string, unknown>;

// Type stubs — at runtime these are just shapes, not used in stories
export type QueryFormData = Record<string, unknown>;
export type QueryFormMetric = string | { label?: string; metric_name?: string };
export type SupersetTheme = Record<string, unknown>;

// Runtime stubs used in transformProps (not called in stories directly)
export function getMetricLabel(metric: QueryFormMetric): string {
  if (typeof metric === 'string') return metric;
  return metric?.label ?? '';
}

export function getNumberFormatter(_format?: string): (n: number) => string {
  return (n: number) => String(n);
}

export const NumberFormats = {
  SMART_NUMBER: 'SMART_NUMBER',
};

// SupersetClient stub — plugin does not use it directly, but some utils might import it for types
export const SupersetClient = {
  post: async () => ({ json: {} }),
};

// ChartProps stub (used in tests, not stories — but needed for compilation)
export class ChartProps {
  width: number;
  height: number;
  formData: Record<string, unknown>;
  queriesData: Array<{ data: unknown[] }>;
  theme: Record<string, unknown>;
  datasource?: Record<string, unknown>;

  constructor(opts: {
    width: number;
    height: number;
    formData: Record<string, unknown>;
    queriesData: Array<{ data: unknown[] }>;
    theme?: Record<string, unknown>;
    datasource?: Record<string, unknown>;
  }) {
    this.width = opts.width;
    this.height = opts.height;
    this.formData = opts.formData;
    this.queriesData = opts.queriesData;
    this.theme = opts.theme ?? {};
    this.datasource = opts.datasource;
  }
}

// ChartPlugin + ChartMetadata stubs (used in plugin/index.ts)
export class ChartMetadata {
  constructor(_opts: Record<string, unknown>) {}
}

export class ChartPlugin<T = unknown> {
  constructor(_opts: Record<string, unknown>) {}
  configure(_opts: Record<string, unknown>): this {
    return this;
  }
}

// buildQueryContext stub — plugins call it during buildQuery
export function buildQueryContext(
  _formData: QueryFormData,
  fn: (baseQueryObject: Record<string, unknown>) => unknown[],
): { queries: unknown[] } {
  return { queries: fn({}) };
}

// validateNonEmpty — from @superset-ui/core in production
export function validateNonEmpty(v: unknown): string | false {
  if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
    return 'Поле обязательно';
  }
  return false;
}
