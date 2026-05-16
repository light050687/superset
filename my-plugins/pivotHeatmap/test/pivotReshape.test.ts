import { reshapePivot } from '../src/utils/pivotReshape';

describe('reshapePivot', () => {
  test('groups flat rows into cells Map with "row|col" keys', () => {
    const result = reshapePivot({
      data: [
        { format: 'A', div: 'X', fact: 100, plan: 80, revenue: 1000 },
        { format: 'A', div: 'Y', fact: 50, plan: 60, revenue: 800 },
        { format: 'B', div: 'X', fact: 200, plan: 200, revenue: 2000 },
      ],
      rowAxisCol: 'format',
      colAxisCol: 'div',
      valueKey: 'fact',
      planKey: 'plan',
      revenueKey: 'revenue',
      shopsKey: null,
    });

    expect(result.cells.size).toBe(3);
    expect(result.rows).toEqual([
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
    ]);
    expect(result.cols).toEqual([
      { id: 'X', name: 'X' },
      { id: 'Y', name: 'Y' },
    ]);

    const ax = result.cells.get('A|X');
    expect(ax?.value).toBe(100);
    expect(ax?.plan).toBe(80);
    expect(ax?.ratio).toBe(100 / 80);
    expect(ax?.pct).toBe(10); // 100/1000*100
  });

  test('row/col totals match sum of cells', () => {
    const result = reshapePivot({
      data: [
        { r: 'A', c: 'X', v: 10, p: 10 },
        { r: 'A', c: 'Y', v: 20, p: 20 },
        { r: 'B', c: 'X', v: 30, p: 20 },
      ],
      rowAxisCol: 'r',
      colAxisCol: 'c',
      valueKey: 'v',
      planKey: 'p',
      revenueKey: null,
      shopsKey: null,
    });

    expect(result.rowTotals.get('A')?.fact).toBe(30);
    expect(result.rowTotals.get('A')?.plan).toBe(30);
    expect(result.rowTotals.get('B')?.fact).toBe(30);
    expect(result.colTotals.get('X')?.fact).toBe(40);
    expect(result.colTotals.get('Y')?.fact).toBe(20);
    expect(result.grandTotal?.fact).toBe(60);
    expect(result.grandTotal?.ratio).toBe(60 / 50);
  });

  test('handles missing plan/revenue gracefully', () => {
    const result = reshapePivot({
      data: [{ r: 'A', c: 'X', v: 100 }],
      rowAxisCol: 'r',
      colAxisCol: 'c',
      valueKey: 'v',
      planKey: null,
      revenueKey: null,
      shopsKey: null,
    });
    const cell = result.cells.get('A|X');
    expect(cell?.value).toBe(100);
    expect(cell?.ratio).toBeNull();
    expect(cell?.pct).toBeNull();
  });

  test('empty data yields empty result', () => {
    const result = reshapePivot({
      data: [],
      rowAxisCol: 'r',
      colAxisCol: 'c',
      valueKey: 'v',
      planKey: null,
      revenueKey: null,
      shopsKey: null,
    });
    expect(result.cells.size).toBe(0);
    expect(result.grandTotal).toBeNull();
  });

  test('ignores rows with missing axis values', () => {
    const result = reshapePivot({
      data: [
        { r: null, c: 'X', v: 10 },
        { r: 'A', c: null, v: 20 },
        { r: 'A', c: 'X', v: 30 },
      ],
      rowAxisCol: 'r',
      colAxisCol: 'c',
      valueKey: 'v',
      planKey: null,
      revenueKey: null,
      shopsKey: null,
    });
    expect(result.cells.size).toBe(1);
  });
});
