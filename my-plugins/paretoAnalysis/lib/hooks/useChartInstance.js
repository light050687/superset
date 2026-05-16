"use strict";
/**
 * Управляет жизненным циклом ECharts-инстанса: init / resize / dispose.
 * Возвращает ref на div-контейнер и функции для привязки option и listeners.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChartInstance = useChartInstance;
const react_1 = require("react");
const echartsRegistry_1 = require("../echarts/echartsRegistry");
function useChartInstance({ option, width, height, onReady, }) {
    const containerRef = (0, react_1.useRef)(null);
    const chartRef = (0, react_1.useRef)(null);
    const observerRef = (0, react_1.useRef)(null);
    // Init + dispose.
    (0, react_1.useEffect)(() => {
        if (!containerRef.current)
            return undefined;
        const echarts = (0, echartsRegistry_1.registerEchartsOnce)();
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
    (0, react_1.useEffect)(() => {
        chartRef.current?.setOption(option, { notMerge: true });
    }, [option]);
    // Ресайз при смене width/height props от Superset.
    (0, react_1.useEffect)(() => {
        chartRef.current?.resize();
    }, [width, height]);
    const getChart = (0, react_1.useCallback)(() => chartRef.current, []);
    return { containerRef, getChart };
}
//# sourceMappingURL=useChartInstance.js.map