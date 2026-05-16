/**
 * Управляет жизненным циклом ECharts-инстанса: init / resize / dispose.
 * Возвращает ref на div-контейнер и функции для привязки option и listeners.
 */
import { useEffect, useRef, useCallback } from 'react';
import { registerEchartsOnce } from '../echarts/echartsRegistry';
export function useChartInstance({ option, width, height, onReady, }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const observerRef = useRef(null);
    // Init + dispose.
    useEffect(() => {
        if (!containerRef.current)
            return undefined;
        const echarts = registerEchartsOnce();
        const chart = echarts.init(containerRef.current, undefined, {
            renderer: 'canvas',
        });
        chartRef.current = chart;
        if (typeof ResizeObserver !== 'undefined') {
            observerRef.current = new ResizeObserver(() => {
                chart.resize();
            });
            observerRef.current.observe(containerRef.current);
        }
        onReady?.(chart);
        return () => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            chart.dispose();
            chartRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Реактивное обновление option.
    useEffect(() => {
        chartRef.current?.setOption(option, { notMerge: true });
    }, [option]);
    // Ресайз при смене width/height props от Superset.
    useEffect(() => {
        chartRef.current?.resize();
    }, [width, height]);
    const getChart = useCallback(() => chartRef.current, []);
    return { containerRef, getChart };
}
//# sourceMappingURL=useChartInstance.js.map