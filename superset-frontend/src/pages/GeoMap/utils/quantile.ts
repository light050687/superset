/**
 * Compute quantile breaks for choropleth classification.
 */
export function computeQuantileBreaks(
  values: number[],
  numClasses: number,
): number[] {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const breaks: number[] = [];
  for (let i = 0; i < numClasses; i++) {
    const idx = Math.min(
      Math.floor((i * sorted.length) / numClasses),
      sorted.length - 1,
    );
    breaks.push(sorted[idx]!);
  }
  return breaks;
}

/**
 * Classify a value into a bucket index based on quantile breaks.
 */
export function classifyValue(value: number, breaks: number[]): number {
  const n = breaks.length;
  if (n === 0) return 0;
  for (let i = 0; i < n - 1; i++) {
    if (value <= breaks[i + 1]!) return i;
  }
  return n - 1;
}
