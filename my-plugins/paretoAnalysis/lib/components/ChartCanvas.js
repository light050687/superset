"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChartCanvas;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Обёртка вокруг ECharts-инстанса. Перепроброс hover/click-событий наверх,
 * чтобы родитель рисовал свой DOM tooltip и принимал решения о drill/cross-filter.
 */
const react_1 = require("react");
const styled_1 = require("../styles/styled");
const useChartInstance_1 = require("../hooks/useChartInstance");
function ChartCanvas({ option, width, height, items, onHoverItem, onItemClick, onBackgroundClick, onReady, }) {
    const handleReady = (0, react_1.useCallback)((chart) => {
        onReady?.(chart);
    }, [onReady]);
    const { containerRef, getChart } = (0, useChartInstance_1.useChartInstance)({
        option,
        width,
        height,
        onReady: handleReady,
    });
    (0, react_1.useEffect)(() => {
        const chart = getChart();
        if (!chart)
            return undefined;
        const handleMouseOver = params => {
            const ev = params.event?.event;
            // clientX/Y (viewport-relative) — TooltipEl теперь position:fixed,
            // позиционируется напрямую от viewport, обходит overflow:hidden Card.
            const x = ev?.clientX ?? 0;
            const y = ev?.clientY ?? 0;
            // Hover на series data (bar/line) — item напрямую из data._item.
            const seriesItem = params.data?._item;
            if (seriesItem) {
                onHoverItem?.({ item: seriesItem, x, y });
                return;
            }
            // Hover на axisLabel оси X (triggerEvent:true) — lookup item по name.
            // Только при типе xAxis, иначе любое не-bar событие (например splitLine)
            // могло бы случайно показывать tooltip.
            if (params.componentType === 'xAxis' && items) {
                const name = String(params.value ?? '');
                const axisItem = items.find(it => it.name === name);
                if (axisItem) {
                    onHoverItem?.({ item: axisItem, x, y });
                }
            }
        };
        const handleMouseOut = () => onHoverItem?.(null);
        const handleClick = params => {
            const item = params.data?._item;
            if (!item)
                return;
            const native = params.event?.event;
            const ctrlKey = Boolean(native?.ctrlKey || native?.metaKey);
            onItemClick?.(item, ctrlKey);
        };
        // ECharts API-тип для on-handlers — `(params: unknown) => void`; наш
        // локальный EChartsMouseEvent описывает реально передаваемое поле набором
        // опциональных свойств, поэтому каст безопасен.
        chart.on('mouseover', handleMouseOver);
        chart.on('mouseout', handleMouseOut);
        chart.on('click', handleClick);
        const zr = chart.getZr();
        const zrClickHandler = evt => {
            if (!evt.target)
                onBackgroundClick?.();
        };
        zr.on('click', zrClickHandler);
        return () => {
            chart.off('mouseover', handleMouseOver);
            chart.off('mouseout', handleMouseOut);
            chart.off('click', handleClick);
            zr.off('click', zrClickHandler);
        };
    }, [getChart, items, onHoverItem, onItemClick, onBackgroundClick]);
    return (0, jsx_runtime_1.jsx)(styled_1.ChartCanvasDiv, { ref: containerRef });
}
//# sourceMappingURL=ChartCanvas.js.map