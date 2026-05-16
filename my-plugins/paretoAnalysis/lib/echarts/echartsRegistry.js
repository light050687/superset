"use strict";
/**
 * Точечная регистрация модулей ECharts — только те, что реально
 * используются в Pareto Card. Держим в одном месте, чтобы не дублировать
 * `use([])` по файлам и не тянуть в бандл весь echarts.
 *
 * Регистрация идемпотентна: повторные вызовы use() безопасны.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEchartsOnce = registerEchartsOnce;
const echarts = __importStar(require("echarts/core"));
const charts_1 = require("echarts/charts");
const components_1 = require("echarts/components");
const renderers_1 = require("echarts/renderers");
let registered = false;
function registerEchartsOnce() {
    if (registered)
        return echarts;
    echarts.use([
        charts_1.BarChart,
        charts_1.LineChart,
        components_1.GridComponent,
        components_1.MarkLineComponent,
        components_1.MarkAreaComponent,
        components_1.TooltipComponent,
        renderers_1.CanvasRenderer,
    ]);
    registered = true;
    return echarts;
}
//# sourceMappingURL=echartsRegistry.js.map