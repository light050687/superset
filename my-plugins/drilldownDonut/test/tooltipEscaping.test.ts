import { buildOption, DisplayItem } from '../src/utils/buildOption';
import { LIGHT_TOKENS } from '../src/themeTokens';
import { BuildOptionState } from '../src/types';

/**
 * Regression: имя категории/подкатегории — DB-derived (значение измерения из
 * warehouse). ECharts присваивает результат tooltip.formatter в innerHTML, так
 * что неэкранированное имя = DOM/stored-XSS. buildOption ОБЯЗАН пропускать имя
 * через format.encodeHTML (паттерн upstream sanitizeHtml).
 */

// Минимальный валидный state — категории не нужны: tooltip formatter читает
// item напрямую из p.data._item, а не из state.categories.
const baseState: BuildOptionState = {
  categories: [],
  hasSubcategories: false,
  totalRevenue: null,
  unit: 'rub',
  level: 'root',
  drilledId: null,
  selectedIdx: null,
  hidden: new Set(),
  padAngle: 1.5,
  borderRadius: 2,
  showOuterLabelsPct: true,
};

const mkItem = (name: string): DisplayItem => ({
  id: name,
  name,
  color: '#3b8bd9',
  rub: 1000,
  count: 5,
  hidden: false,
  origIdx: 0,
});

/** Собрать option, вытащить tooltip.formatter и отрендерить tooltip для имени. */
function renderTooltip(name: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const option = buildOption({ state: baseState, tokens: LIGHT_TOKENS }) as any;
  const formatter = option.tooltip.formatter as (p: unknown) => string;
  return formatter({ data: { _item: mkItem(name) } });
}

describe('drilldownDonut tooltip — XSS escaping (DB-derived name → innerHTML)', () => {
  it('escapes <b>x</b>: renders as literal text, not live markup', () => {
    const html = renderTooltip('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
  });

  it('neutralizes an <img onerror> injection payload', () => {
    const html = renderTooltip('<img src=x onerror=alert(1)>');
    // никакого живого тега в строке, которую ECharts кладёт в innerHTML
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('escapes a quote-breakout attempt without leaving a raw < tag', () => {
    const html = renderTooltip('"><svg onload=alert(1)>');
    expect(html).not.toContain('<svg');
    expect(html).toContain('&lt;svg');
  });

  it('leaves an ordinary Cyrillic name untouched', () => {
    const html = renderTooltip('Молочные продукты');
    expect(html).toContain('Молочные продукты');
  });
});
