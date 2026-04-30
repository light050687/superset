"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorFromKey = colorFromKey;
/**
 * Берёт цвет из DS-токенов по ключу.
 * Ключи соответствуют полям DsTokens (sky, tangerine, up, g500 и т.д.).
 */
function colorFromKey(key, tokens) {
    const val = tokens[key];
    return val ?? tokens.g500;
}
//# sourceMappingURL=colorFromKey.js.map