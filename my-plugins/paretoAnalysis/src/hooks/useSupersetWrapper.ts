/**
 * Интеграция кастомного плагина в Superset chart wrapper.
 *
 * По паттерну из patterns_superset_viz_plugin.md §4 и kpiCard:
 *   - скрывает SliceHeader (title / filter-counts), оставляя троеточие ⋮
 *   - делает chart-holder прозрачным без тени/padding
 *   - выводит ⋮-кнопку поверх карточки с hover-fade (через event listeners
 *     с обязательным cleanup во избежание memory leak).
 *
 * Использует `:has()`-CSS селектор для современных браузеров + fallback
 * через прямую DOM-манипуляцию.
 */

import { useEffect, useRef, RefObject } from 'react';

const VIZ_TYPE = 'ext-pareto-card';
const STYLE_ID = 'pareto-card-superset-wrapper-reset';

type ElementWithCleanup = HTMLElement & {
  __paretoDotsCleanup?: () => void;
};

function injectGlobalStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* ── Pareto Card: seamless dashboard integration ── */

    div[data-test-viz-type="${VIZ_TYPE}"],
    div[data-test-viz-type="${VIZ_TYPE}"] .chart-container,
    div[data-test-viz-type="${VIZ_TYPE}"] .dashboard-chart,
    div[data-test-viz-type="${VIZ_TYPE}"] .chart-slice {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
    }

    div[data-test-viz-type="${VIZ_TYPE}"] .filter-counts {
      display: none !important;
    }

    /* DS v2.1 §06: убираем chart-holder dot-menu (3 точки) — для pareto не
       нужен (фильтры/ресайз/детализация уже внутри карточки через ControlsRow
       и InfoHint). Override hover-логики ниже из DOM-fallback. */
    div[data-test-viz-type="${VIZ_TYPE}"] .ant-dropdown-trigger,
    div[data-test-viz-type="${VIZ_TYPE}"] .header-controls,
    .dashboard-component-chart-holder:has(div[data-test-viz-type="${VIZ_TYPE}"]) .header-controls {
      display: none !important;
    }

    div[data-test-viz-type="${VIZ_TYPE}"].chart-slice > div:first-child {
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      overflow: visible !important;
      pointer-events: none !important;
    }

    div[data-test-viz-type="${VIZ_TYPE}"].chart-slice {
      position: relative !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    div[data-test-viz-type="${VIZ_TYPE}"] .dashboard-chart {
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .dashboard-component-chart-holder:has(div[data-test-viz-type="${VIZ_TYPE}"]),
    [data-test="dashboard-component-chart-holder"]:has(div[data-test-viz-type="${VIZ_TYPE}"]) {
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
      padding: 0 !important;
    }

    /* DRAG fix: dashboard drag триггерит React unmount/remount компонента
       → cardInKf animation запускается с opacity:0 → плагин невидим.
       ВАЖНО: .dashboard--editing убран — он убивал animation на ВЕСЬ edit
       mode, не только во время drag. Cascade должен играть и при редактировании. */
    .dragdroppable--dragging div[data-test-viz-type="${VIZ_TYPE}"] .pareto-card,
    .dragdroppable--dragging div[data-test-viz-type="${VIZ_TYPE}"] .pareto-card > * {
      animation: none !important;
      opacity: 1 !important;
    }

    div[data-test-viz-type="${VIZ_TYPE}"] .slice-container {
      padding: 0 !important;
      margin: 0 !important;
    }
    div[data-test-viz-type="${VIZ_TYPE}"] .superset-legacy-chart,
    div[data-test-viz-type="${VIZ_TYPE}"] .chart-container > div {
      width: 100% !important;
      height: 100% !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Монтирует wrapper-hack на корневой div компонента.
 * Вызывать один раз на mount с ref на корневой элемент.
 */
export function useSupersetWrapper(rootRef: RefObject<HTMLElement>): void {
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    if (mountedRef.current) return undefined;
    mountedRef.current = true;

    injectGlobalStyle();

    // Fallback: прямая DOM-манипуляция для браузеров без :has().
    const chartSlice = el.closest('.chart-slice') as HTMLElement | null;
    if (!chartSlice) return undefined;

    chartSlice.style.position = 'relative';
    chartSlice.style.overflow = 'visible';
    chartSlice.style.background = 'transparent';
    chartSlice.style.boxShadow = 'none';
    chartSlice.style.border = 'none';
    chartSlice.style.padding = '0';
    chartSlice.style.margin = '0';

    const header = chartSlice.querySelector(
      ':scope > div:first-child',
    ) as HTMLElement | null;
    let dotsCleanup: (() => void) | null = null;

    if (header) {
      // Найти кнопку троеточия ДО скрытия header (иначе querySelector не доберётся).
      const dotsBtn = header.querySelector(
        '.ant-dropdown-trigger',
      ) as HTMLElement | null;

      header.style.cssText = [
        'height: 0 !important',
        'min-height: 0 !important',
        'max-height: 0 !important',
        'padding: 0 !important',
        'margin: 0 !important',
        'border: none !important',
        'overflow: visible !important',
        'background: transparent !important',
        'position: relative !important',
        'pointer-events: none !important',
      ].join(';');

      Array.from(header.children).forEach(child => {
        (child as HTMLElement).style.cssText =
          'visibility:hidden!important;pointer-events:none!important;height:0!important;overflow:hidden!important;';
      });

      if (dotsBtn) {
        const controlsDiv = dotsBtn.closest(
          '.header-controls',
        ) as HTMLElement | null;
        if (controlsDiv) {
          controlsDiv.style.cssText = [
            'visibility: visible !important',
            'pointer-events: auto !important',
            'position: absolute !important',
            'top: 6px !important',
            'right: -6px !important',
            'z-index: 100 !important',
            'height: auto !important',
            'overflow: visible !important',
            'opacity: 0',
            'transition: opacity 0.15s ease',
          ].join(';');
        }
        dotsBtn.style.cssText +=
          ';visibility:visible!important;pointer-events:auto!important;';

        const hoverTarget = chartSlice;
        const target = controlsDiv || dotsBtn;
        const onEnter = (): void => {
          target.style.opacity = '1';
        };
        const onLeave = (): void => {
          target.style.opacity = '0';
        };
        hoverTarget.addEventListener('mouseenter', onEnter);
        hoverTarget.addEventListener('mouseleave', onLeave);
        dotsCleanup = () => {
          hoverTarget.removeEventListener('mouseenter', onEnter);
          hoverTarget.removeEventListener('mouseleave', onLeave);
        };
        (el as ElementWithCleanup).__paretoDotsCleanup = dotsCleanup;
      }
    }

    // Растянуть wrapper'ы на всю высоту holder'а.
    const dashChart = chartSlice.querySelector(
      '.dashboard-chart',
    ) as HTMLElement | null;
    if (dashChart) {
      dashChart.style.overflow = 'visible';
      dashChart.style.background = 'transparent';
      dashChart.style.height = '100%';
    }

    const chartContainer = chartSlice.querySelector(
      '.chart-container',
    ) as HTMLElement | null;
    if (chartContainer) {
      chartContainer.style.height = '100%';
      let inner: HTMLElement | null = chartContainer;
      for (let depth = 0; depth < 4; depth += 1) {
        const child = inner.querySelector(':scope > div') as HTMLElement | null;
        if (!child) break;
        child.style.height = '100%';
        inner = child;
      }
    }

    const holder = el.closest(
      '.dashboard-component-chart-holder',
    ) as HTMLElement | null;
    if (holder) {
      holder.style.cssText +=
        ';background:transparent!important;box-shadow:none!important;overflow:visible!important;padding:0!important;';
    }

    return () => {
      const elc = el as ElementWithCleanup;
      if (elc.__paretoDotsCleanup) {
        elc.__paretoDotsCleanup();
        elc.__paretoDotsCleanup = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
