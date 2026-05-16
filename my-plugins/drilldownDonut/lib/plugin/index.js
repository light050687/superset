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
 * Drill-down Donut plugin для Superset (internal: StructureDonut).
 *
 * Регистрация в MainPreset.js:
 *   new SupersetPluginChartDrilldownDonut().configure({ key: 'ext-structure-donut' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
class SupersetPluginChartDrilldownDonut extends core_1.ChartPlugin {
    constructor() {
        super({
            buildQuery: buildQuery_1.default,
            controlPanel: controlPanel_1.default,
            loadChart: () => Promise.resolve().then(() => __importStar(require('../StructureDonut'))),
            metadata: new core_1.ChartMetadata({
                name: '[MRTS] Drill-down Donut',
                description: 'Двухуровневая кольцевая диаграмма с drill-down, переключателем ₽/%, ' +
                    'hero-числом в центре и кастомной легендой. Design System v2.0.',
                thumbnail: thumbnail_png_1.default,
                tags: ['MRTS', 'Donut', 'Pie', 'Drill-down', 'Structure', 'Featured'],
                category: 'MRTS',
            }),
            transformProps: transformProps_1.default,
        });
    }
}
exports.default = SupersetPluginChartDrilldownDonut;
//# sourceMappingURL=index.js.map