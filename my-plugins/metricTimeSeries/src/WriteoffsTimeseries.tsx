import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsReactProps } from 'echarts-for-react';
import type * as echarts from 'echarts';
import {
  WriteoffsTSProps,
  ChartMode,
  Granularity,
  Unit,
  SeriesHidden,
  Selection,
} from './types';
import { buildOption } from './chart/buildOption';
import {
  Root,
  Card,
  CardHead,
  TitleWrap,
  Title,
  Breadcrumb,
  BreadcrumbBack,
  Controls,
  IconButton,
  UnitToggleGroup,
  UnitButton,
  DropdownRoot,
  DropdownPanel,
  DropdownMenu,
  DropdownItem,
  DropdownItemIcon,
  ChartWrap,
  ChartInner,
  BrushButton,
  CardFooter,
  LegendRow,
  LegendItem,
  LegendMark,
  LegendLabel,
  LegendSeparator,
  FooterSpacer,
  SkeletonWrap,
  SkeletonBlock,
  EmptyStateWrap,
  EmptyStateIcon,
  EmptyStateText,
  ErrorStateWrap,
  ErrorStateIcon,
  ErrorStateText,
  MockBadge,
  PartialBadge,
  StaleBar,
  SrLive,
  KEYFRAMES_CSS,
  CARD_CLASS,
} from './styles';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
import { ruMonthShort } from './utils/dateHelpers';

/* ──────────────── Icons ──────────────── */

const IconLine = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 11 L6 7 L9 9 L14 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconStackBar = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="8" width="3" height="6" rx="0.5" opacity="0.45" />
    <rect x="2" y="4" width="3" height="4" rx="0.5" />
    <rect x="7" y="7" width="3" height="7" rx="0.5" opacity="0.45" />
    <rect x="7" y="3" width="3" height="4" rx="0.5" />
    <rect x="12" y="9" width="3" height="5" rx="0.5" opacity="0.45" />
    <rect x="12" y="5" width="3" height="4" rx="0.5" />
  </svg>
);
const IconStackArea = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path
      d="M2 14 L2 9 L6 6 L10 8 L14 4 L14 14 Z"
      fill="currentColor"
      fillOpacity="0.35"
    />
    <path d="M2 9 L6 6 L10 8 L14 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconYear = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5 L14 6.5" strokeLinecap="round" />
    <text x="8" y="12.2" textAnchor="middle" fontSize="6" fontFamily="monospace" fontWeight="700" stroke="none" fill="currentColor">Y</text>
  </svg>
);
const IconMonth = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5 L14 6.5" strokeLinecap="round" />
    <path d="M5 2 L5 4 M11 2 L11 4" strokeLinecap="round" />
    <rect x="4.5" y="8" width="2.5" height="2.5" fill="currentColor" stroke="none" />
  </svg>
);
const IconWeek = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5 L14 6.5" strokeLinecap="round" />
    <path d="M4 9 L12 9 M4 11.5 L12 11.5" strokeLinecap="round" />
  </svg>
);
const IconDay = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5 L14 6.5" strokeLinecap="round" />
    <circle cx="8" cy="10.3" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
const IconBrush = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2.5" y="2.5" width="11" height="11" rx="1" strokeDasharray="2 2" />
  </svg>
);
const IconClick = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" />
  </svg>
);
const IconBack = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3 L5 8 L10 13" />
  </svg>
);

/* ──────────────── Dropdown ──────────────── */

interface DropdownOpt<T extends string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

function Dropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: DropdownOpt<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close the dropdown and stop propagation so the global ESC handler
        // (which resets the selection) doesn't also fire.
        setOpen(false);
        e.stopPropagation();
      }
    };
    document.addEventListener('mousedown', onDown);
    // Capture phase so we see ESC before the selection-reset handler.
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <DropdownRoot ref={rootRef}>
      <DropdownPanel open={open} data-open={open}>
        <IconButton
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => setOpen(o => !o)}
        >
          {active.icon}
        </IconButton>
        {open && (
          <DropdownMenu role="listbox" aria-label={ariaLabel}>
            {options.map(opt => (
              <DropdownItem
                key={opt.value}
                type="button"
                active={opt.value === value}
                role="option"
                aria-selected={opt.value === value}
                aria-label={opt.label}
                title={opt.label}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <DropdownItemIcon>{opt.icon}</DropdownItemIcon>
              </DropdownItem>
            ))}
          </DropdownMenu>
        )}
      </DropdownPanel>
    </DropdownRoot>
  );
}

/* ──────────────── Legend helpers ──────────────── */

const LineMark = ({ color, type }: { color: string; type: 'solid' | 'dashed' | 'ring' }) => {
  if (type === 'ring') {
    return (
      <svg width="22" height="10">
        <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="1.5" />
        <circle cx="11" cy="5" r="3" fill="var(--s)" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === 'dashed') {
    return (
      <svg width="22" height="10">
        <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="2" strokeDasharray="6 5" />
      </svg>
    );
  }
  return (
    <svg width="22" height="10">
      <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="2.5" />
      <circle cx="11" cy="5" r="2.5" fill={color} />
    </svg>
  );
};

const SquareMark = ({ color }: { color: string }) => (
  <svg width="14" height="10">
    <rect x="0" y="1" width="14" height="8" rx="2" fill={color} />
  </svg>
);

const GhostBarMark = ({ color }: { color: string }) => (
  <svg width="22" height="10">
    <rect
      x="3"
      y="2"
      width="16"
      height="7"
      rx="1"
      fill={color}
      fillOpacity="0.35"
      stroke={color}
      strokeWidth="1"
      strokeDasharray="2 2"
    />
  </svg>
);

/* ──────────────── Main component ──────────────── */

function WriteoffsTimeseriesInner(props: WriteoffsTSProps) {
  const {
    headerText,
    subtitleText,
    dataState,
    errorMessage,
    timePoints,
    categories,
    defaultMode,
    defaultGranularity,
    defaultUnit,
    showBrushButton,
    enableDrillDown,
    formatValue,
    formatAxis,
    formatPct,
    seriesLabels,
    isDarkMode,
    mockModeEnabled,
  } = props;

  const fmtPctAxisFn = useCallback((v: number | null) => {
    if (v == null) return '';
    return `${Math.round(v)}%`;
  }, []);

  // ── UI state ──
  const [mode, setMode] = useState<ChartMode>(defaultMode);
  const [gran, setGran] = useState<Granularity>(defaultGranularity);
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const [hidden, setHidden] = useState<SeriesHidden>({
    fact: false,
    plan: false,
    py: false,
  });
  const [hiddenCats, setHiddenCats] = useState<Record<string, boolean>>({});
  const [selection, setSelection] = useState<Selection>({
    from: 0,
    to: Math.max(0, timePoints.length - 1),
  });
  const [brushActive, setBrushActive] = useState(false);

  // Sync selection when timePoints length changes (e.g. new query)
  useEffect(() => {
    setSelection({ from: 0, to: Math.max(0, timePoints.length - 1) });
  }, [timePoints.length]);

  // Reset UI state when defaults change (controlPanel renderTrigger)
  useEffect(() => setMode(defaultMode), [defaultMode]);
  useEffect(() => setGran(defaultGranularity), [defaultGranularity]);
  useEffect(() => setUnit(defaultUnit), [defaultUnit]);

  const echartsRef = useRef<ReactECharts | null>(null);

  // ── Option build ──
  const { option, buckets } = useMemo(
    () =>
      buildOption({
        timePoints,
        categories,
        mode,
        gran,
        unit,
        hidden,
        hiddenCats,
        selection,
        isDarkMode,
        formatters: {
          formatValue,
          formatAxis,
          formatPct,
          formatPctAxis: fmtPctAxisFn,
        },
        seriesLabels,
      }),
    [
      timePoints,
      categories,
      mode,
      gran,
      unit,
      hidden,
      hiddenCats,
      selection,
      isDarkMode,
      formatValue,
      formatAxis,
      formatPct,
      fmtPctAxisFn,
      seriesLabels,
    ],
  );

  const isFullRange =
    selection.from === 0 && selection.to === timePoints.length - 1;

  // ── Actions ──
  const resetSelection = useCallback(() => {
    setSelection({ from: 0, to: Math.max(0, timePoints.length - 1) });
  }, [timePoints.length]);

  const drillToBucket = useCallback(
    (bucketIdx: number) => {
      if (!enableDrillDown) return;
      const bucket = buckets[bucketIdx];
      if (!bucket) return;
      setSelection({ from: bucket.firstPointIdx, to: bucket.lastPointIdx });
      // Drill one level down the granularity
      if (gran === 'year') setGran('month');
      else if (gran === 'month') setGran('week');
      else if (gran === 'week') setGran('day');
    },
    [buckets, enableDrillDown, gran],
  );

  const drillToRange = useCallback(
    (lo: number, hi: number) => {
      const a = buckets[Math.max(0, Math.min(buckets.length - 1, lo))];
      const b = buckets[Math.max(0, Math.min(buckets.length - 1, hi))];
      if (!a || !b) return;
      setSelection({
        from: Math.min(a.firstPointIdx, b.firstPointIdx),
        to: Math.max(a.lastPointIdx, b.lastPointIdx),
      });
      if (gran === 'year') setGran('month');
      else if (gran === 'month') setGran('week');
      else if (gran === 'week') setGran('day');
    },
    [buckets, gran],
  );

  const toggleBrush = useCallback(() => {
    setBrushActive(active => {
      const chart = echartsRef.current?.getEchartsInstance();
      if (!chart) return active;
      const next = !active;
      if (next) {
        chart.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'brush',
          brushOption: { brushType: 'lineX', brushMode: 'single' },
        });
      } else {
        chart.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'brush',
          brushOption: { brushType: false },
        });
        chart.dispatchAction({ type: 'brush', areas: [] });
      }
      return next;
    });
  }, []);

  // Keyboard: Esc resets selection; Shift activates brush mode while held
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullRange) {
        resetSelection();
      }
      if (e.key === 'Shift' && !brushActive) {
        toggleBrush();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && brushActive) {
        toggleBrush();
      }
    };
    const onBlur = () => {
      if (brushActive) toggleBrush();
    };
    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [brushActive, isFullRange, resetSelection, toggleBrush]);

  // ── ECharts event handlers ──
  type EClickParam = { dataIndex?: number; componentType?: string };
  type EBrushParam = { areas?: Array<{ coordRange?: [number, number] }> };

  const onEvents = useMemo<EChartsReactProps['onEvents']>(
    () => ({
      click: (params: EClickParam) => {
        if (!enableDrillDown) return;
        if (params.componentType !== 'series') return;
        if (params.dataIndex == null) return;
        drillToBucket(params.dataIndex);
      },
      brushEnd: (params: EBrushParam) => {
        const areas = params.areas ?? [];
        if (!areas.length) {
          if (brushActive) toggleBrush();
          return;
        }
        const area = areas[0];
        if (!area?.coordRange) {
          if (brushActive) toggleBrush();
          return;
        }
        const [a, b] = area.coordRange.map(v => Math.round(v));
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        if (lo === hi) drillToBucket(lo);
        else drillToRange(lo, hi);
        if (brushActive) toggleBrush();
      },
    }),
    [brushActive, drillToBucket, drillToRange, enableDrillDown, toggleBrush],
  );

  // ── Legend interactions ──
  const toggleSeries = (k: keyof SeriesHidden) =>
    setHidden(prev => ({ ...prev, [k]: !prev[k] }));
  const toggleCategory = (id: string) =>
    setHiddenCats(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Breadcrumb text ──
  const hierarchyText = useMemo(() => {
    if (gran === 'year') return 'Год';
    if (gran === 'month') return 'Год › Месяц';
    if (gran === 'week') return 'Месяц › Неделя';
    return 'Неделя › День';
  }, [gran]);

  const rangeText = useMemo(() => {
    if (!timePoints.length) return '';
    const a = timePoints[Math.max(0, Math.min(timePoints.length - 1, selection.from))];
    const b = timePoints[Math.max(0, Math.min(timePoints.length - 1, selection.to))];
    if (!a || !b) return '';
    const shortA = `${ruMonthShort(a.month)} ${a.year}`;
    const shortB = `${ruMonthShort(b.month)} ${b.year}`;
    return shortA === shortB ? shortA : `${shortA} – ${shortB}`;
  }, [timePoints, selection.from, selection.to]);

  // ── States ──
  if (dataState === 'loading') {
    return (
      <Root
        width={props.width}
        height={props.height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={CARD_CLASS}
      >
        <style>{KEYFRAMES_CSS}</style>
        <Card data-no-anim="">
          <SkeletonWrap>
            <SkeletonBlock w="40%" h={14} />
            <SkeletonBlock h={200} />
            <SkeletonBlock w="60%" h={12} />
          </SkeletonWrap>
        </Card>
      </Root>
    );
  }

  if (dataState === 'error') {
    return (
      <Root
        width={props.width}
        height={props.height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={CARD_CLASS}
      >
        <style>{KEYFRAMES_CSS}</style>
        <Card data-no-anim="">
          <ErrorStateWrap>
            <ErrorStateIcon />
            <ErrorStateText>{errorMessage || 'Ошибка отображения'}</ErrorStateText>
          </ErrorStateWrap>
        </Card>
      </Root>
    );
  }

  if (dataState === 'empty') {
    return (
      <Root
        width={props.width}
        height={props.height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={CARD_CLASS}
      >
        <style>{KEYFRAMES_CSS}</style>
        <SrLive aria-live="polite">Нет данных</SrLive>
        <Card data-no-anim="">
          <EmptyStateWrap>
            <EmptyStateIcon>—</EmptyStateIcon>
            <EmptyStateText>
              Нет данных за выбранный период.
              <br />
              Проверьте фильтры и временной диапазон.
            </EmptyStateText>
          </EmptyStateWrap>
        </Card>
      </Root>
    );
  }

  const isPartial = dataState === 'partial';
  const isStale = dataState === 'stale';
  const liveMessage =
    dataState === 'populated'
      ? ''
      : isPartial
      ? 'Часть данных недоступна'
      : isStale
      ? 'Данные устарели'
      : '';

  return (
    <Root
      width={props.width}
      height={props.height}
      data-theme={isDarkMode ? 'dark' : 'light'}
        className={CARD_CLASS}
      role="figure"
      aria-label={headerText}
    >
      <style>{KEYFRAMES_CSS}</style>
      <SrLive aria-live="polite" aria-atomic="true">
        {liveMessage}
      </SrLive>
      <Card data-info-hint-container="">
        {isStale && <StaleBar aria-hidden="true" />}
        <CardHead>
          <TitleWrap>
            <Title>
              {headerText}
              {mockModeEnabled && (
                <>
                  {' '}
                  <MockBadge>ТЕСТ</MockBadge>
                </>
              )}
              {isPartial && (
                <>
                  {' '}
                  <PartialBadge title="Часть данных недоступна">Частично</PartialBadge>
                </>
              )}
            </Title>
            <Breadcrumb>
              {!isFullRange && (
                <BreadcrumbBack
                  type="button"
                  aria-label="Вернуться ко всему диапазону"
                  title="Сбросить выделение (Esc)"
                  onClick={resetSelection}
                >
                  ◂
                </BreadcrumbBack>
              )}
              <span>
                {subtitleText && `${subtitleText} · `}
                {hierarchyText} · {rangeText}
              </span>
            </Breadcrumb>
          </TitleWrap>
          <Controls>
            <Dropdown
              ariaLabel="Гранулярность"
              value={gran}
              onChange={(v: Granularity) => {
                setGran(v);
                if (v === 'year' || v === 'month') {
                  if (selection.from === selection.to) {
                    resetSelection();
                  }
                }
              }}
              options={[
                { value: 'year', label: 'По годам', icon: <IconYear /> },
                { value: 'month', label: 'По месяцам', icon: <IconMonth /> },
                { value: 'week', label: 'По неделям', icon: <IconWeek /> },
                { value: 'day', label: 'По дням', icon: <IconDay /> },
              ]}
            />
            <Dropdown
              ariaLabel="Режим"
              value={mode}
              // Dropdown.onChange is typed as (v: string) => void; narrow
              // back to the ChartMode literal union.
              onChange={(v) => setMode(v as ChartMode)}
              options={[
                { value: 'line', label: 'Линия', icon: <IconLine /> },
                { value: 'stack-bar', label: 'Стек-бары', icon: <IconStackBar /> },
                { value: 'stack-area', label: 'Стек-площадь', icon: <IconStackArea /> },
              ]}
            />
            <UnitToggleGroup role="group" aria-label="Единицы измерения">
              <UnitButton
                type="button"
                active={unit === 'rub'}
                aria-pressed={unit === 'rub'}
                onClick={() => setUnit('rub')}
              >
                ₽
              </UnitButton>
              <UnitButton
                type="button"
                active={unit === 'pct'}
                aria-pressed={unit === 'pct'}
                onClick={() => setUnit('pct')}
              >
                %
              </UnitButton>
            </UnitToggleGroup>
            <InfoHintTopRight>
              <InfoHint ariaLabel="Подсказка по управлению">
                {!isFullRange ? (
                  <span className="hi"><kbd>◂</kbd> или <kbd>Esc</kbd> — назад</span>
                ) : (
                  <>
                    {gran === 'month' && enableDrillDown && (
                      <>
                        <span className="hi"><kbd>клик</kbd> — месяц</span>
                        <span className="hi-sep" aria-hidden="true" />
                      </>
                    )}
                    <span className="hi">выделить — диапазон</span>
                  </>
                )}
                <span className="hi-sep" aria-hidden="true" />
                <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
              </InfoHint>
            </InfoHintTopRight>
          </Controls>
        </CardHead>

        <ChartWrap
          drillable={enableDrillDown && gran !== 'day' && mode === 'line' && !hidden.fact}
          brushActive={brushActive}
        >
          <ChartInner>
            <ReactECharts
              ref={(inst: unknown) => {
                echartsRef.current = inst as ReactECharts;
              }}
              option={option as unknown as echarts.EChartsCoreOption}
              notMerge
              lazyUpdate
              onEvents={onEvents}
            />
          </ChartInner>
          {showBrushButton && (
            <BrushButton
              type="button"
              active={brushActive}
              aria-label="Выделить диапазон"
              aria-pressed={brushActive}
              title="Выделить диапазон (Shift-drag)"
              onClick={toggleBrush}
            >
              <IconBrush />
            </BrushButton>
          )}
        </ChartWrap>

        <CardFooter>
          <LegendRow>
            {mode === 'line' ? (
              <>
                <LegendItem
                  type="button"
                  off={hidden.fact}
                  aria-pressed={hidden.fact}
                  onClick={() => toggleSeries('fact')}
                >
                  <LegendMark>
                    <LineMark color="var(--c-sky)" type="solid" />
                  </LegendMark>
                  <LegendLabel>{seriesLabels.fact}</LegendLabel>
                </LegendItem>
                <LegendItem
                  type="button"
                  off={hidden.plan}
                  aria-pressed={hidden.plan}
                  onClick={() => toggleSeries('plan')}
                >
                  <LegendMark>
                    <LineMark color="var(--g600)" type="ring" />
                  </LegendMark>
                  <LegendLabel>{seriesLabels.plan}</LegendLabel>
                </LegendItem>
                <LegendItem
                  type="button"
                  off={hidden.py}
                  aria-pressed={hidden.py}
                  onClick={() => toggleSeries('py')}
                >
                  <LegendMark>
                    <LineMark color="var(--c-violet)" type="dashed" />
                  </LegendMark>
                  <LegendLabel>{seriesLabels.py}</LegendLabel>
                </LegendItem>
              </>
            ) : (
              <>
                {categories.map(cat => (
                  <LegendItem
                    key={cat.id}
                    type="button"
                    off={Boolean(hiddenCats[cat.id])}
                    aria-pressed={Boolean(hiddenCats[cat.id])}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <LegendMark>
                      <SquareMark color={`var(${cat.colorToken})`} />
                    </LegendMark>
                    <LegendLabel>{cat.name}</LegendLabel>
                  </LegendItem>
                ))}
                <LegendSeparator />
                <LegendItem
                  type="button"
                  off={hidden.plan}
                  aria-pressed={hidden.plan}
                  onClick={() => toggleSeries('plan')}
                >
                  <LegendMark>
                    <LineMark color="var(--g600)" type="ring" />
                  </LegendMark>
                  <LegendLabel>{seriesLabels.plan}</LegendLabel>
                </LegendItem>
                <LegendItem
                  type="button"
                  off={hidden.py}
                  aria-pressed={hidden.py}
                  onClick={() => toggleSeries('py')}
                >
                  <LegendMark>
                    {mode === 'stack-bar' ? (
                      <GhostBarMark color="var(--c-violet)" />
                    ) : (
                      <LineMark color="var(--c-violet)" type="dashed" />
                    )}
                  </LegendMark>
                  <LegendLabel>{seriesLabels.py}</LegendLabel>
                </LegendItem>
              </>
            )}
          </LegendRow>

          <FooterSpacer />
        </CardFooter>
      </Card>
    </Root>
  );
}

/** Shallow comparison that skips functions (formatters are recreated each transformProps call). */
function arePropsEqual(prev: WriteoffsTSProps, next: WriteoffsTSProps): boolean {
  const keys = Object.keys(next) as Array<keyof WriteoffsTSProps>;
  for (const key of keys) {
    if (typeof next[key] === 'function') continue;
    if (key === 'theme') continue;
    if (prev[key] !== next[key]) return false;
  }
  return true;
}

const WriteoffsTimeseries = React.memo(WriteoffsTimeseriesInner, arePropsEqual);
export default WriteoffsTimeseries;
