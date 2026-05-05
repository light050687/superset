/**
 * Jest-mock для `@superset-ui/core` (standalone тестирование плагина).
 *
 * jest.config.js → moduleNameMapper связывает этот файл с `@superset-ui/core`.
 * Экспортирует минимальный набор runtime-значений, которых требуют
 * юнит-тесты на utils (groupRows, resolveColor, buildOption).
 */

export type QueryFormData = Record<string, unknown>;
export type QueryFormMetric = string | { label?: string; metric_name?: string };
export type SupersetTheme = Record<string, unknown>;

export const supersetTheme = {} as Record<string, unknown>;

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

export function buildQueryContext(
  _formData: QueryFormData,
  fn: (baseQueryObject: Record<string, unknown>) => unknown[],
): { queries: unknown[] } {
  return { queries: fn({}) };
}

export function validateNonEmpty(v: unknown): string | false {
  if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
    return 'Поле обязательно';
  }
  return false;
}

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

export class ChartMetadata {
  constructor(_opts: Record<string, unknown>) {}
}

export class ChartPlugin<T = unknown> {
  constructor(_opts: Record<string, unknown>) {}
  configure(_opts: Record<string, unknown>): this {
    return this;
  }
}

// styled — заглушка, возвращает функцию, которая возвращает компонент-идентичность.
// Для unit-тестов utils styled не вызывается, но если попадёт в transitive import —
// не должно ломать.
export const styled = new Proxy(
  {},
  {
    get:
      () =>
      (_strings: TemplateStringsArray, ..._values: unknown[]) =>
      (props: Record<string, unknown>) =>
        props.children ?? null,
  },
);

export function useTheme(): Record<string, unknown> {
  return {};
}

export function t(s: string): string {
  return s;
}
