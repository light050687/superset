/**
 * Mock для @superset-ui/core и @superset-ui/chart-controls —
 * используется в standalone-режиме Storybook (без реального Superset-окружения).
 *
 * Экспортируются только те символы, которые реально используются плагином.
 */

// Emotion styled re-export (как в реальном @superset-ui/core)
export { default as styled } from '@emotion/styled';
export { css } from '@emotion/react';

export const supersetTheme = {} as Record<string, unknown>;

export type QueryFormData = Record<string, unknown>;
export type QueryFormMetric = string | { label?: string; metric_name?: string };
export type AdhocFilter = Record<string, unknown>;

export function getMetricLabel(metric: QueryFormMetric): string {
  if (typeof metric === 'string') return metric;
  return metric?.label ?? '';
}

export function getNumberFormatter(_format?: string) {
  return (n: number) => String(n);
}

export const NumberFormats = { SMART_NUMBER: 'SMART_NUMBER' };

export class ChartProps {
  width: number;
  height: number;
  formData: Record<string, unknown>;
  queriesData: Array<{ data: unknown[] }>;
  theme: Record<string, unknown>;
  hooks: Record<string, unknown>;

  constructor(opts: {
    width: number;
    height: number;
    formData: Record<string, unknown>;
    queriesData: Array<{ data: unknown[] }>;
    theme?: Record<string, unknown>;
    hooks?: Record<string, unknown>;
  }) {
    this.width = opts.width;
    this.height = opts.height;
    this.formData = opts.formData;
    this.queriesData = opts.queriesData;
    this.theme = opts.theme ?? {};
    this.hooks = opts.hooks ?? {};
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

export function buildQueryContext(_formData: unknown, _build: unknown): unknown {
  return { queries: [] };
}

/** CategoricalColorNamespace mock — возвращает scale с getColor, возвращающим undefined */
export const CategoricalColorNamespace = {
  getScale(_scheme?: string) {
    return {
      getColor(_key?: string): string | undefined {
        return undefined;
      },
    };
  },
};

/** SupersetClient — noop, в stories deep-модали в любом случае только мокают данные */
export const SupersetClient = {
  async post<T>(_args: unknown): Promise<{ json: T }> {
    return { json: {} as T };
  },
};

/** t() — identity-функция перевода */
export function t(s: string): string {
  return s;
}

// chart-controls stubs
export const sections = { legacyTimeseriesTime: {} as Record<string, unknown> };
export const sharedControls = {
  groupby: { type: 'SelectControl' },
  metric: { type: 'MetricsControl' },
};
export const D3_FORMAT_OPTIONS: [string, string][] = [];
export type ControlPanelConfig = Record<string, unknown>;
