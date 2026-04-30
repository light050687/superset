import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Обёртка вокруг ECharts-инстанса. Перепроброс hover/click-событий наверх,
 * чтобы родитель рисовал свой DOM tooltip и принимал решения о drill/cross-filter.
 */
import { useEffect, useCallback } from 'react';
import { ChartCanvasDiv } from '../styles/styled';
import { useChartInstance } from '../hooks/useChartInstance';
export default function ChartCanvas({ option, width, height, onHoverItem, onItemClick, onBackgroundClick, onReady, }) {
    const handleReady = useCallback((chart) => {
        onReady?.(chart);
    }, [onReady]);
    const { containerRef, getChart } = useChartInstance({
        option,
        width,
        height,
        onReady: handleReady,
    });
    useEffect(() => {
        const chart = getChart();
        if (!chart)
            return undefined;
        const handleMouseOver = params => {
            const item = params.data?._item;
            if (!item)
                return;
            const ev = params.event?.event;
            const x = ev?.offsetX ?? params.event?.offsetX ?? 0;
            const y = ev?.offsetY ?? params.event?.offsetY ?? 0;
            onHoverItem?.({ item, x, y });
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
    }, [getChart, onHoverItem, onItemClick, onBackgroundClick]);
    return _jsx(ChartCanvasDiv, { ref: containerRef });
}
//# sourceMappingURL=ChartCanvas.js.map