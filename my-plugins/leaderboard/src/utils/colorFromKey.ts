import type { DsTokens } from '../themeTokens';

/**
 * Берёт цвет из DS-токенов по ключу.
 * Ключи соответствуют полям DsTokens (sky, tangerine, up, g500 и т.д.).
 */
export function colorFromKey(key: string, tokens: DsTokens): string {
  const val = (tokens as unknown as Record<string, string>)[key];
  return val ?? tokens.g500;
}
