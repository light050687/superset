"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@superset-ui/core");
const buildQuery_1 = __importDefault(require("./buildQuery"));
const controlPanel_1 = __importDefault(require("./controlPanel"));
const transformProps_1 = __importDefault(require("./transformProps"));
const thumbnail_png_1 = __importDefault(require("../images/thumbnail.png"));
/**
 * Pareto Analysis plugin для Superset (internal: ParetoCard).
 *
 * Регистрация в MainPreset.js:
 *   new SupersetPluginChartParetoAnalysis().configure({ key: 'ext-pareto-card' })
 * (viz_type ключ 'ext-pareto-card' оставлен ради совместимости с существующими чартами.)
 */
class SupersetPluginChartParetoAnalysis extends core_1.ChartPlugin {
    constructor() {
        super({
            buildQuery: buildQuery_1.default,
            controlPanel: controlPanel_1.default,
            loadChart: () => Promise.resolve().then(() => __importStar(require('../ParetoCard'))),
            metadata: new core_1.ChartMetadata({
                name: '[MRTS] Pareto Analysis',
                description: (0, core_1.t)('Парето-анализ с ABC-зонами, кумулятивной линией и drill-down. ' +
                    'Runtime-контроли порога, Top-A, Пред.период, ₽/% — прямо в чарте. ' +
                    'Design System v2.0.'),
                thumbnail: thumbnail_png_1.default,
                tags: [
                    'MRTS',
                    (0, core_1.t)('Pareto'),
                    (0, core_1.t)('ABC'),
                    (0, core_1.t)('Combo'),
                    (0, core_1.t)('Distribution'),
                    (0, core_1.t)('Featured'),
                ],
                category: 'MRTS',
            }),
            transformProps: transformProps_1.default,
        });
    }
}
exports.default = SupersetPluginChartParetoAnalysis;
//# sourceMappingURL=index.js.map