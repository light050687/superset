import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { init, use, EChartsType } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TooltipComponent,
  GraphicComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LabelLayout } from 'echarts/features';

use([
  PieChart,
  CanvasRenderer,
  TooltipComponent,
  GraphicComponent,
  LegendComponent,
  LabelLayout,
]);

// (Removed `import { Global, css } from '@emotion/react'` —
//  заменили <Global styles={css`…`}/> на <style dangerouslySetInnerHTML/>
//  чтобы keyframes гарантированно были в DOM до первого animation-frame
//  Card. emotion's <Global> вставляет правила в свой managed stylesheet
//  ПОСЛЕ React commit — animation-name к этому моменту уже не находил
//  @keyframes и просто не запускалась.)
import {
  CategoryNode,
  Level,
  StructureDonutProps,
  Unit,
} from './types';
import { LIGHT_TOKENS, DARK_TOKENS, Tokens } from './themeTokens';
import {
  Breadcrumb,
  Card,
  CardHead,
  ChartCanvas,
  ChartWrap,
  Controls,
  EmptyOverlay,
  ErrorOverlay,
  Footer,
  HeaderText,
  HeroLabel,
  HeroOverlay,
  HeroValue,
  KEYFRAMES_CSS,
  MockBadge,
  Legend,
  LegendChip,
  SvgOverlayWrapper,
  PartialChip,
  SkeletonOverlay,
  StaleBadge,
  StructureDonutRoot,
  Title,
  UnitToggle,
} from './styles';
import { InfoHint, type InfoHintHandle, InfoHintTopRight } from './components/InfoHint';
import {
  buildOption,
  computeHero,
  DisplayItem,
  getCurrentItems,
} from './utils/buildOption';
import {
  getCategoriesContentKey,
  getCategoriesIdKey,
} from './utils/categoriesContentKey';
import { fmtRub } from './utils/formatRussian';

/**
 * Главный компонент structure-donut. Воспроизводит прототип
 * `ref/structure-donut-prototype.html` один-в-один, но работает на
 * реальных данных из transformProps и на токенах useTheme().
 *
 * Локальное состояние (не из props):
 *   - unit: rub | pct
 *   - level: root | drilled
 *   - drilledId: id родителя при drilled
 *   - selectedIdx: индекс выбранного сегмента в текущем срезе
 *   - hidden: Set<id> скрытых через легенду
 *
 * Все взаимодействия — ЛОКАЛЬНЫЕ. Они не шлют запросы на сервер.
 */

/**
 * SVG-иконки для блока Hint. Определены как React-компоненты —
 * безопаснее и типобезопаснее, чем raw-HTML. Геометрия идентична прототипу.
 */
function IconClick(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" />
    </svg>
  );
}
function IconDrill(): JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8 L13 8 M9 4 L13 8 L9 12" />
    </svg>
  );
}
function IconBack(): JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 3 L5 8 L10 13" />
    </svg>
  );
}
/* IconInfo вынесен в shared components/InfoHint/. Локально используются
   только IconClick, IconDrill, IconBack для содержимого подсказки. */

/* ──────────────────────────────────────────────────────────────────────
   DonutChartInner — изолированный chart-компонент. Содержит ECharts
   instance + все его useEffect'ы (init/resize/click/setOption).
   Parent StructureDonut рендерит его с `key={`donut-${level}-${drilledId}`}`
   → при смене среза (root↔drilled) React unmount'ит inner + cleanup
   dispose'ит chart instance, затем mount нового → init useEffect
   re-runs → fresh ECharts instance с initial setOption → animationType
   'expansion' гарантированно срабатывает (Plan B из debug doc — после
   3-х неуспешных попыток внутри одного chart instance).
   ────────────────────────────────────────────────────────────────────── */
interface DonutChartInnerProps {
  width: number;
  height: number;
  dataState: StructureDonutProps['dataState'];
  categories: CategoryNode[];
  hasSubcategories: boolean;
  totalRevenue: number;
  padAngle: number;
  borderRadius: number;
  showOuterLabelsPct: boolean;
  rubDecimals: number;
  unit: Unit;
  level: Level;
  drilledId: string | null;
  selectedIdx: number | null;
  hidden: Set<string>;
  tokens: Tokens;
  ariaLabel: string;
  onSelect: React.Dispatch<React.SetStateAction<number | null>>;
  onDrill: (id: string) => void;
}

function DonutChartInner({
  width,
  height,
  dataState,
  categories,
  hasSubcategories,
  totalRevenue,
  padAngle,
  borderRadius,
  showOuterLabelsPct,
  rubDecimals,
  unit,
  level,
  drilledId,
  selectedIdx,
  hidden,
  tokens,
  ariaLabel,
  onSelect,
  onDrill,
}: DonutChartInnerProps): JSX.Element {
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const isFirstSetOptRef = useRef(true);
  // Hash последнего применённого `option` — guard против повторного setOption
  // когда Superset перерендерил родителя (Redux dispatch для favorites/reports/
  // drill_info/etc.) и transformProps пересоздал `categories` reference, но
  // содержимое опции идентично. Без этого ECharts проигрывает pie expansion
  // на каждый родительский re-render. См. docs/debug/donut-animation.md.
  const prevOptionHashRef = useRef<string>('');

  // init useEffect: создаёт chart + ResizeObserver. Запускается раз при
  // mount этого компонента. На смену level/drilledId parent заменит key
  // → component unmount → cleanup dispose → fresh mount.
  useEffect(() => {
    const el = chartDivRef.current;
    if (!el) {
      console.debug('[donut] init: chartDivRef.current is null, skipping');
      return undefined;
    }
    console.debug(
      '[donut] init: mounting ECharts',
      'level=', level,
      'drilledId=', drilledId,
      'el dims=', el.clientWidth, 'x', el.clientHeight,
    );
    const instance = init(el, null, { renderer: 'canvas' });
    chartRef.current = instance;
    /* Debug: log animation lifecycle events. */
    instance.on('finished', () => {
      console.debug('[donut] ECharts animation FINISHED');
    });
    instance.on('rendered', () => {
      console.debug('[donut] ECharts rendered (frame)');
    });
    const w0 = el.clientWidth;
    const h0 = el.clientHeight;
    if (w0 > 0 && h0 > 0) {
      instance.resize({ width: w0, height: h0, silent: true });
      console.debug('[donut] init: resize done', w0, 'x', h0);
    } else {
      console.warn('[donut] init: el has 0 dimensions, animation may not play');
    }
    let isFirstRO = true;
    let prevW = w0;
    let prevH = h0;
    let debounceId: number | undefined;
    const ro = new ResizeObserver(() => {
      if (isFirstRO) {
        isFirstRO = false;
        return;
      }
      if (debounceId !== undefined) cancelAnimationFrame(debounceId);
      debounceId = requestAnimationFrame(() => {
        const inst = chartRef.current;
        const elNow = chartDivRef.current;
        if (!inst || !elNow) return;
        const w = elNow.clientWidth;
        const h = elNow.clientHeight;
        if (w <= 0 || h <= 0) return;
        if (w === prevW && h === prevH) return;
        prevW = w;
        prevH = h;
        inst.resize({ width: w, height: h, silent: true });
      });
    });
    ro.observe(el);

    /* Resilience: Chrome выгружает canvas content при долгом offscreen
       или memory pressure. IntersectionObserver + visibilitychange ловят
       возврат в viewport / tab-active и force-resize'ат canvas. */
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            chartRef.current?.resize({ silent: true });
          }
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(el);
    }
    const onVisibility = (): void => {
      if (!document.hidden) chartRef.current?.resize({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      console.debug('[donut] cleanup: disposing ECharts instance', 'level=', level);
      if (debounceId !== undefined) cancelAnimationFrame(debounceId);
      ro.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      instance.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-resize при drag-resize карточки / fullscreen. silent:true — иначе
  // ECharts проигрывает update animation (~300ms default) на каждый resize,
  // что визуально выглядит как повторная анимация после initial reveal.
  // Plan D предполагает что вся видимая reveal делается через SVG overlay,
  // ECharts canvas — статичный финальный кадр. См. docs/debug/donut-animation.md.
  useLayoutEffect(() => {
    const el = chartDivRef.current;
    const inst = chartRef.current;
    if (!el || !inst) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w > 0 && h > 0) {
      inst.resize({ width: w, height: h, silent: true });
    }
  }, [width, height]);

  // Click handlers: select / drill (Ctrl+Click) / clear (empty space)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return undefined;
    const onClick = (params: unknown): void => {
      const p = params as {
        componentType?: string;
        seriesType?: string;
        data?: { _idx?: number; _item?: { id?: string } };
        event?: { event?: MouseEvent };
      };
      if (p.componentType !== 'series' || p.seriesType !== 'pie') return;
      const idx = p.data?._idx;
      if (idx == null) return;
      const native = p.event?.event;
      const isCtrl = !!native && (native.ctrlKey || native.metaKey);
      if (isCtrl) {
        const id = p.data?._item?.id;
        if (id != null && level === 'root') {
          const parent = categories.find((c) => c.id === id);
          if (parent && parent.children.length > 0) {
            onDrill(id);
            return;
          }
        }
      }
      onSelect((prev) => (prev === idx ? null : idx));
    };
    const onZrClick = (e: { target?: unknown }): void => {
      if (e.target) return;
      onSelect((prev) => (prev != null ? null : prev));
    };
    chart.on('click', onClick);
    const zr = chart.getZr();
    zr.on('click', onZrClick);
    return () => {
      chart.off('click', onClick);
      zr.off('click', onZrClick);
    };
  }, [level, categories, onSelect, onDrill]);

  // setOption при изменении state/props. Первый вызов — notMerge=true.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (
      dataState === 'loading' ||
      dataState === 'empty' ||
      dataState === 'error'
    )
      return;
    const option = buildOption({
      state: {
        categories,
        hasSubcategories,
        totalRevenue,
        unit,
        level,
        drilledId,
        selectedIdx,
        hidden,
        padAngle,
        borderRadius,
        showOuterLabelsPct,
        rubDecimals,
      },
      tokens,
    });
    // Skip duplicate setOption — Superset вызывает transformProps на каждый
    // Redux dispatch (favorites/reports/drill_info/...), при этом `categories`
    // пересоздаётся как новый reference, даже если содержимое идентично.
    // Без этого guard'а ECharts повторно проигрывает pie expansion на каждый
    // родительский re-render. На drill/back DonutChartInner re-mount'ится
    // (key prop в StructureDonut) → ref сбрасывается в '' → первый setOption
    // отрабатывает корректно.
    const optionHash = JSON.stringify(option);
    if (optionHash === prevOptionHashRef.current) {
      return;
    }
    prevOptionHashRef.current = optionHash;
    console.debug(
      '[donut] setOption',
      'isFirst=', isFirstSetOptRef.current,
      'level=', level,
      'drilledId=', drilledId,
      'sectors=', (option as { series?: { data?: unknown[] }[] }).series?.[0]?.data?.length,
    );
    chart.setOption(option, isFirstSetOptRef.current);
    isFirstSetOptRef.current = false;
  }, [
    categories,
    hasSubcategories,
    totalRevenue,
    unit,
    level,
    drilledId,
    selectedIdx,
    hidden,
    padAngle,
    borderRadius,
    showOuterLabelsPct,
    rubDecimals,
    tokens,
    dataState,
  ]);

  /* revealing — true пока идёт SVG reveal animation. ECharts canvas
     hidden through visibility:hidden, после animation flip → ECharts
     visible, SVG unmounts. Это предотвращает double-render (SVG +
     ECharts блюрят друг друга через alpha-blending в fade transition). */
  const [revealing, setRevealing] = useState(true);

  // useCallback со стабильным reference — иначе inline arrow создаётся
  // каждый рендер DonutChartInner, передаётся в RevealSvgOverlay как
  // onComplete, попадает в useEffect deps → useEffect срабатывает заново
  // на каждый родительский re-render, пересоздавая Web Animation API
  // animations и setTimeout. Это и был источник 2-3 повторных
  // rendered/finished events ECharts на SPA-navigation.
  const handleRevealComplete = useCallback(() => setRevealing(false), []);

  return (
    <>
      <ChartCanvas
        ref={chartDivRef}
        role="img"
        aria-label={ariaLabel}
        style={{ visibility: revealing ? 'hidden' : 'visible' }}
      />
      {revealing && (
        <RevealSvgOverlay
          categories={categories}
          hidden={hidden}
          level={level}
          drilledId={drilledId}
          onComplete={handleRevealComplete}
        />
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   RevealSvgOverlay — кастомный SVG overlay с stroke-dasharray animation
   per sector. Plan D из debug doc: ECharts native animation не работает
   стабильно. CSS-уровневые попытки тоже не дают mockup-style.
   Решение: SVG circle для каждого sector с собственной animation через
   Web Animation API → stroke-dasharray grows from 0 to sector length →
   sectors появляются по очереди clockwise (1:1 с ECharts pie
   'expansion'). После animation fade out → ECharts canvas underneath
   visible для tooltip/click/hover.
   ────────────────────────────────────────────────────────────────────── */

interface RevealSvgOverlayProps {
  categories: CategoryNode[];
  hidden: Set<string>;
  level: Level;
  drilledId: string | null;
  onComplete: () => void;
}

function RevealSvgOverlay({
  categories,
  hidden,
  level,
  drilledId,
  onComplete,
}: RevealSvgOverlayProps): JSX.Element | null {
  const svgRef = useRef<SVGSVGElement>(null);

  /* Compute sectors for visible categories in current level. */
  const items = useMemo(() => {
    if (level === 'drilled') {
      const parent = categories.find((c) => c.id === drilledId);
      const children = parent?.children ?? [];
      return children
        .filter((c) => !hidden.has(c.id))
        .map((c) => ({ id: c.id, color: c.color, rub: c.rub }));
    }
    return categories
      .filter((c) => !hidden.has(c.id))
      .map((c) => ({ id: c.id, color: c.color, rub: c.rub }));
  }, [categories, hidden, level, drilledId]);

  /* SVG geometry 1:1 с ECharts radius ['62%','80%']:
     - viewBox 200×200 centered at 100,100
     - outer radius 80 (=80% of viewBox half), inner 62 (=62%)
     - stroke center 71, stroke width 18 */
  const VB = 200;
  const CX = 100;
  const CY = 100;
  const OUTER_R = 80;
  const INNER_R = 62;
  const STROKE_R = (OUTER_R + INNER_R) / 2; // 71
  const STROKE_W = OUTER_R - INNER_R; // 18
  const CIRCUMFERENCE = 2 * Math.PI * STROKE_R;
  /* Gap между sectors (имитирует ECharts padAngle:1.5 + borderWidth:2).
     1.5deg в circumference units: (1.5/360) * C ≈ 1.86. */
  const GAP = (1.5 / 360) * CIRCUMFERENCE;

  const total = items.reduce((s, it) => s + it.rub, 0) || 1;

  const sectors = useMemo(() => {
    let accumulated = 0;
    return items.map((it) => {
      const fullLength = (it.rub / total) * CIRCUMFERENCE;
      const visibleLength = Math.max(0, fullLength - GAP);
      const offset = -accumulated - GAP / 2;
      accumulated += fullLength;
      return { ...it, length: visibleLength, offset };
    });
  }, [items, total, CIRCUMFERENCE, GAP]);

  /* Animation: Web Animation API per circle, stagger 80ms, 0.45s
     cubicOut (1:1 с мокапом ECharts animationDuration:450). После
     completion → onComplete callback → parent flip revealing=false →
     ECharts canvas appears, SVG unmounts (без fade overlap).
     Если sectors пустой — instant onComplete (ECharts должен показаться). */
  useEffect(() => {
    if (sectors.length === 0) {
      onComplete();
      return undefined;
    }
    if (!svgRef.current) return undefined;
    const circles = svgRef.current.querySelectorAll<SVGCircleElement>('.sector');
    const animations: Animation[] = [];
    circles.forEach((circle, i) => {
      const len = parseFloat(circle.dataset.length ?? '0');
      const anim = circle.animate(
        [
          { strokeDasharray: `0 ${CIRCUMFERENCE}` },
          { strokeDasharray: `${len} ${CIRCUMFERENCE - len}` },
        ],
        {
          duration: 450,
          delay: i * 80,
          easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
          fill: 'forwards',
        },
      );
      animations.push(anim);
    });
    /* Total time: last delay + duration. NB: no buffer — instant flip
       к ECharts экономит alpha-blend overlap. */
    const totalMs = (sectors.length - 1) * 80 + 450;
    const timer = window.setTimeout(onComplete, totalMs);
    return () => {
      window.clearTimeout(timer);
      animations.forEach((a) => a.cancel());
    };
  }, [sectors.length, CIRCUMFERENCE, onComplete]);

  if (sectors.length === 0) return null;

  return (
    <SvgOverlayWrapper aria-hidden="true">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {sectors.map((s) => (
            <circle
              key={s.id}
              className="sector"
              cx={CX}
              cy={CY}
              r={STROKE_R}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE_W}
              strokeDasharray={`0 ${CIRCUMFERENCE}`}
              strokeDashoffset={s.offset}
              data-length={s.length}
            />
          ))}
        </g>
      </svg>
    </SvgOverlayWrapper>
  );
}

function StructureDonut(props: StructureDonutProps): JSX.Element {
  const {
    width,
    height,
    headerText,
    subtitleText,
    dataState,
    errorMessage,
    categories,
    hasSubcategories,
    totalRevenue,
    padAngle,
    borderRadius,
    showOuterLabelsPct,
    rubDecimals,
    isDarkMode,
    mockModeEnabled,
  } = props;

  // ── Локальное состояние ──
  const [unit, setUnit] = useState<Unit>('rub');
  const [level, setLevel] = useState<Level>('root');
  const [drilledId, setDrilledId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const infoHintRef = useRef<InfoHintHandle>(null);

  /* Card mount animation теперь через emotion keyframes helper в
     styles.ts (см. cardInKf). Это canonical solution от emotion:
     keyframes гарантированно injected в stylesheet ДО commit'а Card.
     React-driven cardMounted+RAF подход больше не нужен. */

  /* Стабилизация ссылки `categories` между Superset chart re-render'ами.
     transformProps создаёт новый массив каждый раз (groupRows + forEach
     mutating colors) — без memo это идентичный по содержанию, но новый по
     ref массив, который ретриггерит useEffect[deps]=setOption внутри
     DonutChartInner → ECharts проигрывает анимацию повторно. См.
     utils/categoriesContentKey.ts для разделения id-key vs content-key. */
  const categoriesIdKey = useMemo(() => getCategoriesIdKey(categories), [categories]);
  const categoriesContentKey = useMemo(
    () => getCategoriesContentKey(categories),
    [categories],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- зависимость по content-key умышленно
  const stableCategories = useMemo(() => categories, [categoriesContentKey]);

  // Сброс состояния при полной замене данных (другая выборка, другие категории).
  // НЕ дёргать на theme switch / numeric refresh — поэтому id-key, не content-key.
  // setHidden: возвращаем prev если уже пустой (избегаем новой Set-ссылки при первом
  // mount, иначе DonutChartInner получит новый identity hidden и сделает лишний setOption).
  useEffect(() => {
    setLevel('root');
    setDrilledId(null);
    setSelectedIdx(null);
    setHidden(prev => (prev.size === 0 ? prev : new Set()));
  }, [categoriesIdKey]);

  // Токены по теме
  const tokens: Tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;

  // Drill handler — bumped из ECharts click через DonutChartInner callback.
  const handleDrill = useCallback(
    (id: string) => {
      setLevel('drilled');
      setDrilledId(id);
      setSelectedIdx(null);
    },
    [],
  );

  const donutAriaLabel = `Структура потерь: ${fmtRub(
    stableCategories.reduce((s, c) => s + c.rub, 0),
  )} по ${stableCategories.length} категориям`;

  // ── Keyboard: Escape ──
  // InfoHint имеет свой Escape (closeOnEscape), но мы opt-out (closeOnEscape={false})
  // и проксируем через infoHintRef, чтобы сохранить приоритет: hint закрывается
  // раньше чем срабатывает return-to-root / clear-selection логика донат-чарта.
  // Tap-away для tooltip обрабатывается внутри InfoHint, дублировать не нужно.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      if (infoHintRef.current?.isOpen()) {
        infoHintRef.current.close();
        return;
      }
      if (level === 'drilled') {
        setLevel('root');
        setDrilledId(null);
        setSelectedIdx(null);
      } else if (selectedIdx != null) {
        setSelectedIdx(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [level, selectedIdx]);

  // ── Навигация ──
  const drillDown = useCallback((id: string) => {
    setLevel('drilled');
    setDrilledId(id);
    setSelectedIdx(null);
  }, []);
  const drillUp = useCallback(() => {
    setLevel('root');
    setDrilledId(null);
    setSelectedIdx(null);
  }, []);
  const clearSelection = useCallback(() => setSelectedIdx(null), []);

  // ── Текущий срез для легенды (вычисляется до toggleHidden — нужен в его closure) ──
  const currentItems: DisplayItem[] = useMemo(
    () => getCurrentItems({ categories: stableCategories, level, drilledId, hidden }),
    [stableCategories, level, drilledId, hidden],
  );

  const toggleHidden = useCallback(
    (id: string, solo = false): void => {
      // solo=true (Ctrl/Meta+Click) — показать ТОЛЬКО этот пул, остальные hide.
      // Повторный Ctrl+Click на тот же id в solo-state → reset, показать все.
      // Паттерн скопирован из riskMatrix/ScatterRisk.tsx (LegendList onToggle).
      if (solo) {
        const others = currentItems.map((c) => c.id).filter((x) => x !== id);
        const inSoloForThis =
          !hidden.has(id) && others.every((x) => hidden.has(x));
        const next = inSoloForThis ? new Set<string>() : new Set(others);
        setHidden(next);
        // Selected slice мог попасть в hidden — снимаем selection.
        if (!inSoloForThis && selectedIdx != null) {
          const selectedItem = currentItems[selectedIdx];
          if (selectedItem && selectedItem.id !== id) {
            setSelectedIdx(null);
          }
        }
        return;
      }
      // Обычный click — toggle одного пула.
      // Определяем направление (hide vs show) внутри setHidden, чтобы
      // setHidden оперировал свежим prev, а не устаревшим closure `hidden`.
      let isHiding = false;
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          isHiding = false;
        } else {
          next.add(id);
          isHiding = true;
        }
        return next;
      });
      // Если скрываем ранее выбранный — снимаем selection в том же тике.
      if (isHiding && selectedIdx != null) {
        const selectedItem = currentItems[selectedIdx];
        if (selectedItem && selectedItem.id === id) {
          setSelectedIdx(null);
        }
      }
    },
    [currentItems, selectedIdx, hidden],
  );

  // ── Breadcrumb rendering ──
  const breadcrumbContent = useMemo(() => {
    if (level === 'drilled') {
      const parent: CategoryNode | undefined = stableCategories.find((c) => c.id === drilledId);
      return (
        <>
          <button
            type="button"
            className="bc-back"
            onClick={drillUp}
            aria-label="Вернуться к корню"
            title="Назад (Esc)"
          >
            ◂
          </button>
          <span className="bc-cur">
            Структура › <span className="bc-sel">{parent?.name ?? '—'}</span>
          </span>
        </>
      );
    }
    if (selectedIdx == null) {
      return (
        <span className="bc-cur">
          Все категории · {subtitleText}
        </span>
      );
    }
    const sel = currentItems[selectedIdx];
    if (!sel) return <span className="bc-cur">Все категории · {subtitleText}</span>;
    /* Кнопка «→ вглубь» удалена — drill теперь через Ctrl/Cmd + Click на
       сегменте donut'а. Кнопка ◂ тоже убрана — клик в любое пустое
       место donut'а уже снимает selection. */
    return (
      <>
        <span className="bc-cur">Выбрано:</span>
        <span className="bc-sel">{sel.name}</span>
      </>
    );
  }, [
    level,
    drilledId,
    selectedIdx,
    currentItems,
    stableCategories,
    subtitleText,
    drillUp,
  ]);

  // ── Hint rendering ──
  const hintContent = useMemo(() => {
    /* Right-click hint показываем во всех 3 вариантах — это новая
       глобальная фича дашборда (radial menu вместо AntD Dropdown). */
    const rightClickHint = (
      <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
    );
    if (level === 'drilled') {
      // Drilled: «◂ или Esc — назад» (стрелка в breadcrumb тоже работает).
      // Символ ◂ обёрнут в .hi-arrow — крупнее остального текста (18px).
      return (
        <>
          <span className="hi">
            <IconBack />
            <span><kbd>◂</kbd> или <kbd>Esc</kbd> — назад</span>
          </span>
          <span className="hi-sep" aria-hidden="true" />
          {rightClickHint}
        </>
      );
    }
    if (selectedIdx != null) {
      // Selected (на root): подсказка про Ctrl+Click для drill'а.
      // Между хинтами — вертикальный разделитель .hi-sep (не SVG).
      return (
        <>
          {hasSubcategories && (
            <>
              <span className="hi"><kbd>Ctrl</kbd>+<kbd>Click</kbd> — вглубь</span>
              <span className="hi-sep" aria-hidden="true" />
            </>
          )}
          <span className="hi">
            <IconBack />
            <span><kbd>Esc</kbd> — снять</span>
          </span>
          <span className="hi-sep" aria-hidden="true" />
          {rightClickHint}
        </>
      );
    }
    // Root, ничего не выбрано: дополнительно про Ctrl+Click.
    return (
      <>
        <span className="hi">
          <IconClick />
          <span><kbd>клик</kbd> — выбрать категорию</span>
        </span>
        {hasSubcategories && (
          <>
            <span className="hi-sep" aria-hidden="true" />
            <span className="hi"><kbd>Ctrl</kbd>+<kbd>Click</kbd> — вглубь</span>
          </>
        )}
        <span className="hi-sep" aria-hidden="true" />
        {rightClickHint}
      </>
    );
  }, [level, selectedIdx, hasSubcategories]);

  const showChart =
    dataState === 'populated' || dataState === 'partial' || dataState === 'stale';

  /* Loading state — отдельный return со своим Card.
     При переходе loading → loaded React unmount'ит этот Card и
     mount'ит loaded Card в main return ниже. Animation cardInKf
     запускается на mount loaded Card → юзер видит её РОВНО когда
     данные пришли (а не во время скрытого loading state).
     Это 1:1 с подходом scorecard KpiCard.tsx где для каждого
     dataState (loading/error/empty/populated) свой return с своим
     Card — каждое появление контента сопровождается animation. */
  if (dataState === 'loading') {
    return (
      <StructureDonutRoot
        data-theme={isDarkMode ? 'dark' : 'light'}
        width={width}
        height={height}
      >
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <Card role="region" aria-labelledby="sd-title-loading" aria-busy="true" data-no-anim="">
          <CardHead>
            <Title>
              <HeaderText id="sd-title-loading">
                {headerText}
                {mockModeEnabled && <MockBadge>ТЕСТ</MockBadge>}
              </HeaderText>
            </Title>
          </CardHead>
          <SkeletonOverlay role="status" aria-label="Загрузка" />
        </Card>
      </StructureDonutRoot>
    );
  }

  return (
    <StructureDonutRoot
      data-theme={isDarkMode ? 'dark' : 'light'}
      width={width}
      height={height}
    >
      {/* XSS-safe: KEYFRAMES_CSS — compile-time константа. Содержит
          skeleton-pulse и fade-in для overlay'ев. Card-in animation
          через emotion keyframes helper (см. styles.ts cardInKf). */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
      <Card role="region" aria-labelledby="sd-title" data-info-hint-container="">
        <CardHead>
          <Title>
            <HeaderText id="sd-title">
              {headerText}
              {mockModeEnabled && <MockBadge>ТЕСТ</MockBadge>}
            </HeaderText>
            <Breadcrumb>{breadcrumbContent}</Breadcrumb>
            {dataState === 'partial' && (
              <PartialChip role="status" aria-live="polite">
                ⚠ Показаны первые 500 строк
              </PartialChip>
            )}
            {dataState === 'stale' && (
              <StaleBadge role="status" aria-live="polite">
                ↻ Данные из кэша
              </StaleBadge>
            )}
          </Title>
          <Controls>
            <UnitToggle role="radiogroup" aria-label="Единицы измерения">
              <button
                type="button"
                role="radio"
                className={unit === 'rub' ? 'on' : ''}
                aria-checked={unit === 'rub'}
                onClick={() => setUnit('rub')}
                title="В рублях"
              >
                ₽
              </button>
              <button
                type="button"
                role="radio"
                className={unit === 'pct' ? 'on' : ''}
                aria-checked={unit === 'pct'}
                onClick={() => setUnit('pct')}
                title="Процент от оборота"
              >
                %
              </button>
            </UnitToggle>
            <InfoHintTopRight>
              <InfoHint
                ref={infoHintRef}
                closeOnEscape={false}
                ariaLabel="Подсказка по управлению"
              >
                {hintContent}
              </InfoHint>
            </InfoHintTopRight>
          </Controls>
        </CardHead>

        {/* loading state обрабатывается отдельным early-return выше */}
        {dataState === 'empty' && (
          <EmptyOverlay role="status">Нет данных за выбранный период</EmptyOverlay>
        )}
        {dataState === 'error' && (
          <ErrorOverlay role="alert">
            <div>⚠ Ошибка загрузки данных</div>
            <div className="sd-error-sub">{errorMessage ?? 'Проверьте настройки запроса'}</div>
          </ErrorOverlay>
        )}

        {showChart && (
          /* key на ChartWrap → React unmount'ит весь ChartWrap (canvas +
             hero) на drill/back → donutRevealKf CSS animation re-fires
             на mount. Это Plan C из debug doc — guaranteed visible
             expansion animation вместо нестабильной ECharts internal. */
          <ChartWrap key={`chart-${level}-${drilledId ?? 'root'}`}>
            {/* DonutChartInner также с key — на unmount внутри
                ChartWrap dispose chart instance correctly. */}
            <DonutChartInner
              key={`donut-${level}-${drilledId ?? 'root'}`}
              width={width}
              height={height}
              dataState={dataState}
              categories={stableCategories}
              hasSubcategories={hasSubcategories}
              totalRevenue={totalRevenue}
              padAngle={padAngle}
              borderRadius={borderRadius}
              showOuterLabelsPct={showOuterLabelsPct}
              rubDecimals={rubDecimals}
              unit={unit}
              level={level}
              drilledId={drilledId}
              selectedIdx={selectedIdx}
              hidden={hidden}
              tokens={tokens}
              ariaLabel={donutAriaLabel}
              onSelect={setSelectedIdx}
              onDrill={handleDrill}
            />
            {/* HeroOverlay — HTML overlay поверх canvas с CSS Container
                Queries (--fs-hero/--fs-meta), масштабирование 1-в-1 как
                в KPI scorecard. Заменил ECharts graphic.text который имел
                hardcoded fontSize:24. */}
            <HeroOverlay aria-hidden="true">
              {(() => {
                const h = computeHero({
                  categories: stableCategories,
                  hasSubcategories,
                  totalRevenue,
                  unit,
                  level,
                  drilledId,
                  selectedIdx,
                  hidden,
                  padAngle,
                  borderRadius,
                  showOuterLabelsPct,
                  rubDecimals,
                });
                return (
                  <>
                    <HeroValue>{h.value}</HeroValue>
                    <HeroLabel>{h.label}</HeroLabel>
                  </>
                );
              })()}
            </HeroOverlay>
          </ChartWrap>
        )}

        <Footer>
          <Legend role="group" aria-label="Легенда">
            {currentItems.map((it) => (
              <LegendChip
                key={it.id}
                className={hidden.has(it.id) ? 'off' : ''}
                tabIndex={0}
                role="button"
                aria-pressed={!hidden.has(it.id)}
                aria-label={`${hidden.has(it.id) ? 'Показать' : 'Скрыть'} ${it.name}${
                  currentItems.length > 1 ? ' (Ctrl+Click — оставить только этот)' : ''
                }`}
                onClick={(e) => toggleHidden(it.id, e.ctrlKey || e.metaKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleHidden(it.id, e.ctrlKey || e.metaKey);
                  }
                }}
              >
                <span className="lg-dot" style={{ background: it.color }} />
                <span className="lg-l">{it.name}</span>
              </LegendChip>
            ))}
          </Legend>
        </Footer>
      </Card>
    </StructureDonutRoot>
  );
}

export default StructureDonut;
