import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Global, css } from '@emotion/react';
import {
  ParetoCardRoot,
  Card,
  CardHead,
  CardTitleGroup,
  CardTitle,
  CardSubtitle,
  ControlsRow,
  ChartBox,
  CardFooter,
  SkeletonBlock,
  StateCenter,
  PARETO_CARD_CLASS,
} from './styles/styled';
import { PARETO_KEYFRAMES_CSS } from './styles/keyframes';
import { ParetoCardProps, ComputedParetoItem } from './types';
import { useParetoState } from './hooks/useParetoState';
import { useSupersetWrapper } from './hooks/useSupersetWrapper';
import { computePareto } from './echarts/computePareto';
import { buildEChartsOption } from './echarts/buildOption';
import { getActiveTokens } from './styles/tokens';

import Breadcrumb from './components/Breadcrumb';
import RuntimeControls from './components/RuntimeControls';
import VitalFewSummary from './components/VitalFewSummary';
import ZoneLegend from './components/ZoneLegend';
import HintRow from './components/HintRow';
import EmptyState from './components/EmptyState';
import ChartCanvas, { HoverPayload } from './components/ChartCanvas';
import ChartTooltip from './components/ChartTooltip';
import DrillModal from './components/DrillModal';

/**
 * Custom React.memo comparator — по kpiCard/patterns_superset_viz_plugin.md §1.
 * Superset ChartRenderer передаёт inline function props (formatters), которые
 * меняют ссылку при каждом render. Без этого comparator'а каждый setState тригерит
 * полный re-render всего дерева.
 */
function arePropsEqual(prev: ParetoCardProps, next: ParetoCardProps): boolean {
  const keys = Object.keys(next) as (keyof ParetoCardProps)[];
  for (const key of keys) {
    if (typeof next[key] === 'function') continue;
    if (key === 'theme') continue;
    if (prev[key] !== next[key]) return false;
  }
  return true;
}

function ParetoCardInner(props: ParetoCardProps) {
  const {
    width,
    height,
    items: rawItems,
    headerText,
    subtitleText,
    metricLabel,
    metricUnit,
    metricGenitive,
    defaultThreshold,
    chartAriaLabel,
    breakdownTitle,
    dataState,
    isDarkMode,
  } = props;

  const [state, dispatch] = useParetoState(defaultThreshold);
  const [hover, setHover] = useState<HoverPayload | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Скрывает SliceHeader, делает holder прозрачным, оставляет троеточие через hover.
  useSupersetWrapper(rootRef);

  // Tokens пересчитываются при смене темы — они нужны в hex-виде
  // для ECharts canvas (который не резолвит CSS переменные).
  const tokens = useMemo(() => getActiveTokens(isDarkMode), [isDarkMode]);

  // Есть ли данные для prev overlay.
  const hasPrevData = useMemo(
    () => rawItems.some(i => i.valuePrev != null),
    [rawItems],
  );

  // Computed Pareto + опция ECharts.
  const computed = useMemo(
    () => computePareto(rawItems, state.threshold),
    [rawItems, state.threshold],
  );

  const option = useMemo(
    () => buildEChartsOption({ computed, state, tokens }),
    [computed, state, tokens],
  );

  // Esc — сброс filter'ов (drill закрывает модалка отдельным listener'ом).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (state.drillId) return; // drill закроется сам
      if (state.selectedId || state.zoneFilter) {
        dispatch({ type: 'resetFilters' });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, state.drillId, state.selectedId, state.zoneFilter]);

  // Handlers.
  const onItemClick = useCallback(
    (item: ComputedParetoItem, ctrlKey: boolean) => {
      if (ctrlKey) {
        dispatch({ type: 'openDrill', id: item.id });
      } else {
        dispatch({ type: 'toggleSelected', id: item.id });
      }
    },
    [dispatch],
  );

  const onBackgroundClick = useCallback(() => {
    if (state.selectedId || state.zoneFilter) {
      dispatch({ type: 'resetFilters' });
    }
  }, [dispatch, state.selectedId, state.zoneFilter]);

  const drillItem = state.drillId
    ? computed.items.find(i => i.id === state.drillId) ?? null
    : null;

  // Уникальный id для aria-labelledby — иначе несколько карточек на дашборде
  // будут ссылаться на один и тот же element id.
  const titleId = useId();

  // DS 2.0 canonical: loading имеет свой раздельный return со своим <Card>.
  // При переходе loading → loaded React unmount'ит loading-Card и mount'ит
  // новый → cardInKf animation запускается ровно когда юзер видит реальный
  // контент (см. styled.ts:cardInKf и canonical donut StructureDonut.tsx).
  if (dataState === 'loading') {
    return (
      <ParetoCardRoot
        ref={rootRef}
        width={width}
        height={height}
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={PARETO_CARD_CLASS}
      >
        <Global styles={css`${PARETO_KEYFRAMES_CSS}`} />
        <Card role="region" aria-labelledby={titleId} aria-busy="true">
          <CardHead>
            <CardTitleGroup>
              <CardTitle id={titleId}>{headerText}</CardTitle>
              {subtitleText && <CardSubtitle>{subtitleText}</CardSubtitle>}
            </CardTitleGroup>
          </CardHead>
          <StateCenter role="status" aria-label="Загрузка">
            <SkeletonBlock w="60%" h="18px" />
            <SkeletonBlock w="100%" h="220px" />
          </StateCenter>
        </Card>
      </ParetoCardRoot>
    );
  }

  return (
    <ParetoCardRoot
      ref={rootRef}
      width={width}
      height={height}
      data-theme={isDarkMode ? 'dark' : 'light'}
      className={PARETO_CARD_CLASS}
    >
      <Global styles={css`${PARETO_KEYFRAMES_CSS}`} />
      <Card role="region" aria-labelledby={titleId} data-info-hint-container="">
        <CardHead>
          <CardTitleGroup>
            <CardTitle id={titleId}>{headerText}</CardTitle>
            {subtitleText && <CardSubtitle>{subtitleText}</CardSubtitle>}
            <Breadcrumb
              state={state}
              items={computed.items}
              onReset={() => dispatch({ type: 'resetFilters' })}
            />
          </CardTitleGroup>
          <ControlsRow>
            <RuntimeControls
              state={state}
              hasPrevData={hasPrevData}
              onUnitChange={unit => dispatch({ type: 'setUnit', value: unit })}
              onThresholdChange={v =>
                dispatch({ type: 'setThreshold', value: v })
              }
              onToggleTopA={() => dispatch({ type: 'toggleTopA' })}
              onTogglePrev={() => dispatch({ type: 'togglePrev' })}
            />
          </ControlsRow>
        </CardHead>

        <VitalFewSummary
          vitalFew={computed.vitalFew}
          metricGenitive={metricGenitive}
          metricUnit={metricUnit}
        />

        <ChartBox role="img" aria-label={chartAriaLabel}>
          {dataState !== 'populated' ? (
            <EmptyState state={dataState} />
          ) : (
            <>
              <ChartCanvas
                option={option}
                width={width}
                height={height}
                onHoverItem={setHover}
                onItemClick={onItemClick}
                onBackgroundClick={onBackgroundClick}
              />
              {hover && (
                <ChartTooltip
                  item={hover.item}
                  x={hover.x}
                  y={hover.y}
                  tokens={tokens}
                  metricLabel={metricLabel}
                  metricUnit={metricUnit}
                  showPrev={state.prevOverlay}
                />
              )}
            </>
          )}
        </ChartBox>

        <CardFooter>
          <ZoneLegend
            state={state}
            tokens={tokens}
            metricLabel={metricLabel}
            onToggleZone={zone => dispatch({ type: 'toggleZone', zone })}
            onToggleSeries={kind =>
              dispatch({
                type: 'setSeries',
                kind,
                visible: !state.seriesVisible[kind],
              })
            }
          />
          <HintRow />
        </CardFooter>
      </Card>

      {drillItem && (
        <DrillModal
          item={drillItem}
          computed={computed}
          tokens={tokens}
          metricLabel={metricLabel}
          metricUnit={metricUnit}
          breakdownTitle={breakdownTitle}
          isDarkMode={isDarkMode}
          onClose={() => dispatch({ type: 'closeDrill' })}
        />
      )}
    </ParetoCardRoot>
  );
}

const ParetoCardMemo = React.memo(ParetoCardInner, arePropsEqual);

// Superset ожидает FunctionComponent, не MemoExoticComponent.
// Cast через unknown, чтобы сохранить type-safety для consumer'ов.
const ParetoCard = ParetoCardMemo as unknown as (
  props: ParetoCardProps,
) => JSX.Element;

export default ParetoCard;
