/**
 * Точечная регистрация модулей ECharts — только те, что реально
 * используются в Pareto Card. Держим в одном месте, чтобы не дублировать
 * `use([])` по файлам и не тянуть в бандл весь echarts.
 *
 * Регистрация идемпотентна: повторные вызовы use() безопасны.
 */

import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

let registered = false;

export function registerEchartsOnce(): typeof echarts {
  if (registered) return echarts;
  echarts.use([
    BarChart,
    LineChart,
    GridComponent,
    MarkLineComponent,
    MarkAreaComponent,
    TooltipComponent,
    CanvasRenderer,
  ]);
  registered = true;
  return echarts;
}
