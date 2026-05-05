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
  Hint,
  KEYFRAMES_CSS,
  MockBadge,
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
  computeHero,
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

  /* Card mount animation теперь через emotion keyframes helper в
     styles.ts (см. cardInKf). Это canonical solution от emotion:
     keyframes гарантированно injected в stylesheet ДО commit'а Card.
     React-driven cardMounted+RAF подход больше не нужен. */

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

  /* resizeFromDom — мерим actual DOM container и явно передаём
     width/height в ECharts. props.width/height приходят от Chart.jsx
     и НЕ учитывают Card chrome (header + footer + padding внутри Card),
     поэтому canvas получался больше визуально доступного ChartWrap →
     центр donut'а смещался относительно видимой области.
     Используем clientWidth/clientHeight (= padded content area), а не
     getBoundingClientRect (включает border + padding). */
  const resizeFromDom = (): void => {
    const el = chartDivRef.current;
    const inst = chartRef.current;
    if (!el || !inst) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w > 0 && h > 0) {
      inst.resize({ width: w, height: h });
    }
  };

  // init useEffect: создаёт chart instance + ResizeObserver на ChartCanvas
  // для синхронизации canvas с DOM на каждое изменение размера
  // (window resize, row stretch, drag handle).
  useEffect(() => {
    const el = chartDivRef.current;
    if (!el) return;
    const instance = init(el, null, { renderer: 'canvas' });
    chartRef.current = instance;
    /* Initial resize: defer через RAF чтобы flex layout завершился. */
    requestAnimationFrame(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        instance.resize({ width: w, height: h });
      }
    });
    /* ResizeObserver — следим за изменением размера контейнера
       (row stretch, drag handle, window resize, post-data flex re-layout).
       Debounce через RAF — против drill-down animation jitter
       (memory note: без RO drill анимация была интактной, но canvas
       не перерисовался при изменении размера ChartWrap'а через flex). */
    let debounceId: number | undefined;
    const ro = new ResizeObserver(() => {
      if (debounceId !== undefined) cancelAnimationFrame(debounceId);
      debounceId = requestAnimationFrame(() => {
        const inst = chartRef.current;
        const elNow = chartDivRef.current;
        if (!inst || !elNow) return;
        const w = elNow.clientWidth;
        const h = elNow.clientHeight;
        if (w > 0 && h > 0) {
          inst.resize({ width: w, height: h });
        }
      });
    });
    ro.observe(el);
    return () => {
      if (debounceId !== undefined) cancelAnimationFrame(debounceId);
      ro.disconnect();
      instance.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* useLayoutEffect — re-resize при смене props.width/height (drag-resize
     в edit mode, fullscreen toggle). RO покрывает большинство случаев,
     но useLayoutEffect — fallback гарантия. */
  useLayoutEffect(() => {
    resizeFromDom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // ── ECharts click handlers ──
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

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
      // Ctrl/Cmd + Click — drill down (на root level и если есть children).
      // Обычный click — toggle selection.
      const native = p.event?.event;
      const isCtrl = !!native && (native.ctrlKey || native.metaKey);
      if (isCtrl) {
        const id = p.data?._item?.id;
        if (id != null && level === 'root') {
          const parent = categories.find((c) => c.id === id);
          if (parent && parent.children.length > 0) {
            setLevel('drilled');
            setDrilledId(id);
            setSelectedIdx(null);
            return;
          }
        }
      }
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
  }, [level, categories]);

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
        rubDecimals,
      },
      tokens,
    });
    // 1:1 с Superset host: setOption(opt, true). Без drill detection,
    // без chart.clear, без CSS hacks. ResizeObserver удалён → animation
    // не прерывается layout shifts при React re-render во время drill.
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
    rubDecimals,
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
    categories,
    subtitleText,
    drillUp,
  ]);

  // ── Hint rendering ──
  const hintContent = useMemo(() => {
    if (level === 'drilled') {
      // Drilled: «◂ или Esc — назад» (стрелка в breadcrumb тоже работает).
      // Символ ◂ обёрнут в .hi-arrow — крупнее остального текста (18px).
      return (
        <span className="hi">
          <IconBack />
          <span>
            <span className="hi-arrow" aria-hidden="true">◂</span> или Esc — назад
          </span>
        </span>
      );
    }
    if (selectedIdx != null) {
      // Selected (на root): подсказка про Ctrl+Click для drill'а.
      // Между хинтами — вертикальный разделитель .hi-sep (не SVG).
      return (
        <>
          {hasSubcategories && (
            <>
              <span className="hi">
                <span>Ctrl+Click — вглубь</span>
              </span>
              <span className="hi-sep" aria-hidden="true" />
            </>
          )}
          <span className="hi">
            <IconBack />
            <span>Esc — снять</span>
          </span>
        </>
      );
    }
    // Root, ничего не выбрано: дополнительно про Ctrl+Click.
    return (
      <>
        <span className="hi">
          <IconClick />
          <span>клик — выбрать категорию</span>
        </span>
        {hasSubcategories && (
          <>
            <span className="hi-sep" aria-hidden="true" />
            <span className="hi">
              <span>Ctrl+Click — вглубь</span>
            </span>
          </>
        )}
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
        <Card role="region" aria-labelledby="sd-title-loading" aria-busy="true">
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
      <Card role="region" aria-labelledby="sd-title">
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
          <ChartWrap>
            <ChartCanvas
              ref={chartDivRef}
              role="img"
              aria-label={`Структура потерь: ${fmtRub(
                categories.reduce((s, c) => s + c.rub, 0),
              )} по ${categories.length} категориям`}
            />
            {/* HeroOverlay — HTML overlay поверх canvas с CSS Container
                Queries (--fs-hero/--fs-meta), масштабирование 1-в-1 как
                в KPI scorecard. Заменил ECharts graphic.text который имел
                hardcoded fontSize:24. */}
            <HeroOverlay aria-hidden="true">
              {(() => {
                const h = computeHero({
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
