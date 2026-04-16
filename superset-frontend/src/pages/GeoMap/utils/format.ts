/**
 * Format a number for display in legends and tooltips.
 * Values >= 1M -> "1.2M", >= 1K -> "12K", else integer.
 */
export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
