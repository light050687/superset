/**
 * Точечная регистрация модулей ECharts — только те, что реально
 * используются в Pareto Card. Держим в одном месте, чтобы не дублировать
 * `use([])` по файлам и не тянуть в бандл весь echarts.
 *
 * Регистрация идемпотентна: повторные вызовы use() безопасны.
 */
import * as echarts from 'echarts/core';
export declare function registerEchartsOnce(): typeof echarts;
//# sourceMappingURL=echartsRegistry.d.ts.map