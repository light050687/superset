import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { styled } from '@superset-ui/core';
import {
  ScatterRiskProps,
  StorePoint,
  QuadrantKey,
} from './types';
import {
  CardRoot,
  CardHead,
  TitleBlock,
  CardTitle,
  CardSubtitle,
  Controls,
  ChartArea,
  ChartSvg,
  SelectionOverlay,
  QuadAnnot,
  Legend as LegendRoot,
  Tooltip,
  EmptyBlock,
  KEYFRAMES_CSS,
  PartialBadge,
  PortalRoot,
  OverlapList,
} from './styles';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';

/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */

/** Overlay поверх ChartArea, когда нет данных. */
const EmptyOverlay = styled(EmptyBlock)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  background: var(--s);
  z-index: 20;
`;

/** Заголовок пустого состояния («Нет данных»). */
const EmptyTitle = styled.div`
  font-size: var(--fs-interactive);
  font-weight: 700;
  color: var(--g700);
`;

/** Подсказка пустого состояния (рекомендация по настройке). */
const EmptyHint = styled.div`
  font-size: var(--fs-meta);
  color: var(--g500);
`;

/** SVG-overlay для lasso-выбора: кладётся абсолютно поверх ChartArea. */
const LassoSvg = styled.svg`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;
import ToolbarBar from './Toolbar';
import LegendList from './Legend';
import { getQuadrant, getQuadrantStats, getWorstN } from './utils/quadrants';
import {
  pickStep,
  formatStep,
  radius,
  hexToRgba,
  pointInPolygon,
  pointInRect,
  Point2D,
  Rect2D,
} from './utils/scales';
import StoreDrillModal from './StoreDrillModal';
import QuadrantDrillModal from './QuadrantDrillModal';

// Inner padding SVG-области для axis labels. Bottom/Left больше top/right —
// нужно место для labels осей и tick подписей (13px / 11px после DS 2.1).
// left=70: gap между Y-label (x=14, rotated) и Y-tick (x=left-10=60) ~14px,
//   сопоставимо с X-axis tick→label spacing (раньше left=60 → gap 2px, слипалось).
// right=0: chart inner content вплотную к правому краю ChartArea — выровнено
//   с right-edge i-иконки (она margin-left:auto в Controls, прижата к ChartArea right).
const PADDING = { top: 12, right: 0, bottom: 52, left: 70 } as const;

/**
 * Резолвит цвет формата: если цвет из transformProps есть — берём его;
 * иначе возвращаем нейтральный серый из темы (--g500), не хардкод.
 */
function resolveFormatColor(
  map: Map<string, string>,
  format: string,
  hostEl: HTMLElement | null,
): string {
  const fromMap = map.get(format);
  if (fromMap) return fromMap;
  if (hostEl) {
    const fallback = getComputedStyle(hostEl).getPropertyValue('--g500').trim();
    if (fallback) return fallback;
  }
  return 'currentColor';
}

type SelectMode = 'rect' | 'lasso' | null;

interface ViewDomain {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface Scales {
  xScale: (v: number) => number;
  yScale: (v: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  innerW: number;
  innerH: number;
}

const ScatterRisk: React.FC<ScatterRiskProps> = (props) => {
  const {
    width,
    height,
    stores,
    formats,
    thresholdX,
    thresholdY,
    hasThresholds,
    quadrants,
    enableQuadrantAnnotations,
    enableWorstStar,
    title,
    subtitle,
    xLabel,
    yLabel,
    xUnit,
    yUnit,
    sizeUnit,
    formatX,
    formatY,
    formatSize,
    formatLoss,
    formatCount,
    xShort,
    yShort,
    isDarkMode,
    setDataMask,
    filterState,
    storeColumn,
    drillEnabled,
    detailQueryParams,
    shortcutsHint,
    dataState,
  } = props;

  // ── State ──
  const [hiddenFormats, setHiddenFormats] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => {
    const initial = filterState?.value;
    if (Array.isArray(initial)) return new Set(initial.map(String));
    return new Set();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDomain, setViewDomain] = useState<ViewDomain | null>(null);
  const [selectMode, setSelectMode] = useState<SelectMode>(null);
  const [selectionStart, setSelectionStart] = useState<Point2D | null>(null);
  const [selectionPath, setSelectionPath] = useState<Point2D[]>([]);
  const [selectionActive, setSelectionActive] = useState(false);
  const [panActive, setPanActive] = useState(false);
  const [drillStoreId, setDrillStoreId] = useState<string | null>(null);
  const [drillQuadrant, setDrillQuadrant] = useState<QuadrantKey | null>(null);

  // ── Refs (mutable state, без перерендера) ──
  const chartAreaRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const scalesRef = useRef<Scales | null>(null);
  const panStartRef = useRef<{ mouse: Point2D; domain: ViewDomain } | null>(null);
  // Флаг "первый рендер с данными" — для управления mount-анимацией bubbles.
  const hasPlayedMountAnimRef = useRef<boolean>(false);
  // Хеш последнего записанного SVG content. Защищает от лишних innerHTML
  // rewrites, когда transformProps пересоздаёт formatX/formatY (новые function
  // references на каждый dispatch) → renderSvg useCallback ref меняется →
  // useEffect [renderSvg, width, height] ререндерит SVG, хотя содержимое
  // байт-в-байт идентично. Это вызывало повторное проигрывание pt-mount
  // анимации (fresh DOM nodes пока is-mount class активен ~550ms).
  // Параллель с donut: prevOptionHashRef в StructureDonut.tsx.
  const prevSvgContentRef = useRef<string>('');

  // ── Отображаемые магазины после legend-фильтра ──
  const visibleStores = useMemo(
    () => stores.filter((s) => !hiddenFormats.has(s.format)),
    [stores, hiddenFormats],
  );

  // ── Auto domain ──
  const autoDomain = useMemo<ViewDomain>(() => {
    if (visibleStores.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xs = visibleStores.map((s) => s.x);
    const ys = visibleStores.map((s) => s.y);
    const xMax = Math.max(...xs) * 1.05;
    const yMin = Math.min(0, Math.min(...ys) * 1.1);
    const yMax = Math.max(...ys) * 1.05;
    return {
      xMin: 0,
      xMax: Math.max(xMax, 0.5),
      yMin,
      yMax: Math.max(yMax, yMin + 0.5),
    };
  }, [visibleStores]);

  // ── Thresholds в виде объекта ──
  const thresholds = useMemo(
    () => ({ x: thresholdX, y: thresholdY }),
    [thresholdX, thresholdY],
  );

  // ── Worst-5 ──
  const worst5 = useMemo(() => getWorstN(visibleStores, 5), [visibleStores]);

  // ── Size range для radius() ──
  const sizeRange = useMemo(() => {
    if (visibleStores.length === 0) return { min: 1, max: 2 };
    let min = Infinity;
    let max = -Infinity;
    for (const s of visibleStores) {
      if (s.size < min) min = s.size;
      if (s.size > max) max = s.size;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 1, max: 2 };
    return { min, max: Math.max(max, min + 1) };
  }, [visibleStores]);

  // ── Map formatId → color ──
  const formatColorMap = useMemo(() => {
    const map = new Map<string, string>();
    formats.forEach((f) => map.set(f.id, f.color));
    return map;
  }, [formats]);

  // ── Sync filterState → activeFilters ──
  useEffect(() => {
    const v = filterState?.value;
    if (Array.isArray(v)) {
      setActiveFilters(new Set(v.map(String)));
    }
  }, [filterState]);

  // ── Update cross-filter ──
  const pushFilter = useCallback(
    (ids: Set<string>) => {
      if (!setDataMask || !storeColumn) return;
      const vals = Array.from(ids);
      if (vals.length === 0) {
        setDataMask({
          extraFormData: { filters: [] },
          filterState: { value: null },
        });
      } else {
        setDataMask({
          extraFormData: {
            filters: [{ col: storeColumn, op: 'IN', val: vals }],
          },
          filterState: { value: vals },
        });
      }
    },
    [setDataMask, storeColumn],
  );

  const commitFilters = useCallback(
    (next: Set<string>) => {
      setActiveFilters(next);
      pushFilter(next);
    },
    [pushFilter],
  );

  const toggleFilter = useCallback(
    (id: string) => {
      const next = new Set(activeFilters);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      commitFilters(next);
    },
    [activeFilters, commitFilters],
  );

  // ── Tooltip ──
  const positionTooltip = useCallback((clientX: number, clientY: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    const offset = 14;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    // Защита: пока tooltip не отрендерен (offsetWidth=0), не позиционируем —
    // следующий rAF попробует ещё раз.
    if (tw === 0 || th === 0) {
      requestAnimationFrame(() => positionTooltip(clientX, clientY));
      return;
    }
    let x = clientX + offset;
    let y = clientY + offset;
    if (x + tw > window.innerWidth - 8) x = clientX - tw - offset;
    if (y + th > window.innerHeight - 8) y = clientY - th - offset;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, []);

  const showTooltip = useCallback(
    (html: string, clientX: number, clientY: number) => {
      const el = tooltipRef.current;
      if (!el) return;
      el.innerHTML = html;
      el.setAttribute('data-visible', 'true');
      // Измеряем offsetWidth/Height ПОСЛЕ render — иначе они = 0 на первом
      // показе, логика flip-у-края экрана не сработает, tooltip обрежется.
      requestAnimationFrame(() => positionTooltip(clientX, clientY));
    },
    [positionTooltip],
  );

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (!el) return;
    el.setAttribute('data-visible', 'false');
  }, []);

  /** Позиционирует tooltip СПРАВА от popup'а (priority), с fallback'ами:
      справа → слева → над → под. Используется при hover на row внутри overlap popup. */
  const positionTooltipBesidePopup = useCallback((popupEl: HTMLElement) => {
    const el = tooltipRef.current;
    if (!el) return;
    const popupRect = popupEl.getBoundingClientRect();
    const place = () => {
      const tw = el.offsetWidth;
      const th = el.offsetHeight;
      if (tw === 0 || th === 0) {
        requestAnimationFrame(place);
        return;
      }
      const gap = 12;
      let left = popupRect.right + gap;
      let top = popupRect.top;
      // Fallback 1: слева от popup
      if (left + tw > window.innerWidth - 8) {
        left = popupRect.left - tw - gap;
      }
      // Fallback 2: над popup (если ни справа, ни слева не лезет)
      if (left < 8) {
        left = Math.max(8, Math.min(popupRect.left, window.innerWidth - tw - 8));
        top = popupRect.top - th - gap;
        // Fallback 3: под popup
        if (top < 8) top = popupRect.bottom + gap;
      }
      // Финальный clamp по вертикали
      if (top + th > window.innerHeight - 8) top = window.innerHeight - th - 8;
      if (top < 8) top = 8;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };
    place();
  }, []);

  const showTooltipBesidePopup = useCallback(
    (html: string, popupEl: HTMLElement) => {
      const el = tooltipRef.current;
      if (!el) return;
      el.innerHTML = html;
      el.setAttribute('data-visible', 'true');
      requestAnimationFrame(() => positionTooltipBesidePopup(popupEl));
    },
    [positionTooltipBesidePopup],
  );

  // ── Build tooltip HTML для точки ──
  const buildStoreTooltip = useCallback(
    (s: StorePoint): string => {
      const fmtColor = resolveFormatColor(formatColorMap, s.format, chartAreaRef.current);
      const q = getQuadrant(s, thresholds);
      const qDef = quadrants[q];
      const qColor = qDef.color;
      // Относительная разница (ratio) используется только для классификации статуса.
      // Само значение в tooltip показываем через formatX/formatY (абсолютное).
      const dxRatio = s.planX && s.planX !== 0 ? (s.x - s.planX) / s.planX : 0;
      const dyRatio = s.planY && s.planY !== 0 ? (s.y - s.planY) / s.planY : 0;
      const dxCls = dxRatio > 0.03 ? 'dn' : dxRatio < -0.03 ? 'up' : 'wn';
      const dyCls = dyRatio > 0.03 ? 'dn' : dyRatio < -0.03 ? 'up' : 'wn';
      const escape = (v: string) =>
        v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // Усекаем длинные строки для tooltip (защита от layout overflow).
      const truncate = (v: string, max = 60): string =>
        v.length > max ? `${v.slice(0, max - 1)}…` : v;
      const planXPart = s.planX != null
        ? `<div class="tt-row"><span class="tt-l">План ${escape(xShort)}</span><span class="tt-v">${formatX(s.planX)}</span></div>`
        : '';
      const planYPart = s.planY != null
        ? `<div class="tt-row"><span class="tt-l">План ${escape(yShort)}</span><span class="tt-v">${formatY(s.planY)}</span></div>`
        : '';
      const sumLossPart = s.sumLoss != null
        ? `<div class="tt-row"><span class="tt-l">Потери</span><span class="tt-v dn">${formatLoss(s.sumLoss)}</span></div>`
        : '';
      const sizeRow = `<div class="tt-row" style="margin-top:6px;padding-top:7px;border-top:1px solid var(--g200)"><span class="tt-l">${escape(sizeUnit ? 'Размер' : 'Выручка')}</span><span class="tt-v">${formatSize(s.size)}</span></div>`;
      // Хинты управления (Click/Ctrl+Click) — в InfoHint overlay, не дублируем в tooltip.
      return `
        <div class="tt-head">
          <div class="tt-status" style="background:${fmtColor}"></div>
          <div class="tt-titles">
            <div class="tt-name">${escape(truncate(s.name, 60))}</div>
            <div class="tt-sub">${escape(truncate(s.formatName, 30))}${s.city ? ` · ${escape(truncate(s.city, 30))}` : ''}</div>
          </div>
        </div>
        <div class="tt-rows">
          <div class="tt-row"><span class="tt-l">${escape(xShort)}</span><span class="tt-v ${dxCls}">${formatX(s.x)}</span></div>
          ${planXPart}
          <div class="tt-row"><span class="tt-l">${escape(yShort)}</span><span class="tt-v ${dyCls}">${formatY(s.y)}</span></div>
          ${planYPart}
          ${sumLossPart}
          ${sizeRow}
        </div>
        <div class="tt-status-text" style="color:${qColor}">Зона: ${escape(qDef.label.replace(/\s[⚠✓]$/, ''))}</div>
      `;
    },
    [formatColorMap, thresholds, quadrants, xShort, yShort, formatX, formatY, formatLoss, formatSize, sizeUnit],
  );

  // ── Rendering SVG content ──
  const renderSvg = useCallback(() => {
    const svg = svgRef.current;
    const area = chartAreaRef.current;
    if (!svg || !area) return;

    const W = area.clientWidth;
    const H = area.clientHeight;
    if (W <= 0 || H <= 0) return;
    const innerW = W - PADDING.left - PADDING.right;
    const innerH = H - PADDING.top - PADDING.bottom;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));

    const dom = viewDomain ?? autoDomain;
    const { xMin, xMax, yMin, yMax } = dom;
    if (xMax - xMin <= 0 || yMax - yMin <= 0) return;

    const xScale = (v: number) => PADDING.left + ((v - xMin) / (xMax - xMin)) * innerW;
    const yScale = (v: number) =>
      PADDING.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    scalesRef.current = { xScale, yScale, xMin, xMax, yMin, yMax, innerW, innerH };

    const tx = thresholds.x;
    const ty = thresholds.y;
    const txPx = Math.max(PADDING.left, Math.min(PADDING.left + innerW, xScale(tx)));
    const tyPx = Math.max(PADDING.top, Math.min(PADDING.top + innerH, yScale(ty)));

    // Читаем CSS-переменные темы; если переменная не установлена —
    // возвращаем currentColor, чтобы SVG наследовал цвет контейнера.
    const css = (varName: string) =>
      getComputedStyle(area).getPropertyValue(varName).trim() || 'currentColor';

    const g200 = css('--g200');
    const g400 = css('--g400');
    const g500 = css('--g500');
    const g600 = css('--g600');

    let content = '';

    // Skругление углов inner-plot: clipPath с rounded rect (rx=10) — все
    // дочерние элементы группы (quadrants, gridlines, threshold, points)
    // обрезаются по этому rect. Axis labels рендерятся ВНЕ группы.
    const CLIP_R = 10;
    content += `<defs><clipPath id="rm-inner-clip"><rect x="${PADDING.left}" y="${PADDING.top}" width="${innerW}" height="${innerH}" rx="${CLIP_R}" ry="${CLIP_R}"/></clipPath></defs>`;
    content += `<g clip-path="url(#rm-inner-clip)">`;

    // Quadrant tints
    const tintTL = hexToRgba(quadrants.tl.color, 0.05);
    const tintTR = hexToRgba(quadrants.tr.color, 0.06);
    const tintBL = hexToRgba(quadrants.bl.color, 0.04);
    const tintBR = hexToRgba(quadrants.br.color, 0.05);

    if (hasThresholds) {
      content += `<rect x="${PADDING.left}" y="${PADDING.top}" width="${txPx - PADDING.left}" height="${tyPx - PADDING.top}" fill="${tintTL}" data-quadrant="tl" class="qa-bg-rect" style="cursor:pointer"/>`;
      content += `<rect x="${txPx}" y="${PADDING.top}" width="${PADDING.left + innerW - txPx}" height="${tyPx - PADDING.top}" fill="${tintTR}" data-quadrant="tr" class="qa-bg-rect" style="cursor:pointer"/>`;
      content += `<rect x="${PADDING.left}" y="${tyPx}" width="${txPx - PADDING.left}" height="${PADDING.top + innerH - tyPx}" fill="${tintBL}" data-quadrant="bl" class="qa-bg-rect" style="cursor:pointer"/>`;
      content += `<rect x="${txPx}" y="${tyPx}" width="${PADDING.left + innerW - txPx}" height="${PADDING.top + innerH - tyPx}" fill="${tintBR}" data-quadrant="br" class="qa-bg-rect" style="cursor:pointer"/>`;
    }

    // Gridlines X — линии inside clip (обрезаются по rounded inner plot).
    // Tick labels собираем отдельно и рендерим ВНЕ clip group (они в padding
    // zone, за пределами inner-plot rect → иначе clipped).
    let tickLabels = '';
    const xStep = pickStep(xMax - xMin, 7);
    const xStart = Math.ceil(xMin / xStep) * xStep;
    for (let v = xStart; v <= xMax + 1e-9; v += xStep) {
      const x = xScale(v);
      if (x < PADDING.left - 1 || x > PADDING.left + innerW + 1) continue;
      content += `<line x1="${x.toFixed(1)}" y1="${PADDING.top}" x2="${x.toFixed(1)}" y2="${PADDING.top + innerH}" stroke="${g200}" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>`;
      const label = formatStep(v, xStep) + (xUnit ? `${xUnit}` : '');
      tickLabels += `<text x="${x.toFixed(1)}" y="${PADDING.top + innerH + 18}" font-family="JetBrains Mono, monospace" font-size="11" fill="${g500}" text-anchor="middle">${label}</text>`;
    }
    // Gridlines Y
    const yStep = pickStep(yMax - yMin, 7);
    const yStart = Math.ceil(yMin / yStep) * yStep;
    for (let v = yStart; v <= yMax + 1e-9; v += yStep) {
      const y = yScale(v);
      if (y < PADDING.top - 1 || y > PADDING.top + innerH + 1) continue;
      content += `<line x1="${PADDING.left}" y1="${y.toFixed(1)}" x2="${PADDING.left + innerW}" y2="${y.toFixed(1)}" stroke="${g200}" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>`;
      const label = formatStep(v, yStep) + (yUnit ? `${yUnit}` : '');
      tickLabels += `<text x="${PADDING.left - 10}" y="${(y + 4).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="11" fill="${g500}" text-anchor="end">${label}</text>`;
    }

    // Threshold lines
    if (hasThresholds) {
      if (txPx > PADDING.left && txPx < PADDING.left + innerW) {
        content += `<line x1="${txPx}" y1="${PADDING.top}" x2="${txPx}" y2="${PADDING.top + innerH}" stroke="${g400}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
      }
      if (tyPx > PADDING.top && tyPx < PADDING.top + innerH) {
        content += `<line x1="${PADDING.left}" y1="${tyPx}" x2="${PADDING.left + innerW}" y2="${tyPx}" stroke="${g400}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
      }
    }

    // Закрываем inner-plot clip group, tick labels + axis labels рендерим
    // снаружи (они в padding-зоне за пределами clip rect — иначе clipped).
    content += `</g>`;
    content += tickLabels;

    // Axis labels
    const escapeXml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    content += `<text x="${PADDING.left + innerW / 2}" y="${H - 10}" font-family="Manrope, sans-serif" font-size="13" font-weight="600" fill="${g600}" text-anchor="middle">${escapeXml(xLabel)}</text>`;
    content += `<text x="14" y="${PADDING.top + innerH / 2}" font-family="Manrope, sans-serif" font-size="13" font-weight="600" fill="${g600}" text-anchor="middle" transform="rotate(-90 14 ${PADDING.top + innerH / 2})">${escapeXml(yLabel)}</text>`;

    // Re-open clip group для points — точки тоже должны обрезаться по rounded
    // corners inner-plot (особенно важно при zoom/pan когда точка может
    // оказаться у края).
    content += `<g clip-path="url(#rm-inner-clip)">`;

    // Points
    const hasSearch = searchQuery.trim().length > 0;
    const q = searchQuery.trim().toLowerCase();
    const hasFilters = activeFilters.size > 0;
    // Labels для ARIA — формируем один раз за render
    const CURR_LABELS = { x: xShort, y: yShort };

    const sorted = [...visibleStores].sort(
      (a, b) => radius(b.size, sizeRange.min, sizeRange.max) - radius(a.size, sizeRange.min, sizeRange.max),
    );

    // Mount-анимация bubbles — играет ОДИН РАЗ при первом непустом рендере.
    // На pan/zoom/filter — НЕ повторяется (класс is-mount уже снят).
    if (!hasPlayedMountAnimRef.current && sorted.length > 0) {
      hasPlayedMountAnimRef.current = true;
      svg.classList.add('is-mount');
      // длина = animation 550ms + max stagger (sorted.length * 3ms) + запас 100ms
      const totalMs = 550 + sorted.length * 3 + 100;
      setTimeout(() => {
        svg.classList.remove('is-mount');
      }, totalMs);
    }

    sorted.forEach((s, i) => {
      if (s.x < xMin || s.x > xMax || s.y < yMin || s.y > yMax) return;
      const x = xScale(s.x);
      const y = yScale(s.y);
      const r = radius(s.size, sizeRange.min, sizeRange.max);
      const color = resolveFormatColor(formatColorMap, s.format, chartAreaRef.current);
      const fill = hexToRgba(color, 0.55);

      const matchSearch =
        !hasSearch ||
        s.name.toLowerCase().includes(q) ||
        (s.city?.toLowerCase().includes(q) ?? false);
      const isFound = hasSearch && matchSearch;
      const isDimmed = hasSearch && !matchSearch;
      const isFiltered = activeFilters.has(s.id);
      const dimByFilter = hasFilters && !isFiltered;
      const isEffectivelyDimmed = isDimmed || dimByFilter;

      const classes = ['pt'];
      if (isFound || isFiltered) classes.push('found');
      if (isEffectivelyDimmed) classes.push('dim');

      // style --anim-i — stagger для mount-анимации (играет только при первом
      // рендере, см. is-mount class на ChartSvg). На pan/zoom не повторяется.
      content += `<circle class="${classes.join(' ')}" style="--anim-i:${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${color}" stroke-width="1.2" data-id="${s.id}" tabindex="0" role="img" aria-label="${escapeXml(s.name)}: ${CURR_LABELS.x} ${escapeXml(formatX(s.x))}, ${CURR_LABELS.y} ${escapeXml(formatY(s.y))}"/>`;
    });
    // Закрываем clip group для points.
    content += `</g>`;

    // Хеш-гард: если содержимое не изменилось (transformProps пересоздал
    // formatX/Y references но значения те же) — не переписываем innerHTML.
    // Иначе React-cycle с новыми function-refs триггерит DOM-rewrite, а пока
    // is-mount class активен (550ms), pt-mount анимация играет повторно на
    // свежесозданных <circle> элементах. Видится как «несколько раз рендерится».
    if (content === prevSvgContentRef.current) return;
    prevSvgContentRef.current = content;

    svg.innerHTML = content;
  }, [
    autoDomain,
    viewDomain,
    thresholds,
    quadrants,
    hasThresholds,
    visibleStores,
    formatColorMap,
    activeFilters,
    searchQuery,
    xLabel,
    yLabel,
    xUnit,
    yUnit,
    sizeRange,
    xShort,
    yShort,
    formatX,
    formatY,
  ]);

  // Rerender on relevant changes
  useEffect(() => {
    renderSvg();
  }, [renderSvg, width, height]);

  // Resize observer
  useEffect(() => {
    const area = chartAreaRef.current;
    if (!area) return;
    // rAF-throttle: при потоке resize-событий (CSS-анимации dashboard layout)
    // вызываем renderSvg не чаще раз в кадр — иначе 400 точек × innerHTML на каждый
    // ResizeObserver tick роняет FPS.
    let pendingRaf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (pendingRaf !== null) return;
      pendingRaf = requestAnimationFrame(() => {
        pendingRaf = null;
        renderSvg();
      });
    });
    ro.observe(area);
    return () => {
      if (pendingRaf !== null) cancelAnimationFrame(pendingRaf);
      ro.disconnect();
    };
  }, [renderSvg]);

  // ── Point click (delegation) ──
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (selectMode) return;
      const target = e.target as Element;
      // Точка
      if (target.classList.contains('pt')) {
        e.stopPropagation();
        const id = target.getAttribute('data-id');
        if (!id) return;
        if (e.ctrlKey || e.metaKey) {
          if (drillEnabled) setDrillStoreId(id);
        } else {
          toggleFilter(id);
        }
        return;
      }
      // Квадрант
      if (target.classList.contains('qa-bg-rect')) {
        const qKey = target.getAttribute('data-quadrant') as QuadrantKey | null;
        if (!qKey) return;
        if (e.ctrlKey || e.metaKey) {
          if (drillEnabled) setDrillQuadrant(qKey);
        } else {
          const inQuad = visibleStores
            .filter((s) => getQuadrant(s, thresholds) === qKey)
            .map((s) => s.id);
          if (inQuad.length === 0) return;
          const allSelected = inQuad.every((id) => activeFilters.has(id));
          const next = new Set(activeFilters);
          if (allSelected) inQuad.forEach((id) => next.delete(id));
          else inQuad.forEach((id) => next.add(id));
          commitFilters(next);
        }
      }
    },
    [selectMode, drillEnabled, toggleFilter, visibleStores, thresholds, activeFilters, commitFilters],
  );

  const handleSvgDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!drillEnabled || selectMode) return;
      const target = e.target as Element;
      if (target.classList.contains('pt')) {
        const id = target.getAttribute('data-id');
        if (id) setDrillStoreId(id);
      }
    },
    [drillEnabled, selectMode],
  );

  // ── Stores map для O(1) lookup в hover ──
  const storesById = useMemo(() => {
    const m = new Map<string, StorePoint>();
    stores.forEach((s) => m.set(s.id, s));
    return m;
  }, [stores]);

  // ── Hover для tooltip и overlap-списка ──
  // Radius hit-test: проверяем расстояние от курсора до КАЖДОГО visible store в pixel-coords.
  // Если 1 store ≤ HIT_RADIUS — обычный tooltip. Если 2+ — overlap popup (clickable list).
  const HIT_RADIUS = 18;

  const [overlapState, setOverlapState] = useState<{
    stores: StorePoint[];
    x: number; // clientX — позиционирование popup
    y: number; // clientY
    // SVG pixel-coords центра кластера (сохраняем на случай будущих фичей).
    originPx: number;
    originPy: number;
    // Locked-mode: popup не закрывается ни при mouseleave, ни при смене hit-теста.
    // Активируется зажатым Ctrl/Meta во время открытого popup'а; снимается Esc.
    locked: boolean;
  } | null>(null);
  // Ref, синхронный с overlapState — для чтения актуального значения внутри
  // rAF-замыкания handleSvgMouseMove и keydown-листенера (closure был бы stale).
  const overlapStateRef = useRef(overlapState);
  useEffect(() => {
    overlapStateRef.current = overlapState;
  }, [overlapState]);
  const overlapRef = useRef<HTMLDivElement | null>(null);

  const hoverStateRef = useRef<{
    lastId: string | null;
    lastOverlapKey: string;
    rafId: number | null;
    lastX: number;
    lastY: number;
  }>({ lastId: null, lastOverlapKey: '', rafId: null, lastX: 0, lastY: 0 });

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const cx = e.clientX;
      const cy = e.clientY;
      const state = hoverStateRef.current;
      state.lastX = cx;
      state.lastY = cy;

      // Throttle через requestAnimationFrame — не более 1 update/frame
      if (state.rafId !== null) return;
      state.rafId = requestAnimationFrame(() => {
        state.rafId = null;
        const area = chartAreaRef.current;
        const sc = scalesRef.current;
        if (!area || !sc) return;
        const rect = area.getBoundingClientRect();
        const px = state.lastX - rect.left;
        const py = state.lastY - rect.top;

        // Hit-test всех видимых store: distance в pixel-coords от их центров.
        const hits: { s: StorePoint; dist: number }[] = [];
        for (const s of visibleStores) {
          if (s.x < sc.xMin || s.x > sc.xMax || s.y < sc.yMin || s.y > sc.yMax) continue;
          const sx = sc.xScale(s.x);
          const sy = sc.yScale(s.y);
          const dist = Math.hypot(sx - px, sy - py);
          if (dist <= HIT_RADIUS) hits.push({ s, dist });
        }
        hits.sort((a, b) => a.dist - b.dist);

        // Если popup в locked-mode (Ctrl зажат) — игнорируем hit-test полностью:
        // никаких автозакрытий и подмен на single tooltip. Юзер контролирует.
        const op = overlapStateRef.current;
        if (op !== null && op.locked) {
          return;
        }

        if (hits.length === 0) {
          if (state.lastId !== null) {
            state.lastId = null;
            hideTooltip();
          }
          if (state.lastOverlapKey !== '') {
            closeOverlap();
          }
          return;
        }
        if (hits.length === 1) {
          // Одиночная точка → обычный tooltip + закрываем popup immediate
          // (вдруг курсор просто проходит мимо overlap к одиночной точке).
          if (state.lastOverlapKey !== '') {
            closeOverlap();
          }
          const s = hits[0].s;
          if (state.lastId !== s.id) {
            state.lastId = s.id;
            showTooltip(buildStoreTooltip(s), state.lastX, state.lastY);
          } else {
            positionTooltip(state.lastX, state.lastY);
          }
          return;
        }
        // overlap (2+) → показываем кликабельный список.
        if (state.lastId !== null) {
          state.lastId = null;
          hideTooltip();
        }
        const stores = hits.map((h) => h.s);
        const key = stores.map((x) => x.id).join('|');
        if (state.lastOverlapKey !== key) {
          // Новая группа точек — фиксируем popup в текущей позиции курсора.
          state.lastOverlapKey = key;
          const origin = hits[0].s;
          const originPx = sc.xScale(origin.x);
          const originPy = sc.yScale(origin.y);
          setOverlapState({
            stores, x: state.lastX, y: state.lastY,
            originPx, originPy,
            locked: false,
          });
        }
        // Та же группа — popup НЕ двигаем, иначе пользователь не сможет
        // довести курсор до его строк (popup убегал бы за мышью).
      });
    },
    [visibleStores, showTooltip, hideTooltip, positionTooltip, buildStoreTooltip],
  );

  // Immediate close — без таймера. Locked-popup закрывается только через Esc.
  const closeOverlap = useCallback(() => {
    setOverlapState(null);
    hoverStateRef.current.lastOverlapKey = '';
  }, []);

  const handleSvgMouseLeave = useCallback(() => {
    const state = hoverStateRef.current;
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.lastId = null;
    hideTooltip();
    // Locked popup остаётся открытым при уходе курсора из SVG —
    // юзер зафиксировал и собирается перейти к popup.
    if (overlapStateRef.current && !overlapStateRef.current.locked) {
      closeOverlap();
    }
  }, [hideTooltip, closeOverlap]);

  // Ctrl/Meta зажат → lock popup (если открыт). Esc → закрыть popup.
  // Слушаем глобально (на window), потому что курсор может быть в любом месте.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cur = overlapStateRef.current;
      if (!cur) return;
      if (e.key === 'Escape') {
        closeOverlap();
        return;
      }
      // Lock на любом нажатии Control/Meta — даже если юзер просто зажал клавишу,
      // не отпустив, для последующего Ctrl+Click drill это безвредно.
      if (!cur.locked && (e.key === 'Control' || e.key === 'Meta')) {
        setOverlapState({ ...cur, locked: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOverlap]);

  // ── Mouse handlers для pan + select ──
  const getMouseInArea = (e: React.MouseEvent | MouseEvent): Point2D => {
    const area = chartAreaRef.current;
    if (!area) return { x: 0, y: 0 };
    const rect = area.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const inChartBounds = (p: Point2D): boolean => {
    const s = scalesRef.current;
    if (!s) return false;
    return (
      p.x >= PADDING.left &&
      p.x <= PADDING.left + s.innerW &&
      p.y >= PADDING.top &&
      p.y <= PADDING.top + s.innerH
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target.classList?.contains('pt')) return;

    if (selectMode) {
      const p = getMouseInArea(e);
      if (!inChartBounds(p)) return;
      setSelectionStart(p);
      setSelectionPath([p]);
      setSelectionActive(true);
      e.preventDefault();
      return;
    }
    const p = getMouseInArea(e);
    if (!inChartBounds(p)) return;
    const dom = viewDomain ?? autoDomain;
    panStartRef.current = { mouse: p, domain: { ...dom } };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectMode && selectionActive) {
      const p = getMouseInArea(e);
      if (selectMode === 'rect') {
        setSelectionStart((prev) => prev); // no-op но триггерит перерендер оверлея
        setSelectionPath([selectionStart ?? p, p]);
      } else if (selectMode === 'lasso') {
        setSelectionPath((prev) => [...prev, p]);
      }
      return;
    }
    if (!panStartRef.current) return;
    const s = scalesRef.current;
    if (!s) return;
    const p = getMouseInArea(e);
    const dx = p.x - panStartRef.current.mouse.x;
    const dy = p.y - panStartRef.current.mouse.y;
    if (!panActive && Math.hypot(dx, dy) > 4) {
      setPanActive(true);
    }
    if (panActive || Math.hypot(dx, dy) > 4) {
      const dom = panStartRef.current.domain;
      const xDelta = -dx / s.innerW * (dom.xMax - dom.xMin);
      const yDelta = dy / s.innerH * (dom.yMax - dom.yMin);
      setViewDomain({
        xMin: dom.xMin + xDelta,
        xMax: dom.xMax + xDelta,
        yMin: dom.yMin + yDelta,
        yMax: dom.yMax + yDelta,
      });
    }
  };

  const applySelection = useCallback(
    (hitTest: (p: Point2D) => boolean) => {
      const s = scalesRef.current;
      if (!s) return;
      const next = new Set(activeFilters);
      visibleStores.forEach((store) => {
        if (store.x < s.xMin || store.x > s.xMax) return;
        if (store.y < s.yMin || store.y > s.yMax) return;
        const px = s.xScale(store.x);
        const py = s.yScale(store.y);
        if (hitTest({ x: px, y: py })) next.add(store.id);
      });
      commitFilters(next);
    },
    [activeFilters, visibleStores, commitFilters],
  );

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectMode && selectionActive) {
      setSelectionActive(false);
      const p = getMouseInArea(e);
      if (selectMode === 'rect' && selectionStart) {
        const r: Rect2D = {
          x: Math.min(selectionStart.x, p.x),
          y: Math.min(selectionStart.y, p.y),
          w: Math.abs(p.x - selectionStart.x),
          h: Math.abs(p.y - selectionStart.y),
        };
        if (r.w > 4 && r.h > 4) {
          applySelection((pt) => pointInRect(pt, r));
        }
      } else if (selectMode === 'lasso' && selectionPath.length > 3) {
        const poly = [...selectionPath];
        applySelection((pt) => pointInPolygon(pt, poly));
      }
      setTimeout(() => {
        setSelectionStart(null);
        setSelectionPath([]);
        setSelectMode(null);
      }, 150);
      return;
    }
    panStartRef.current = null;
    setPanActive(false);
  };

  const handleMouseLeave = () => {
    panStartRef.current = null;
    setPanActive(false);
    if (selectionActive) {
      setSelectionActive(false);
      setSelectionStart(null);
      setSelectionPath([]);
    }
  };

  // ── Wheel zoom ──
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (selectMode) return;
      const s = scalesRef.current;
      if (!s) return;
      const area = chartAreaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!inChartBounds(p)) return;
      e.preventDefault();

      const factor = e.deltaY > 0 ? 1.15 : 0.87;
      const xv = s.xMin + (p.x - PADDING.left) / s.innerW * (s.xMax - s.xMin);
      const yv = s.yMin + (1 - (p.y - PADDING.top) / s.innerH) * (s.yMax - s.yMin);

      const dom = viewDomain ?? autoDomain;
      setViewDomain({
        xMin: Math.max(0, xv + (dom.xMin - xv) * factor),
        xMax: xv + (dom.xMax - xv) * factor,
        yMin: yv + (dom.yMin - yv) * factor,
        yMax: yv + (dom.yMax - yv) * factor,
      });
    },
    [selectMode, viewDomain, autoDomain],
  );

  useEffect(() => {
    const area = chartAreaRef.current;
    if (!area) return;
    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Best-5 (best mirror of worst5) ──
  const best5 = useMemo(() => {
    const list = visibleStores
      .filter((s) => s.planX != null && s.planY != null)
      .map((s) => ({
        id: s.id,
        // goodness = насколько лучше плана. Чем БОЛЬШЕ положительное отклонение plan → x — тем лучше.
        goodness:
          (s.planX! - s.x) / Math.max(s.planX!, 1e-9) +
          Math.max(0, (s.planY! - s.y) / Math.max(s.planY!, 1e-9)),
      }))
      .sort((a, b) => b.goodness - a.goodness)
      .slice(0, 5);
    return new Set(list.map((x) => x.id));
  }, [visibleStores]);

  // ── Select actions ──
  const onSelectAction = useCallback(
    (action: 'rect' | 'lasso' | 'worst5' | 'best5' | 'bad' | 'good') => {
      if (action === 'rect' || action === 'lasso') {
        setSelectMode((m) => (m === action ? null : action));
        return;
      }
      if (action === 'worst5') {
        setSelectMode(null);
        commitFilters(new Set(worst5));
        return;
      }
      if (action === 'best5') {
        setSelectMode(null);
        commitFilters(new Set(best5));
        return;
      }
      if (action === 'bad') {
        const next = new Set<string>();
        visibleStores.forEach((s) => {
          const overX = s.planX != null ? s.x > s.planX : s.x > thresholds.x;
          const overY = s.planY != null ? s.y > s.planY : s.y > thresholds.y;
          if (overX || overY) next.add(s.id);
        });
        setSelectMode(null);
        commitFilters(next);
        return;
      }
      if (action === 'good') {
        // Лучше плана по ОБЕИМ осям (зеркало bad, но требование строже — оба меньше).
        const next = new Set<string>();
        visibleStores.forEach((s) => {
          const underX = s.planX != null ? s.x < s.planX : s.x < thresholds.x;
          const underY = s.planY != null ? s.y < s.planY : s.y < thresholds.y;
          if (underX && underY) next.add(s.id);
        });
        setSelectMode(null);
        commitFilters(next);
      }
    },
    [worst5, best5, visibleStores, thresholds, commitFilters],
  );

  const onReset = useCallback(() => {
    setViewDomain(null);
    setSelectMode(null);
  }, []);

  const onClearFilters = useCallback(() => {
    commitFilters(new Set());
    setSelectMode(null);
  }, [commitFilters]);

  // ── Search ──
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as string[];
    return visibleStores
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.city?.toLowerCase().includes(q) ?? false),
      )
      .map((s) => s.id);
  }, [searchQuery, visibleStores]);

  // Авто-применение поиска как cross-filter с debounce 300ms — без отдельной
  // кнопки «Выбрать N». Юзер вводит query → matches применяются автоматически
  // как фильтр для дашборда. Очистка query фильтр НЕ сбрасывает (пользователь
  // сбрасывает явно через Clear кнопку в тулбаре).
  useEffect(() => {
    if (!searchQuery.trim() || searchMatches.length === 0) return;
    const handle = window.setTimeout(() => {
      commitFilters(new Set(searchMatches));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery, searchMatches, commitFilters]);

  // ── Esc → close modal cascade ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drillStoreId) setDrillStoreId(null);
        else if (drillQuadrant) setDrillQuadrant(null);
        else if (selectMode) setSelectMode(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drillStoreId, drillQuadrant, selectMode]);

  // ── Keyboard navigation на точках (Enter toggles, Space opens modal) ──
  const handleSvgKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      const target = e.target as Element;
      if (!target.classList?.contains('pt')) return;
      const id = target.getAttribute('data-id');
      if (!id) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        toggleFilter(id);
      } else if (e.key === ' ' || e.code === 'Space') {
        if (drillEnabled) {
          e.preventDefault();
          setDrillStoreId(id);
        }
      }
    },
    [toggleFilter, drillEnabled],
  );

  // ── Quadrant annotations ──
  const quadrantStats = useMemo(
    () => (hasThresholds ? getQuadrantStats(visibleStores, thresholds) : null),
    [hasThresholds, visibleStores, thresholds],
  );

  // Позиции плашек-аннотаций хранятся в state и пересчитываются после каждого
  // SVG-рендера (через useLayoutEffect, в том же кадре). Использовать useMemo
  // с refs нельзя — хук не переинициализируется при изменении ref.current.
  type AnnotationPos = {
    side: 'left' | 'right';
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  const [annotationPositions, setAnnotationPositions] = useState<Record<
    QuadrantKey,
    AnnotationPos
  > | null>(null);

  useEffect(() => {
    const area = chartAreaRef.current;
    const s = scalesRef.current;
    if (!area || !s || !hasThresholds || !enableQuadrantAnnotations) {
      if (annotationPositions !== null) setAnnotationPositions(null);
      return;
    }
    const PAD = 10;
    const rightOffset = PADDING.right + PAD; // от правого края chart-area
    const bottomOffset = PADDING.bottom + PAD; // от нижнего края
    const next: Record<QuadrantKey, AnnotationPos> = {
      tl: { side: 'left', left: PADDING.left + PAD, top: PADDING.top + PAD },
      tr: { side: 'right', right: rightOffset, top: PADDING.top + PAD },
      bl: { side: 'left', left: PADDING.left + PAD, bottom: bottomOffset },
      br: { side: 'right', right: rightOffset, bottom: bottomOffset },
    };
    setAnnotationPositions(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasThresholds, enableQuadrantAnnotations, width, height, viewDomain, autoDomain]);

  const themeMode: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';

  // DS 2.0 canonical: loading имеет свой раздельный return со своим CardRoot.
  // При переходе loading → loaded React unmount'ит loading-CardRoot и mount'ит
  // новый → cardInKf animation запускается ровно когда юзер видит контент.
  if (dataState === 'loading') {
    return (
      <CardRoot data-theme={themeMode} role="region" aria-busy="true" data-no-anim="">
        <style>{KEYFRAMES_CSS}</style>
        <CardHead>
          <TitleBlock>
            <CardTitle>{title}</CardTitle>
          </TitleBlock>
        </CardHead>
        <div role="status" aria-label="Загрузка" style={{ flex: 1 }} />
      </CardRoot>
    );
  }

  return (
    <>
    <CardRoot data-theme={themeMode} role="region" aria-labelledby="sr-card-title" data-info-hint-container="">
      <style>{KEYFRAMES_CSS}</style>
      <CardHead>
        <TitleBlock>
          <CardTitle id="sr-card-title">
            {title}
            {dataState === 'partial' && (
              <PartialBadge title="Часть данных недоступна">Частично</PartialBadge>
            )}
          </CardTitle>
          <CardSubtitle>
            {subtitle && <span>{subtitle}</span>}
            {subtitle && <span className="dot" />}
            <span className="strong">{formatCount(stores.length)} объектов</span>
            {activeFilters.size > 0 && (
              <>
                <span className="dot" />
                <span>{formatCount(activeFilters.size)} выбрано</span>
              </>
            )}
          </CardSubtitle>
        </TitleBlock>
        <Controls>
          <ToolbarBar
            selectMode={selectMode}
            hasFilters={activeFilters.size > 0}
            onAction={onSelectAction}
            onReset={onReset}
            onClear={onClearFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <InfoHintTopRight>
            <InfoHint ariaLabel="Подсказка по управлению">
              <div className="hint-section">
                <div className="hint-section-title">Управление</div>
                {shortcutsHint.split(/\s*·\s*/).map((part, i) => {
                  const [keysRaw, ...descParts] = part.split(/\s*—\s*/);
                  const desc = descParts.join(' — ');
                  const keys = keysRaw.split(/\s*\+\s*/);
                  return (
                    <span className="hi" key={i}>
                      {keys.map((k, ki) => (
                        <Fragment key={ki}>
                          <kbd>{k}</kbd>
                          {ki < keys.length - 1 && ' + '}
                        </Fragment>
                      ))}
                      {desc && <> — {desc}</>}
                    </span>
                  );
                })}
                <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
              </div>
              <div className="hint-section">
                <div className="hint-section-title">Пояснения</div>
                <span className="hi">Размер кружка = {sizeUnit}</span>
              </div>
            </InfoHint>
          </InfoHintTopRight>
        </Controls>
      </CardHead>

      <ChartArea
        ref={chartAreaRef}
        className={[selectMode ? 'mode-select' : '', panActive ? 'panning' : ''].join(' ').trim()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {stores.length === 0 && (
          <EmptyOverlay role="status" aria-live="polite">
            <EmptyTitle>Нет данных</EmptyTitle>
            <EmptyHint>
              Проверьте метрики X/Y и измерение магазина в настройках
            </EmptyHint>
          </EmptyOverlay>
        )}
        <ChartSvg
          ref={svgRef}
          onClick={handleSvgClick}
          onDoubleClick={handleSvgDoubleClick}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
          onKeyDown={handleSvgKeyDown}
        />
        <SelectionOverlay>
          {selectMode === 'rect' && selectionStart && selectionPath.length > 0 && (
            <div
              className="selection-rect"
              style={{
                left: Math.min(selectionStart.x, selectionPath[selectionPath.length - 1].x),
                top: Math.min(selectionStart.y, selectionPath[selectionPath.length - 1].y),
                width: Math.abs(selectionPath[selectionPath.length - 1].x - selectionStart.x),
                height: Math.abs(selectionPath[selectionPath.length - 1].y - selectionStart.y),
              }}
            />
          )}
          {selectMode === 'lasso' && selectionPath.length > 1 && (
            <LassoSvg width="100%" height="100%">
              <path
                className="selection-lasso"
                d={
                  selectionPath
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(0)} ${p.y.toFixed(0)}`)
                    .join(' ') + ' Z'
                }
              />
            </LassoSvg>
          )}
        </SelectionOverlay>

        {/* Quadrant annotations */}
        {quadrantStats &&
          enableQuadrantAnnotations &&
          annotationPositions &&
          (Object.keys(quadrants) as QuadrantKey[]).map((key) => {
            const pos = annotationPositions[key];
            const q = quadrants[key];
            const stat = quadrantStats[key];
            // color достаточно для стилизации .qa-label/border — CSS caret-color
            // не нужен, дополнительная CSS-переменная --qa-color упразднена.
            const style: React.CSSProperties = { color: q.color };
            if ('left' in pos && pos.left !== undefined) style.left = pos.left;
            if ('right' in pos && pos.right !== undefined) style.right = pos.right;
            if ('top' in pos && pos.top !== undefined) style.top = pos.top;
            if ('bottom' in pos && pos.bottom !== undefined) style.bottom = pos.bottom;
            return (
              <QuadAnnot key={key} side={pos.side} style={style}>
                <div className="qa-label" style={{ color: q.color }}>
                  {q.label}
                </div>
                <div className="qa-count">
                  {formatCount(stat.count)}
                  <span className="u">объектов</span>
                </div>
                {stat.loss > 0 && (
                  <div className="qa-loss">{formatLoss(stat.loss)} потерь</div>
                )}
              </QuadAnnot>
            );
          })}
      </ChartArea>

      <LegendRoot>
        <LegendList
          formats={formats}
          hiddenFormats={hiddenFormats}
          onToggle={(id, solo) => {
            if (solo) {
              // Ctrl/Meta+Click: solo-mode = показать ТОЛЬКО этот формат.
              // Если уже в solo-state для того же id (все остальные скрыты,
              // этот видим) → reset, показать все. UX: toggle solo on/off.
              const others = formats.map((f) => f.id).filter((x) => x !== id);
              const inSoloForThis =
                !hiddenFormats.has(id) &&
                others.every((x) => hiddenFormats.has(x));
              setHiddenFormats(inSoloForThis ? new Set() : new Set(others));
              return;
            }
            const next = new Set(hiddenFormats);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setHiddenFormats(next);
          }}
        />
      </LegendRoot>

    </CardRoot>
    {/* Tooltip + drill modals — через React Portal в document.body, чтобы:
        (а) position:fixed работал относительно viewport, а не CardRoot
            (CardRoot имеет container-type + animation transform → containing block);
        (б) модалка центрировалась по экрану, не залезала внутрь чарта.
        PortalRoot прокидывает CSS-переменные темы (без него var(--g100) etc. unset). */}
    {createPortal(
      <PortalRoot data-theme={themeMode}>
        <Tooltip ref={tooltipRef} role="tooltip" aria-hidden="true" />

        {overlapState && (
          <OverlapList
            ref={overlapRef}
            data-visible="true"
            data-locked={overlapState.locked ? 'true' : 'false'}
            role="listbox"
            aria-label={`${overlapState.stores.length} магазинов в этой точке`}
            style={{
              left: Math.min(overlapState.x + 14, window.innerWidth - 240),
              top: Math.min(overlapState.y + 14, window.innerHeight - 220),
            }}
            onMouseLeave={() => {
              // Locked-popup игнорирует mouseleave: остаётся пока юзер не нажмёт Esc.
              if (!overlapState.locked) closeOverlap();
            }}
          >
            <div className="ol-head">
              {overlapState.stores.length} магазинов рядом
            </div>
            {overlapState.stores.map((s) => {
              const color = formatColorMap.get(s.format) || 'var(--g500)';
              return (
                <button
                  key={s.id}
                  type="button"
                  className="ol-row"
                  role="option"
                  aria-selected={activeFilters.has(s.id)}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      if (drillEnabled) setDrillStoreId(s.id);
                    } else {
                      toggleFilter(s.id);
                    }
                  }}
                  onMouseEnter={() => {
                    // Hover на строке popup'а → детальный store-tooltip СПРАВА
                    // от popup'а (fallback'и: слева → над → под).
                    if (overlapRef.current) {
                      showTooltipBesidePopup(
                        buildStoreTooltip(s),
                        overlapRef.current,
                      );
                    }
                  }}
                  onMouseLeave={() => {
                    hideTooltip();
                  }}
                >
                  <span className="ol-dot" style={{ background: color }} />
                  <span className="ol-name">{s.name}</span>
                </button>
              );
            })}
            <div className="ol-foot">
              {overlapState.locked
                ? 'Esc — закрыть'
                : 'Ctrl — зафиксировать'}
            </div>
          </OverlapList>
        )}

        {drillEnabled && drillStoreId && (
          <StoreDrillModal
            storeId={drillStoreId}
            stores={stores}
            quadrants={quadrants}
            thresholds={thresholds}
            formatColorMap={formatColorMap}
            formatX={formatX}
            formatY={formatY}
            formatSize={formatSize}
            formatLoss={formatLoss}
            xShort={xShort}
            yShort={yShort}
            sizeUnit={sizeUnit}
            detailQueryParams={detailQueryParams}
            onClose={() => setDrillStoreId(null)}
          />
        )}

        {/*
          Каскад: quadrant модаль остаётся смонтированной под store-модалью
          (store имеет z-index: 1100 и перекрывает). Это сохраняет её state
          (поиск, скролл), и при закрытии store она вновь становится видимой.
        */}
        {drillEnabled && drillQuadrant && (
          <QuadrantDrillModal
            quadrantKey={drillQuadrant}
            quadrants={quadrants}
            thresholds={thresholds}
            stores={visibleStores}
            allStoresTotal={stores.length}
            formatColorMap={formatColorMap}
            formatX={formatX}
            formatY={formatY}
            formatLoss={formatLoss}
            formatCount={formatCount}
            xShort={xShort}
            yShort={yShort}
            onClose={() => setDrillQuadrant(null)}
            onOpenStore={(id) => setDrillStoreId(id)}
          />
        )}
      </PortalRoot>,
      document.body,
    )}
    </>
  );
};

export default ScatterRisk;
