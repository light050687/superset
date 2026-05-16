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
 * Diverging Bars plugin for Apache Superset 6.0+ (internal: VelocityDiverging).
 *
 * Двусторонняя bar-диаграмма для сравнения объектов по темпу изменения метрики
 * между двумя периодами (WoW / 4W / MoM / Кумулятив.), с диверджент-баром,
 * спарклайнами и модалкой детализации. Design System v2.0.
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartDivergingBars().configure({
 *     key: 'ext-velocity-diverging',
 *   })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
class SupersetPluginChartDivergingBars extends core_1.ChartPlugin {
    constructor() {
        super({
            buildQuery: buildQuery_1.default,
            controlPanel: controlPanel_1.default,
            loadChart: () => Promise.resolve().then(() => __importStar(require('../VelocityDiverging'))),
            metadata: new core_1.ChartMetadata({
                name: '[MRTS] Diverging Bars',
                description: (0, core_1.t)('Двусторонняя bar-диаграмма: ранжирование объектов по темпу ' +
                    'между периодами (WoW / 4W / MoM / Кумулят.) с ' +
                    'диверджент-баром, спарклайнами и детализацией. DS 2.0.'),
                thumbnail: thumbnail_png_1.default,
                tags: [
                    'MRTS',
                    (0, core_1.t)('Ranking'),
                    (0, core_1.t)('Diverging'),
                    (0, core_1.t)('Comparison'),
                    (0, core_1.t)('Featured'),
                ],
                category: 'MRTS',
            }),
            transformProps: transformProps_1.default,
        });
    }
}
exports.default = SupersetPluginChartDivergingBars;
//# sourceMappingURL=index.js.map