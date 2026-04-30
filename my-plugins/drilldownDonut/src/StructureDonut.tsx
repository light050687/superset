import {
  useCallback,
  useEffect,
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

// Регистрация нужных ECharts-компонентов (идемпотентно —
// host Superset уже делает use(...) со всеми компонентами, но
// для standalone Storybook нужно продублировать).
use([
  PieChart,
  CanvasRenderer,
  TooltipComponent,
  GraphicComponent,
  LegendComponent,
  LabelLayout,
]);
import { Global, css } from '@emotion/react';
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
  Hint,
  KEYFRAMES_CSS,
  Legend,
  LegendChip,
  PartialChip,
  SkeletonOverlay,
  StaleBadge,
  StructureDonutRoot,
  Title,
  UnitToggle,
} from './styles';
import {
  buildOption,
  DisplayItem,
  getCurrentItems,
} from './utils/buildOption';
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
    isDarkMode,
  } = props;

  // ── Локальное состояние ──
  const [unit, setUnit] = useState<Unit>('rub');
  const [level, setLevel] = useState<Level>('root');
  const [drilledId, setDrilledId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Сброс состояния при полной замене данных (другая выборка, другие категории)
  const categoriesKey = useMemo(
    () => categories.map((c) => c.id).join('|'),
    [categories],
  );
  useEffect(() => {
    setLevel('root');
    setDrilledId(null);
    setSelectedIdx(null);
    setHidden(new Set());
  }, [categoriesKey]);

  // Токены по теме
  const tokens: Tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;

  // ── ECharts init + resize ──
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    const el = chartDivRef.current;
    if (!el) return;
    const instance = init(el);
    chartRef.current = instance;

    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      instance.dispose();
      chartRef.current = null;
    };
  }, []);

  // Resize при изменении контейнера (width/height от Superset)
  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  // ── ECharts click handlers ──
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const onClick = (params: unknown): void => {
      const p = params as { componentType?: string; seriesType?: string; data?: { _idx?: number } };
      if (p.componentType !== 'series' || p.seriesType !== 'pie') return;
      const idx = p.data?._idx;
      if (idx == null) return;
      setSelectedIdx((prev) => (prev === idx ? null : idx));
    };

    // Клик по пустому месту внутри donut
    const onZrClick = (e: { target?: unknown }): void => {
      if (e.target) return;
      setSelectedIdx((prev) => (prev != null ? null : prev));
    };

    chart.on('click', onClick);
    const zr = chart.getZr();
    zr.on('click', onZrClick);

    return () => {
      chart.off('click', onClick);
      zr.off('click', onZrClick);
    };
  }, []);

  // ── setOption при изменении любого state/prop ──
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (dataState === 'loading' || dataState === 'empty' || dataState === 'error') return;
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
      },
      tokens,
    });
    chart.setOption(option, true);
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
    tokens,
    dataState,
  ]);

  // ── Keyboard: Escape ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
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
    () => getCurrentItems({ categories, level, drilledId, hidden }),
    [categories, level, drilledId, hidden],
  );

  const toggleHidden = useCallback(
    (id: string): void => {
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
    [currentItems, selectedIdx],
  );

  // ── Breadcrumb rendering ──
  const breadcrumbContent = useMemo(() => {
    if (level === 'drilled') {
      const parent: CategoryNode | undefined = categories.find((c) => c.id === drilledId);
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
    const canDrill = hasSubcategories && level === 'root';
    const parent = categories.find((c) => c.id === sel.id);
    const hasChildren = !!parent && parent.children.length > 0;
    return (
      <>
        <span className="bc-cur">Выбрано:</span>
        <span className="bc-sel">{sel.name}</span>
        {canDrill && hasChildren && (
          <button
            type="button"
            className="bc-fwd"
            onClick={() => drillDown(sel.id)}
            aria-label="Раскрыть подкатегории"
            title="Вглубь"
          >
            → вглубь
          </button>
        )}
        <button
          type="button"
          className="bc-back"
          onClick={clearSelection}
          aria-label="Снять выделение"
          title="Снять (Esc)"
        >
          ◂
        </button>
      </>
    );
  }, [
    level,
    drilledId,
    selectedIdx,
    currentItems,
    hasSubcategories,
    categories,
    subtitleText,
    drillDown,
    drillUp,
    clearSelection,
  ]);

  // ── Hint rendering ──
  const hintContent = useMemo(() => {
    if (level === 'drilled') {
      return (
        <span className="hi">
          <IconBack />
          <span>Esc — назад</span>
        </span>
      );
    }
    if (selectedIdx != null) {
      return (
        <>
          {hasSubcategories && (
            <span className="hi">
              <IconDrill />
              <span>→ вглубь — подкатегории</span>
            </span>
          )}
          <span className="hi">
            <IconBack />
            <span>Esc — снять</span>
          </span>
        </>
      );
    }
    return (
      <span className="hi">
        <IconClick />
        <span>клик — выбрать категорию</span>
      </span>
    );
  }, [level, selectedIdx, hasSubcategories]);

  const showChart =
    dataState === 'populated' || dataState === 'partial' || dataState === 'stale';

  return (
    <StructureDonutRoot
      data-theme={isDarkMode ? 'dark' : 'light'}
      width={width}
      height={height}
    >
      <Global styles={css`${KEYFRAMES_CSS}`} />
      <Card role="region" aria-labelledby="sd-title">
        <CardHead>
          <Title>
            <HeaderText id="sd-title">{headerText}</HeaderText>
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
          </Controls>
        </CardHead>

        {dataState === 'loading' && <SkeletonOverlay role="status" aria-label="Загрузка" />}
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
          <ChartWrap>
            <ChartCanvas
              ref={chartDivRef}
              role="img"
              aria-label={`Структура потерь: ${fmtRub(
                categories.reduce((s, c) => s + c.rub, 0),
              )} по ${categories.length} категориям`}
            />
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
                aria-label={`${hidden.has(it.id) ? 'Показать' : 'Скрыть'} ${it.name}`}
                onClick={() => toggleHidden(it.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleHidden(it.id);
                  }
                }}
              >
                <span className="lg-dot" style={{ background: it.color }} />
                <span className="lg-l">{it.name}</span>
              </LegendChip>
            ))}
          </Legend>
          <Hint>{hintContent}</Hint>
        </Footer>
      </Card>
    </StructureDonutRoot>
  );
}

export default StructureDonut;
