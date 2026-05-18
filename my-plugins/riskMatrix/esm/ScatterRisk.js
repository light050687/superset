import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { styled } from '@superset-ui/core';
import { CardRoot, CardHead, TitleBlock, CardTitle, CardSubtitle, Controls, ChartArea, ChartSvg, SelectionOverlay, QuadAnnot, Legend as LegendRoot, Footer, Tooltip, EmptyBlock, KEYFRAMES_CSS, PartialBadge, StaleBar, } from './styles';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */
/** Overlay поверх ChartArea, когда нет данных. */
const EmptyOverlay = styled(EmptyBlock) `
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
const EmptyTitle = styled.div `
  font-size: var(--fs-interactive);
  font-weight: 700;
  color: var(--g700);
`;
/** Подсказка пустого состояния (рекомендация по настройке). */
const EmptyHint = styled.div `
  font-size: var(--fs-meta);
  color: var(--g500);
`;
/** SVG-overlay для lasso-выбора: кладётся абсолютно поверх ChartArea. */
const LassoSvg = styled.svg `
  position: absolute;
  inset: 0;
  pointer-events: none;
`;
import ToolbarBar from './Toolbar';
import LegendList from './Legend';
import { getQuadrant, getQuadrantStats, getWorstN } from './utils/quadrants';
import { pickStep, formatStep, radius, hexToRgba, pointInPolygon, pointInRect, } from './utils/scales';
import StoreDrillModal from './StoreDrillModal';
import QuadrantDrillModal from './QuadrantDrillModal';
const PADDING = { top: 28, right: 28, bottom: 50, left: 56 };
/**
 * Резолвит цвет формата: если цвет из transformProps есть — берём его;
 * иначе возвращаем нейтральный серый из темы (--g500), не хардкод.
 */
function resolveFormatColor(map, format, hostEl) {
    const fromMap = map.get(format);
    if (fromMap)
        return fromMap;
    if (hostEl) {
        const fallback = getComputedStyle(hostEl).getPropertyValue('--g500').trim();
        if (fallback)
            return fallback;
    }
    return 'currentColor';
}
const ScatterRisk = (props) => {
    const { width, height, stores, formats, thresholdX, thresholdY, hasThresholds, quadrants, enableQuadrantAnnotations, enableWorstStar, title, subtitle, xLabel, yLabel, xUnit, yUnit, sizeUnit, formatX, formatY, formatSize, formatLoss, formatCount, xShort, yShort, isDarkMode, setDataMask, filterState, storeColumn, drillEnabled, detailQueryParams, shortcutsHint, dataState, } = props;
    // ── State ──
    const [hiddenFormats, setHiddenFormats] = useState(new Set());
    const [activeFilters, setActiveFilters] = useState(() => {
        const initial = filterState?.value;
        if (Array.isArray(initial))
            return new Set(initial.map(String));
        return new Set();
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [viewDomain, setViewDomain] = useState(null);
    const [selectMode, setSelectMode] = useState(null);
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionPath, setSelectionPath] = useState([]);
    const [selectionActive, setSelectionActive] = useState(false);
    const [panActive, setPanActive] = useState(false);
    const [drillStoreId, setDrillStoreId] = useState(null);
    const [drillQuadrant, setDrillQuadrant] = useState(null);
    // ── Refs (mutable state, без перерендера) ──
    const chartAreaRef = useRef(null);
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const scalesRef = useRef(null);
    const panStartRef = useRef(null);
    // ── Отображаемые магазины после legend-фильтра ──
    const visibleStores = useMemo(() => stores.filter((s) => !hiddenFormats.has(s.format)), [stores, hiddenFormats]);
    // ── Auto domain ──
    const autoDomain = useMemo(() => {
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
    const thresholds = useMemo(() => ({ x: thresholdX, y: thresholdY }), [thresholdX, thresholdY]);
    // ── Worst-5 ──
    const worst5 = useMemo(() => getWorstN(visibleStores, 5), [visibleStores]);
    // ── Size range для radius() ──
    const sizeRange = useMemo(() => {
        if (visibleStores.length === 0)
            return { min: 1, max: 2 };
        let min = Infinity;
        let max = -Infinity;
        for (const s of visibleStores) {
            if (s.size < min)
                min = s.size;
            if (s.size > max)
                max = s.size;
        }
        if (!Number.isFinite(min) || !Number.isFinite(max))
            return { min: 1, max: 2 };
        return { min, max: Math.max(max, min + 1) };
    }, [visibleStores]);
    // ── Map formatId → color ──
    const formatColorMap = useMemo(() => {
        const map = new Map();
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
    const pushFilter = useCallback((ids) => {
        if (!setDataMask || !storeColumn)
            return;
        const vals = Array.from(ids);
        if (vals.length === 0) {
            setDataMask({
                extraFormData: { filters: [] },
                filterState: { value: null },
            });
        }
        else {
            setDataMask({
                extraFormData: {
                    filters: [{ col: storeColumn, op: 'IN', val: vals }],
                },
                filterState: { value: vals },
            });
        }
    }, [setDataMask, storeColumn]);
    const commitFilters = useCallback((next) => {
        setActiveFilters(next);
        pushFilter(next);
    }, [pushFilter]);
    const toggleFilter = useCallback((id) => {
        const next = new Set(activeFilters);
        if (next.has(id))
            next.delete(id);
        else
            next.add(id);
        commitFilters(next);
    }, [activeFilters, commitFilters]);
    // ── Tooltip ──
    const showTooltip = useCallback((html, clientX, clientY) => {
        const el = tooltipRef.current;
        if (!el)
            return;
        el.innerHTML = html;
        el.setAttribute('data-visible', 'true');
        positionTooltip(clientX, clientY);
    }, []);
    const positionTooltip = (clientX, clientY) => {
        const el = tooltipRef.current;
        if (!el)
            return;
        const offset = 14;
        const tw = el.offsetWidth;
        const th = el.offsetHeight;
        let x = clientX + offset;
        let y = clientY + offset;
        if (x + tw > window.innerWidth - 8)
            x = clientX - tw - offset;
        if (y + th > window.innerHeight - 8)
            y = clientY - th - offset;
        if (x < 8)
            x = 8;
        if (y < 8)
            y = 8;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    };
    const hideTooltip = useCallback(() => {
        const el = tooltipRef.current;
        if (!el)
            return;
        el.setAttribute('data-visible', 'false');
    }, []);
    // ── Build tooltip HTML для точки ──
    const buildStoreTooltip = useCallback((s) => {
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
        const isWorst = worst5.has(s.id);
        const escape = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Усекаем длинные строки для tooltip (защита от layout overflow).
        const truncate = (v, max = 60) => v.length > max ? `${v.slice(0, max - 1)}…` : v;
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
        const footer = drillEnabled
            ? '<div class="tt-foot"><kbd>Click</kbd> фильтр · <kbd>Ctrl</kbd>+<kbd>Click</kbd> детализация</div>'
            : '<div class="tt-foot"><kbd>Click</kbd> фильтр</div>';
        return `
        <div class="tt-head">
          <div class="tt-status" style="background:${fmtColor}"></div>
          <div class="tt-titles">
            <div class="tt-name">${escape(truncate(s.name, 60))}${isWorst ? ' ★' : ''}</div>
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
        ${footer}
      `;
    }, [formatColorMap, thresholds, quadrants, worst5, xShort, yShort, formatX, formatY, formatLoss, formatSize, sizeUnit, drillEnabled]);
    // ── Rendering SVG content ──
    const renderSvg = useCallback(() => {
        const svg = svgRef.current;
        const area = chartAreaRef.current;
        if (!svg || !area)
            return;
        const W = area.clientWidth;
        const H = area.clientHeight;
        if (W <= 0 || H <= 0)
            return;
        const innerW = W - PADDING.left - PADDING.right;
        const innerH = H - PADDING.top - PADDING.bottom;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('width', String(W));
        svg.setAttribute('height', String(H));
        const dom = viewDomain ?? autoDomain;
        const { xMin, xMax, yMin, yMax } = dom;
        if (xMax - xMin <= 0 || yMax - yMin <= 0)
            return;
        const xScale = (v) => PADDING.left + ((v - xMin) / (xMax - xMin)) * innerW;
        const yScale = (v) => PADDING.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
        scalesRef.current = { xScale, yScale, xMin, xMax, yMin, yMax, innerW, innerH };
        const tx = thresholds.x;
        const ty = thresholds.y;
        const txPx = Math.max(PADDING.left, Math.min(PADDING.left + innerW, xScale(tx)));
        const tyPx = Math.max(PADDING.top, Math.min(PADDING.top + innerH, yScale(ty)));
        // Читаем CSS-переменные темы; если переменная не установлена —
        // возвращаем currentColor, чтобы SVG наследовал цвет контейнера.
        const css = (varName) => getComputedStyle(area).getPropertyValue(varName).trim() || 'currentColor';
        const g200 = css('--g200');
        const g400 = css('--g400');
        const g500 = css('--g500');
        const g600 = css('--g600');
        const dnCol = css('--dn');
        const inkCol = css('--ink');
        let content = '';
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
        // Gridlines X
        const xStep = pickStep(xMax - xMin, 7);
        const xStart = Math.ceil(xMin / xStep) * xStep;
        for (let v = xStart; v <= xMax + 1e-9; v += xStep) {
            const x = xScale(v);
            if (x < PADDING.left - 1 || x > PADDING.left + innerW + 1)
                continue;
            content += `<line x1="${x.toFixed(1)}" y1="${PADDING.top}" x2="${x.toFixed(1)}" y2="${PADDING.top + innerH}" stroke="${g200}" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>`;
            const label = formatStep(v, xStep) + (xUnit ? `${xUnit}` : '');
            content += `<text x="${x.toFixed(1)}" y="${PADDING.top + innerH + 16}" font-family="JetBrains Mono, monospace" font-size="9" fill="${g500}" text-anchor="middle">${label}</text>`;
        }
        // Gridlines Y
        const yStep = pickStep(yMax - yMin, 7);
        const yStart = Math.ceil(yMin / yStep) * yStep;
        for (let v = yStart; v <= yMax + 1e-9; v += yStep) {
            const y = yScale(v);
            if (y < PADDING.top - 1 || y > PADDING.top + innerH + 1)
                continue;
            content += `<line x1="${PADDING.left}" y1="${y.toFixed(1)}" x2="${PADDING.left + innerW}" y2="${y.toFixed(1)}" stroke="${g200}" stroke-width="1" stroke-dasharray="2 4" opacity="0.7"/>`;
            const label = formatStep(v, yStep) + (yUnit ? `${yUnit}` : '');
            content += `<text x="${PADDING.left - 8}" y="${(y + 3).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="9" fill="${g500}" text-anchor="end">${label}</text>`;
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
        // Axis labels
        const escapeXml = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        content += `<text x="${PADDING.left + innerW / 2}" y="${H - 8}" font-family="Manrope, sans-serif" font-size="10" font-weight="600" fill="${g600}" text-anchor="middle">${escapeXml(xLabel)}</text>`;
        content += `<text x="14" y="${PADDING.top + innerH / 2}" font-family="Manrope, sans-serif" font-size="10" font-weight="600" fill="${g600}" text-anchor="middle" transform="rotate(-90 14 ${PADDING.top + innerH / 2})">${escapeXml(yLabel)}</text>`;
        // Points
        const hasSearch = searchQuery.trim().length > 0;
        const q = searchQuery.trim().toLowerCase();
        const hasFilters = activeFilters.size > 0;
        // Labels для ARIA — формируем один раз за render
        const CURR_LABELS = { x: xShort, y: yShort };
        const sorted = [...visibleStores].sort((a, b) => radius(b.size, sizeRange.min, sizeRange.max) - radius(a.size, sizeRange.min, sizeRange.max));
        sorted.forEach((s) => {
            if (s.x < xMin || s.x > xMax || s.y < yMin || s.y > yMax)
                return;
            const x = xScale(s.x);
            const y = yScale(s.y);
            const r = radius(s.size, sizeRange.min, sizeRange.max);
            const color = resolveFormatColor(formatColorMap, s.format, chartAreaRef.current);
            const fill = hexToRgba(color, 0.55);
            const matchSearch = !hasSearch ||
                s.name.toLowerCase().includes(q) ||
                (s.city?.toLowerCase().includes(q) ?? false);
            const isFound = hasSearch && matchSearch;
            const isDimmed = hasSearch && !matchSearch;
            const isFiltered = activeFilters.has(s.id);
            const dimByFilter = hasFilters && !isFiltered;
            const isEffectivelyDimmed = isDimmed || dimByFilter;
            const isWorst = enableWorstStar && worst5.has(s.id);
            const classes = ['pt'];
            if (isFound || isFiltered)
                classes.push('found');
            if (isEffectivelyDimmed)
                classes.push('dim');
            // role="img" + aria-label — корректная семантика для SVG-точки (не кнопки).
            // Кликабельность и keyboard handlers (Enter/Space) установлены на SVG-контейнере.
            content += `<circle class="${classes.join(' ')}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${color}" stroke-width="1.2" data-id="${s.id}" tabindex="0" role="img" aria-label="${escapeXml(s.name)}: ${CURR_LABELS.x} ${escapeXml(formatX(s.x))}, ${CURR_LABELS.y} ${escapeXml(formatY(s.y))}"/>`;
            if (isWorst) {
                const sx = x;
                const sy = y - r - 7;
                content += `<g class="worst-star" transform="translate(${sx.toFixed(1)},${sy.toFixed(1)})" pointer-events="none"><path d="M0 -5 L1.5 -1.5 L5 -1 L2.3 1.3 L3 5 L0 3 L-3 5 L-2.3 1.3 L-5 -1 L-1.5 -1.5 Z" fill="${dnCol}" stroke="${inkCol}" stroke-width="0.5"/></g>`;
            }
        });
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
        worst5,
        xLabel,
        yLabel,
        xUnit,
        yUnit,
        enableWorstStar,
        sizeRange,
    ]);
    // Rerender on relevant changes
    useEffect(() => {
        renderSvg();
    }, [renderSvg, width, height]);
    // Resize observer
    useEffect(() => {
        const area = chartAreaRef.current;
        if (!area)
            return;
        const ro = new ResizeObserver(() => renderSvg());
        ro.observe(area);
        return () => ro.disconnect();
    }, [renderSvg]);
    // ── Point click (delegation) ──
    const handleSvgClick = useCallback((e) => {
        if (selectMode)
            return;
        const target = e.target;
        // Точка
        if (target.classList.contains('pt')) {
            e.stopPropagation();
            const id = target.getAttribute('data-id');
            if (!id)
                return;
            if (e.ctrlKey || e.metaKey) {
                if (drillEnabled)
                    setDrillStoreId(id);
            }
            else {
                toggleFilter(id);
            }
            return;
        }
        // Квадрант
        if (target.classList.contains('qa-bg-rect')) {
            const qKey = target.getAttribute('data-quadrant');
            if (!qKey)
                return;
            if (e.ctrlKey || e.metaKey) {
                if (drillEnabled)
                    setDrillQuadrant(qKey);
            }
            else {
                const inQuad = visibleStores
                    .filter((s) => getQuadrant(s, thresholds) === qKey)
                    .map((s) => s.id);
                if (inQuad.length === 0)
                    return;
                const allSelected = inQuad.every((id) => activeFilters.has(id));
                const next = new Set(activeFilters);
                if (allSelected)
                    inQuad.forEach((id) => next.delete(id));
                else
                    inQuad.forEach((id) => next.add(id));
                commitFilters(next);
            }
        }
    }, [selectMode, drillEnabled, toggleFilter, visibleStores, thresholds, activeFilters, commitFilters]);
    const handleSvgDoubleClick = useCallback((e) => {
        if (!drillEnabled || selectMode)
            return;
        const target = e.target;
        if (target.classList.contains('pt')) {
            const id = target.getAttribute('data-id');
            if (id)
                setDrillStoreId(id);
        }
    }, [drillEnabled, selectMode]);
    // ── Hover для tooltip (delegation + mousemove) ──
    const handleSvgMouseMove = useCallback((e) => {
        const target = e.target;
        if (target.classList.contains('pt')) {
            const id = target.getAttribute('data-id');
            const s = stores.find((x) => x.id === id);
            if (s) {
                showTooltip(buildStoreTooltip(s), e.clientX, e.clientY);
                return;
            }
        }
        hideTooltip();
    }, [stores, showTooltip, hideTooltip, buildStoreTooltip]);
    const handleSvgMouseLeave = useCallback(() => hideTooltip(), [hideTooltip]);
    // ── Mouse handlers для pan + select ──
    const getMouseInArea = (e) => {
        const area = chartAreaRef.current;
        if (!area)
            return { x: 0, y: 0 };
        const rect = area.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const inChartBounds = (p) => {
        const s = scalesRef.current;
        if (!s)
            return false;
        return (p.x >= PADDING.left &&
            p.x <= PADDING.left + s.innerW &&
            p.y >= PADDING.top &&
            p.y <= PADDING.top + s.innerH);
    };
    const handleMouseDown = (e) => {
        const target = e.target;
        if (target.classList?.contains('pt'))
            return;
        if (selectMode) {
            const p = getMouseInArea(e);
            if (!inChartBounds(p))
                return;
            setSelectionStart(p);
            setSelectionPath([p]);
            setSelectionActive(true);
            e.preventDefault();
            return;
        }
        const p = getMouseInArea(e);
        if (!inChartBounds(p))
            return;
        const dom = viewDomain ?? autoDomain;
        panStartRef.current = { mouse: p, domain: { ...dom } };
    };
    const handleMouseMove = (e) => {
        if (selectMode && selectionActive) {
            const p = getMouseInArea(e);
            if (selectMode === 'rect') {
                setSelectionStart((prev) => prev); // no-op но триггерит перерендер оверлея
                setSelectionPath([selectionStart ?? p, p]);
            }
            else if (selectMode === 'lasso') {
                setSelectionPath((prev) => [...prev, p]);
            }
            return;
        }
        if (!panStartRef.current)
            return;
        const s = scalesRef.current;
        if (!s)
            return;
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
    const applySelection = useCallback((hitTest) => {
        const s = scalesRef.current;
        if (!s)
            return;
        const next = new Set(activeFilters);
        visibleStores.forEach((store) => {
            if (store.x < s.xMin || store.x > s.xMax)
                return;
            if (store.y < s.yMin || store.y > s.yMax)
                return;
            const px = s.xScale(store.x);
            const py = s.yScale(store.y);
            if (hitTest({ x: px, y: py }))
                next.add(store.id);
        });
        commitFilters(next);
    }, [activeFilters, visibleStores, commitFilters]);
    const handleMouseUp = (e) => {
        if (selectMode && selectionActive) {
            setSelectionActive(false);
            const p = getMouseInArea(e);
            if (selectMode === 'rect' && selectionStart) {
                const r = {
                    x: Math.min(selectionStart.x, p.x),
                    y: Math.min(selectionStart.y, p.y),
                    w: Math.abs(p.x - selectionStart.x),
                    h: Math.abs(p.y - selectionStart.y),
                };
                if (r.w > 4 && r.h > 4) {
                    applySelection((pt) => pointInRect(pt, r));
                }
            }
            else if (selectMode === 'lasso' && selectionPath.length > 3) {
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
    const handleWheel = useCallback((e) => {
        if (selectMode)
            return;
        const s = scalesRef.current;
        if (!s)
            return;
        const area = chartAreaRef.current;
        if (!area)
            return;
        const rect = area.getBoundingClientRect();
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (!inChartBounds(p))
            return;
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
    }, [selectMode, viewDomain, autoDomain]);
    useEffect(() => {
        const area = chartAreaRef.current;
        if (!area)
            return;
        area.addEventListener('wheel', handleWheel, { passive: false });
        return () => area.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);
    // ── Select actions ──
    const onSelectAction = useCallback((action) => {
        if (action === 'rect' || action === 'lasso') {
            setSelectMode((m) => (m === action ? null : action));
            return;
        }
        if (action === 'worst5') {
            const next = new Set(worst5);
            setSelectMode(null);
            commitFilters(next);
            return;
        }
        if (action === 'bad') {
            const next = new Set();
            visibleStores.forEach((s) => {
                const overX = s.planX != null ? s.x > s.planX : s.x > thresholds.x;
                const overY = s.planY != null ? s.y > s.planY : s.y > thresholds.y;
                if (overX || overY)
                    next.add(s.id);
            });
            setSelectMode(null);
            commitFilters(next);
        }
    }, [worst5, visibleStores, thresholds, commitFilters]);
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
        if (!q)
            return [];
        return visibleStores
            .filter((s) => s.name.toLowerCase().includes(q) ||
            (s.city?.toLowerCase().includes(q) ?? false))
            .map((s) => s.id);
    }, [searchQuery, visibleStores]);
    const onSearchSelect = useCallback(() => {
        if (searchMatches.length === 0)
            return;
        const next = new Set(activeFilters);
        searchMatches.forEach((id) => next.add(id));
        commitFilters(next);
        setSearchQuery('');
    }, [searchMatches, activeFilters, commitFilters]);
    // ── Esc → close modal cascade ──
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (drillStoreId)
                    setDrillStoreId(null);
                else if (drillQuadrant)
                    setDrillQuadrant(null);
                else if (selectMode)
                    setSelectMode(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [drillStoreId, drillQuadrant, selectMode]);
    // ── Keyboard navigation на точках (Enter toggles, Space opens modal) ──
    const handleSvgKeyDown = useCallback((e) => {
        const target = e.target;
        if (!target.classList?.contains('pt'))
            return;
        const id = target.getAttribute('data-id');
        if (!id)
            return;
        if (e.key === 'Enter') {
            e.preventDefault();
            toggleFilter(id);
        }
        else if (e.key === ' ' || e.code === 'Space') {
            if (drillEnabled) {
                e.preventDefault();
                setDrillStoreId(id);
            }
        }
    }, [toggleFilter, drillEnabled]);
    // ── Quadrant annotations ──
    const quadrantStats = useMemo(() => (hasThresholds ? getQuadrantStats(visibleStores, thresholds) : null), [hasThresholds, visibleStores, thresholds]);
    const [annotationPositions, setAnnotationPositions] = useState(null);
    useEffect(() => {
        const area = chartAreaRef.current;
        const s = scalesRef.current;
        if (!area || !s || !hasThresholds || !enableQuadrantAnnotations) {
            if (annotationPositions !== null)
                setAnnotationPositions(null);
            return;
        }
        const PAD = 10;
        const rightOffset = PADDING.right + PAD; // от правого края chart-area
        const bottomOffset = PADDING.bottom + PAD; // от нижнего края
        const next = {
            tl: { side: 'left', left: PADDING.left + PAD, top: PADDING.top + PAD },
            tr: { side: 'right', right: rightOffset, top: PADDING.top + PAD },
            bl: { side: 'left', left: PADDING.left + PAD, bottom: bottomOffset },
            br: { side: 'right', right: rightOffset, bottom: bottomOffset },
        };
        setAnnotationPositions(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasThresholds, enableQuadrantAnnotations, width, height, viewDomain, autoDomain]);
    const themeMode = isDarkMode ? 'dark' : 'light';
    // DS 2.0 canonical: loading имеет свой раздельный return со своим CardRoot.
    // При переходе loading → loaded React unmount'ит loading-CardRoot и mount'ит
    // новый → cardInKf animation запускается ровно когда юзер видит контент.
    if (dataState === 'loading') {
        return (_jsxs(CardRoot, { "data-theme": themeMode, role: "region", "aria-busy": "true", "data-no-anim": "", children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsx(CardHead, { children: _jsx(TitleBlock, { children: _jsx(CardTitle, { children: title }) }) }), _jsx("div", { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430", style: { flex: 1 } })] }));
    }
    return (_jsxs(CardRoot, { "data-theme": themeMode, role: "region", "aria-labelledby": "sr-card-title", "data-info-hint-container": "", children: [_jsx("style", { children: KEYFRAMES_CSS }), dataState === 'stale' && _jsx(StaleBar, { "aria-hidden": "true" }), _jsxs(CardHead, { children: [_jsxs(TitleBlock, { children: [_jsxs(CardTitle, { id: "sr-card-title", children: [title, dataState === 'partial' && (_jsx(PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), _jsxs(CardSubtitle, { children: [subtitle && _jsx("span", { children: subtitle }), subtitle && _jsx("span", { className: "dot" }), _jsxs("span", { className: "strong", children: [formatCount(stores.length), " \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432"] }), activeFilters.size > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: "dot" }), _jsxs("span", { children: [formatCount(activeFilters.size), " \u0432\u044B\u0431\u0440\u0430\u043D\u043E"] })] }))] })] }), _jsxs(Controls, { children: [_jsx(ToolbarBar, { selectMode: selectMode, hasFilters: activeFilters.size > 0, onAction: onSelectAction, onReset: onReset, onClear: onClearFilters, searchQuery: searchQuery, onSearchChange: setSearchQuery, searchMatchesCount: searchMatches.length, onSearchSelect: onSearchSelect }), _jsx(InfoHintTopRight, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [_jsxs("div", { className: "hint-section", children: [_jsx("div", { className: "hint-section-title", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435" }), shortcutsHint.split(/\s*·\s*/).map((part, i) => {
                                                    const [keysRaw, ...descParts] = part.split(/\s*—\s*/);
                                                    const desc = descParts.join(' — ');
                                                    const keys = keysRaw.split(/\s*\+\s*/);
                                                    return (_jsxs("span", { className: "hi", children: [keys.map((k, ki) => (_jsxs(Fragment, { children: [_jsx("kbd", { children: k }), ki < keys.length - 1 && ' + '] }, ki))), desc && _jsxs(_Fragment, { children: [" \u2014 ", desc] })] }, i));
                                                }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }), _jsxs("div", { className: "hint-section", children: [_jsx("div", { className: "hint-section-title", children: "\u041F\u043E\u044F\u0441\u043D\u0435\u043D\u0438\u044F" }), _jsxs("span", { className: "hi", children: ["\u0420\u0430\u0437\u043C\u0435\u0440 \u043A\u0440\u0443\u0436\u043A\u0430 = ", sizeUnit] })] })] }) })] })] }), _jsxs(ChartArea, { ref: chartAreaRef, className: [selectMode ? 'mode-select' : '', panActive ? 'panning' : ''].join(' ').trim(), onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseLeave, children: [stores.length === 0 && (_jsxs(EmptyOverlay, { role: "status", "aria-live": "polite", children: [_jsx(EmptyTitle, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" }), _jsx(EmptyHint, { children: "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043C\u0435\u0442\u0440\u0438\u043A\u0438 X/Y \u0438 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0435 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445" })] })), _jsx(ChartSvg, { ref: svgRef, onClick: handleSvgClick, onDoubleClick: handleSvgDoubleClick, onMouseMove: handleSvgMouseMove, onMouseLeave: handleSvgMouseLeave, onKeyDown: handleSvgKeyDown }), _jsxs(SelectionOverlay, { children: [selectMode === 'rect' && selectionStart && selectionPath.length > 0 && (_jsx("div", { className: "selection-rect", style: {
                                    left: Math.min(selectionStart.x, selectionPath[selectionPath.length - 1].x),
                                    top: Math.min(selectionStart.y, selectionPath[selectionPath.length - 1].y),
                                    width: Math.abs(selectionPath[selectionPath.length - 1].x - selectionStart.x),
                                    height: Math.abs(selectionPath[selectionPath.length - 1].y - selectionStart.y),
                                } })), selectMode === 'lasso' && selectionPath.length > 1 && (_jsx(LassoSvg, { width: "100%", height: "100%", children: _jsx("path", { className: "selection-lasso", d: selectionPath
                                        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(0)} ${p.y.toFixed(0)}`)
                                        .join(' ') + ' Z' }) }))] }), quadrantStats &&
                        enableQuadrantAnnotations &&
                        annotationPositions &&
                        Object.keys(quadrants).map((key) => {
                            const pos = annotationPositions[key];
                            const q = quadrants[key];
                            const stat = quadrantStats[key];
                            // color достаточно для стилизации .qa-label/border — CSS caret-color
                            // не нужен, дополнительная CSS-переменная --qa-color упразднена.
                            const style = { color: q.color };
                            if ('left' in pos && pos.left !== undefined)
                                style.left = pos.left;
                            if ('right' in pos && pos.right !== undefined)
                                style.right = pos.right;
                            if ('top' in pos && pos.top !== undefined)
                                style.top = pos.top;
                            if ('bottom' in pos && pos.bottom !== undefined)
                                style.bottom = pos.bottom;
                            return (_jsxs(QuadAnnot, { side: pos.side, style: style, children: [_jsx("div", { className: "qa-label", style: { color: q.color }, children: q.label }), _jsxs("div", { className: "qa-count", children: [formatCount(stat.count), _jsx("span", { className: "u", children: "\u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432" })] }), stat.loss > 0 && (_jsxs("div", { className: "qa-loss", children: [formatLoss(stat.loss), " \u043F\u043E\u0442\u0435\u0440\u044C"] }))] }, key));
                        })] }), _jsx(LegendRoot, { children: _jsx(LegendList, { formats: formats, hiddenFormats: hiddenFormats, onToggle: (id) => {
                        const next = new Set(hiddenFormats);
                        if (next.has(id))
                            next.delete(id);
                        else
                            next.add(id);
                        setHiddenFormats(next);
                    } }) }), _jsx(Footer, { children: _jsx("div", { className: "hint", children: _jsxs("span", { className: "hi", children: [_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("circle", { cx: "8", cy: "8", r: "5" }) }), _jsxs("span", { children: ["\u0440\u0430\u0437\u043C\u0435\u0440 = ", sizeUnit] })] }) }) }), _jsx(Tooltip, { ref: tooltipRef, role: "tooltip", "aria-hidden": "true" }), drillEnabled && drillStoreId && (_jsx(StoreDrillModal, { storeId: drillStoreId, stores: stores, quadrants: quadrants, thresholds: thresholds, formatColorMap: formatColorMap, formatX: formatX, formatY: formatY, formatSize: formatSize, formatLoss: formatLoss, xShort: xShort, yShort: yShort, sizeUnit: sizeUnit, detailQueryParams: detailQueryParams, onClose: () => setDrillStoreId(null) })), drillEnabled && drillQuadrant && (_jsx(QuadrantDrillModal, { quadrantKey: drillQuadrant, quadrants: quadrants, thresholds: thresholds, stores: visibleStores, allStoresTotal: stores.length, formatColorMap: formatColorMap, formatX: formatX, formatY: formatY, formatLoss: formatLoss, formatCount: formatCount, xShort: xShort, yShort: yShort, onClose: () => setDrillQuadrant(null), onOpenStore: (id) => setDrillStoreId(id) }))] }));
};
export default ScatterRisk;
//# sourceMappingURL=ScatterRisk.js.map