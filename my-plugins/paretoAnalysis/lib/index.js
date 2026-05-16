"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePareto = exports.ParetoCard = exports.SupersetPluginChartParetoAnalysis = void 0;
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "SupersetPluginChartParetoAnalysis", { enumerable: true, get: function () { return __importDefault(plugin_1).default; } });
var ParetoCard_1 = require("./ParetoCard");
Object.defineProperty(exports, "ParetoCard", { enumerable: true, get: function () { return __importDefault(ParetoCard_1).default; } });
var computePareto_1 = require("./echarts/computePareto");
Object.defineProperty(exports, "computePareto", { enumerable: true, get: function () { return computePareto_1.computePareto; } });
//# sourceMappingURL=index.js.map