import { ChartProps } from '@superset-ui/core';
import type { VelocityDivergingFormData, VelocityDivergingProps } from '../types';
/**
 * Расширенная форма ChartProps — queriesData типизируется на уровне плагина,
 * т.к. @superset-ui/core по-разному типизирует его в разных минорных версиях.
 */
type VelocityChartProps = ChartProps<VelocityDivergingFormData> & {
    queriesData?: Array<{
        data?: Record<string, unknown>[];
        error?: string | null;
        errorMessage?: string | null;
    }>;
};
export default function transformProps(chartProps: VelocityChartProps): VelocityDivergingProps;
export {};
//# sourceMappingURL=transformProps.d.ts.map