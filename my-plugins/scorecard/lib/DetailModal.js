"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const core_1 = require("@superset-ui/core");
const detailApi_1 = require("./utils/detailApi");
const presets_1 = require("./mocks/presets");
const mockDetailGenerator_1 = require("./mocks/mockDetailGenerator");
const styles_1 = require("./styles");
const CLOSE_DURATION_MS = 200;
/* ── CSV Export ── */
async function exportToCsv(data, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header, factHeader, delta1Header, delta2Header, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fileHandle) {
    const BOM = '\uFEFF';
    const headers = [groupLabel, childLabel, factHeader];
    if (enableComp1) {
        headers.push(comp1Header);
        headers.push(delta1Header);
    }
    if (enableComp2) {
        headers.push(comp2Header);
        headers.push(delta2Header);
    }
    const rawNum = (v) => v != null ? String(v) : '';
    const rows = [];
    for (const group of data) {
        // Parent summary row (aggregated values for the group)
        const parentRow = [group.name, '', rawNum(group.summary.rawValue)];
        if (enableComp1)
            parentRow.push(rawNum(group.summary.rawComp1), rawNum(group.summary.rawComp1Delta));
        if (enableComp2)
            parentRow.push(rawNum(group.summary.rawComp2), rawNum(group.summary.rawComp2Delta));
        rows.push(parentRow);
        // Child rows
        for (const child of group.children) {
            const row = ['', child.name, rawNum(child.rawValue)];
            if (enableComp1)
                row.push(rawNum(child.rawComp1), rawNum(child.rawComp1Delta));
            if (enableComp2)
                row.push(rawNum(child.rawComp2), rawNum(child.rawComp2Delta));
            rows.push(row);
        }
    }
    const escape = (cell) => `"${cell.replace(/"/g, '""')}"`;
    const csv = BOM +
        [headers, ...rows].map(row => row.map(escape).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    // Write to pre-obtained file handle (from showSaveFilePicker)
    if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
    }
    // Fallback: auto-download for older browsers
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title}-detail.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}
/* ── Search icon SVG ── */
function MagnifyIcon() {
    return ((0, jsx_runtime_1.jsxs)(styles_1.SearchIcon, { width: "13", height: "13", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "7", cy: "7", r: "5" }), (0, jsx_runtime_1.jsx)("line", { x1: "10.5", y1: "10.5", x2: "14", y2: "14" })] }));
}
/* ── Table cell helpers ── */
function DeltaCell({ delta, status, }) {
    if (!delta)
        return (0, jsx_runtime_1.jsx)("td", { className: "r" });
    return ((0, jsx_runtime_1.jsx)("td", { className: "r", children: (0, jsx_runtime_1.jsx)(styles_1.TablePill, { status: status ?? 'neutral', children: delta }) }));
}
function GroupRowView({ group, expanded, isLoadingChildren, onToggle, enableComp1, enableComp2, showDelta1 = true, showDelta2 = true, }) {
    const { summary } = group;
    return ((0, jsx_runtime_1.jsxs)(styles_1.GroupRow, { onClick: onToggle, children: [(0, jsx_runtime_1.jsxs)("td", { children: [isLoadingChildren ? ((0, jsx_runtime_1.jsx)(styles_1.InlineSpinnerSmall, { "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" })) : ((0, jsx_runtime_1.jsx)(styles_1.Chevron, { expanded: expanded, "aria-hidden": "true", children: "\u25B6" })), group.name] }), (0, jsx_runtime_1.jsx)("td", { className: "r", children: summary.value }), enableComp1 && (0, jsx_runtime_1.jsx)("td", { className: "r", children: summary.comp1Value ?? '' }), enableComp1 && showDelta1 && ((0, jsx_runtime_1.jsx)(DeltaCell, { delta: summary.comp1Delta, status: summary.comp1Status })), enableComp2 && (0, jsx_runtime_1.jsx)("td", { className: "r", children: summary.comp2Value ?? '' }), enableComp2 && showDelta2 && ((0, jsx_runtime_1.jsx)(DeltaCell, { delta: summary.comp2Delta, status: summary.comp2Status }))] }));
}
function ChildRowView({ row, enableComp1, enableComp2, showDelta1 = true, showDelta2 = true, }) {
    return ((0, jsx_runtime_1.jsxs)(styles_1.ChildRow, { children: [(0, jsx_runtime_1.jsx)("td", { children: row.name }), (0, jsx_runtime_1.jsx)("td", { className: "r", children: row.value }), enableComp1 && (0, jsx_runtime_1.jsx)("td", { className: "r", children: row.comp1Value ?? '' }), enableComp1 && showDelta1 && ((0, jsx_runtime_1.jsx)(DeltaCell, { delta: row.comp1Delta, status: row.comp1Status })), enableComp2 && (0, jsx_runtime_1.jsx)("td", { className: "r", children: row.comp2Value ?? '' }), enableComp2 && showDelta2 && ((0, jsx_runtime_1.jsx)(DeltaCell, { delta: row.comp2Delta, status: row.comp2Status }))] }));
}
/* ── Helper: extract API response rows ── */
function extractApiRows(json) {
    const resultArr = json.result;
    return resultArr?.[0]?.data ?? [];
}
/* ── Main component ── */
function DetailModalInner({ isOpen, onClose, title, headerValue, queryParams, activeMode, aggregationType, colorScheme1, colorScheme2, deltaFormat1, deltaFormat2, formatValue, formatDelta, hierarchyLabelPrimary, hierarchyLabelSecondary, enableComp1, enableComp2, comp1Label, comp2Label, colFact = 'Факт', colComp1 = '', colDelta1 = 'Дельта', colComp2 = '', colDelta2 = 'Дельта', formatComp1: fmtComp1, formatComp2: fmtComp2, formatDelta1: fmtDelta1, formatDelta2: fmtDelta2, showDelta1 = true, showDelta2 = true, topN, pageSize = 20, mockModeEnabled = false, mockPreset = 'revenue', mockCustomJson, }) {
    const [isClosing, setIsClosing] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [searchScope, setSearchScope] = (0, react_1.useState)('group');
    const [exactMatch, setExactMatch] = (0, react_1.useState)(false);
    const [hierarchyMode, setHierarchyMode] = (0, react_1.useState)('primary');
    const [expandedGroups, setExpandedGroups] = (0, react_1.useState)(new Set());
    const [currentPage, setCurrentPage] = (0, react_1.useState)(0);
    const [sortColumn, setSortColumn] = (0, react_1.useState)('value');
    const [sortDirection, setSortDirection] = (0, react_1.useState)('desc');
    const modalRef = (0, react_1.useRef)(null);
    const closeRef = (0, react_1.useRef)(null);
    const isPrimary = hierarchyMode === 'primary';
    // Current hierarchy labels
    const groupLabel = isPrimary ? hierarchyLabelPrimary : hierarchyLabelSecondary;
    const childLabel = isPrimary ? hierarchyLabelSecondary : hierarchyLabelPrimary;
    // Comparison header labels (strip trailing colon for table/CSV)
    const comp1Header = colComp1 || comp1Label.replace(/:?\s*$/, '');
    const comp2Header = colComp2 || comp2Label.replace(/:?\s*$/, '');
    const delta1Header = colDelta1;
    const delta2Header = colDelta2;
    /* ── Server-side data state ── */
    const [groups, setGroups] = (0, react_1.useState)([]);
    const [hasNextPage, setHasNextPage] = (0, react_1.useState)(false);
    const [totalCount, setTotalCount] = (0, react_1.useState)(null);
    const [isInitialLoading, setIsInitialLoading] = (0, react_1.useState)(true);
    const [isRefreshing, setIsRefreshing] = (0, react_1.useState)(false);
    const [fetchError, setFetchError] = (0, react_1.useState)(null);
    const [expandedChildren, setExpandedChildren] = (0, react_1.useState)(new Map());
    const [loadingChildren, setLoadingChildren] = (0, react_1.useState)(new Set());
    const [isExporting, setIsExporting] = (0, react_1.useState)(false);
    // Abort controllers
    const groupsAbortRef = (0, react_1.useRef)(null);
    const childrenAbortRef = (0, react_1.useRef)(new Map());
    const hasEverLoaded = (0, react_1.useRef)(false);
    /* ── Debounced search ── */
    const [debouncedSearch, setDebouncedSearch] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    /* ── Resolve metric labels for current mode ── */
    const isA = activeMode === 'a';
    const metricLabel = isA ? queryParams.metricALabel : queryParams.metricBLabel;
    const comp1Label_ = isA ? queryParams.comp1LabelA : queryParams.comp1LabelB;
    const comp2Label_ = isA ? queryParams.comp2LabelA : queryParams.comp2LabelB;
    const delta1Label_ = isA ? queryParams.delta1LabelA : queryParams.delta1LabelB;
    const delta2Label_ = isA ? queryParams.delta2LabelA : queryParams.delta2LabelB;
    // Shared formatting options for formatServerRow
    const fmtOpts = {
        aggregationType,
        formatValue,
        formatDelta,
        colorScheme1,
        colorScheme2,
        enableComp1,
        enableComp2,
        deltaFormat1,
        deltaFormat2,
        fmtComp1,
        fmtComp2,
        fmtDelta1,
        fmtDelta2,
        showDelta1,
        showDelta2,
    };
    /* ── Resolve groupby columns ── */
    const groupbyCol = isPrimary ? queryParams.groupbyPrimary : queryParams.groupbySecondary;
    const childCol = isPrimary ? queryParams.groupbySecondary : queryParams.groupbyPrimary;
    /* ── fetchGroups: main server-side paginated query ── */
    (0, react_1.useEffect)(() => {
        if (!isOpen)
            return;
        // Abort previous request
        groupsAbortRef.current?.abort();
        const controller = new AbortController();
        groupsAbortRef.current = controller;
        // Stale-while-revalidate: spinner only on first ever load
        if (!hasEverLoaded.current) {
            setIsInitialLoading(true);
        }
        else {
            setIsRefreshing(true);
        }
        setFetchError(null);
        const metrics = isA ? queryParams.metricsA : queryParams.metricsB;
        if (!groupbyCol || (!mockModeEnabled && metrics.length === 0)) {
            setGroups([]);
            setIsInitialLoading(false);
            setIsRefreshing(false);
            return;
        }
        // Resolve sort target for server
        const sortTarget = (0, detailApi_1.resolveSortTarget)(sortColumn, groupbyCol, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_);
        const effectivePageSize = topN > 0 ? Math.min(pageSize, topN) : pageSize;
        const payload = (0, detailApi_1.buildGroupsPayload)({
            queryParams,
            activeMode,
            groupbyCol,
            childCol,
            page: currentPage,
            pageSize: effectivePageSize,
            sortTarget,
            sortAsc: sortDirection === 'asc',
            searchQuery: debouncedSearch,
            searchScope,
            exactMatch,
            metricLabel,
        });
        // ── Mock mode: generate data locally ──
        if (mockModeEnabled) {
            const preset = (0, presets_1.getPreset)(mockPreset, mockCustomJson);
            const mockResult = (0, mockDetailGenerator_1.generateMockGroups)({
                preset,
                groupbyCol: groupbyCol || 'centrum_code',
                childCol: childCol || 'category_code',
                page: currentPage,
                pageSize: effectivePageSize,
                sortAsc: sortDirection === 'asc',
                searchQuery: debouncedSearch,
                exactMatch,
                isModeBActive: activeMode === 'b',
            });
            const mockGroupby = groupbyCol || 'centrum_code';
            const formatted = mockResult.rows.map(row => {
                // Map __mock_* keys to metric labels for formatServerRow
                const mapped = { [mockGroupby]: row[mockGroupby] };
                mapped[metricLabel] = row.__mock_main;
                if (comp1Label_)
                    mapped[comp1Label_] = row.__mock_comp1;
                if (comp2Label_)
                    mapped[comp2Label_] = row.__mock_comp2;
                return (0, detailApi_1.formatServerRow)(mapped, mockGroupby, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts);
            });
            setGroups(formatted.map(f => ({
                name: f.name,
                summary: f.summary,
                children: [],
            })));
            setHasNextPage(mockResult.totalCount > (currentPage + 1) * effectivePageSize);
            setTotalCount(mockResult.totalCount);
            setExpandedGroups(new Set());
            setExpandedChildren(new Map());
            hasEverLoaded.current = true;
            setIsInitialLoading(false);
            setIsRefreshing(false);
            return;
        }
        // ── Real data: server-side query ──
        core_1.SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: payload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = extractApiRows(json);
            const hasMore = rows.length > effectivePageSize;
            const displayRows = hasMore ? rows.slice(0, effectivePageSize) : rows;
            const formatted = displayRows.map(row => (0, detailApi_1.formatServerRow)(row, groupbyCol, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts));
            setGroups(formatted.map(f => ({
                name: f.name,
                summary: f.summary,
                children: [], // children loaded lazily on expand
            })));
            setHasNextPage(hasMore);
            // Reset expanded state on new data (page/sort/search change)
            setExpandedGroups(new Set());
            setExpandedChildren(new Map());
            hasEverLoaded.current = true;
            setIsInitialLoading(false);
            setIsRefreshing(false);
        })
            .catch((err) => {
            if (err.name !== 'AbortError') {
                setFetchError('Ошибка загрузки данных');
                setIsInitialLoading(false);
                setIsRefreshing(false);
            }
        });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeMode, currentPage, sortColumn, sortDirection, hierarchyMode, debouncedSearch, searchScope, exactMatch, queryParams.datasourceId, mockModeEnabled, mockPreset]);
    /* ── fetchTotalCount: exact count of non-zero groups ── */
    (0, react_1.useEffect)(() => {
        if (!isOpen || !groupbyCol)
            return;
        // Mock mode: totalCount already set in fetchGroups
        if (mockModeEnabled)
            return;
        // AbortController prevents setState after unmount
        const controller = new AbortController();
        const countPayload = (0, detailApi_1.buildCountPayload)({
            queryParams,
            activeMode,
            groupbyCol,
            childCol,
            searchQuery: debouncedSearch,
            searchScope,
            exactMatch,
            metricLabel,
        });
        core_1.SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: countPayload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = extractApiRows(json);
            setTotalCount(rows.length);
        })
            .catch((err) => {
            if (err.name !== 'AbortError') {
                setTotalCount(null);
            }
        });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeMode, hierarchyMode, debouncedSearch, searchScope, exactMatch, queryParams.datasourceId]);
    /* ── fetchChildren: load children on group expand ── */
    const fetchChildren = (0, react_1.useCallback)((groupName) => {
        // Already loaded — just toggle visibility
        if (expandedChildren.has(groupName)) {
            setExpandedGroups(prev => {
                const next = new Set(prev);
                if (next.has(groupName))
                    next.delete(groupName);
                else
                    next.add(groupName);
                return next;
            });
            return;
        }
        if (!groupbyCol || !childCol)
            return;
        setLoadingChildren(prev => new Set(prev).add(groupName));
        // ── Mock mode: generate children locally ──
        if (mockModeEnabled) {
            const preset = (0, presets_1.getPreset)(mockPreset, mockCustomJson);
            // Find parent's main value from current groups
            const parentGroup = groups.find(g => g.name === groupName);
            const parentMainRaw = parentGroup?.summary.rawValue ?? 0;
            const mockRows = (0, mockDetailGenerator_1.generateMockChildren)({
                preset,
                groupName,
                childCol,
                parentMainValue: parentMainRaw || preset.mainA / preset.groupCount,
                isModeBActive: activeMode === 'b',
            });
            const children = mockRows.map(row => {
                const mapped = { [childCol]: row[childCol] };
                mapped[metricLabel] = row.__mock_main;
                if (comp1Label_)
                    mapped[comp1Label_] = row.__mock_comp1;
                if (comp2Label_)
                    mapped[comp2Label_] = row.__mock_comp2;
                return (0, detailApi_1.formatServerRow)(mapped, childCol, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts).summary;
            });
            setExpandedChildren(prev => { const next = new Map(prev); next.set(groupName, children); return next; });
            setExpandedGroups(prev => { const next = new Set(prev); next.add(groupName); return next; });
            setLoadingChildren(prev => { const next = new Set(prev); next.delete(groupName); return next; });
            return;
        }
        // ── Real data: server-side query ──
        // Abort previous request for this group
        childrenAbortRef.current.get(groupName)?.abort();
        const controller = new AbortController();
        childrenAbortRef.current.set(groupName, controller);
        const payload = (0, detailApi_1.buildChildrenPayload)({
            queryParams,
            activeMode,
            parentCol: groupbyCol,
            parentValue: groupName,
            childCol,
            metricLabel,
            searchQuery: debouncedSearch,
            searchScope,
            exactMatch,
        });
        core_1.SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: payload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = extractApiRows(json);
            const children = rows.map(row => (0, detailApi_1.formatServerRow)(row, childCol, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts).summary);
            setExpandedChildren(prev => {
                const next = new Map(prev);
                next.set(groupName, children);
                return next;
            });
            setExpandedGroups(prev => {
                const next = new Set(prev);
                next.add(groupName);
                return next;
            });
            setLoadingChildren(prev => {
                const next = new Set(prev);
                next.delete(groupName);
                return next;
            });
        })
            .catch((err) => {
            if (err.name !== 'AbortError') {
                setLoadingChildren(prev => {
                    const next = new Set(prev);
                    next.delete(groupName);
                    return next;
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandedChildren, groupbyCol, childCol, queryParams.datasourceId, activeMode, metricLabel]);
    /* ── Sorting ── */
    const handleSort = (col) => {
        if (sortColumn === col) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortColumn(col);
            setSortDirection('desc');
        }
        setCurrentPage(0);
    };
    const sortIcon = (col) => {
        if (sortColumn !== col)
            return '';
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };
    /* ── Close with exit animation ── */
    const handleClose = (0, react_1.useCallback)(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setSearchQuery('');
            setSearchScope('group');
            setExpandedGroups(new Set());
            setExpandedChildren(new Map());
            onClose();
        }, CLOSE_DURATION_MS);
    }, [onClose]);
    const handleOverlayClick = (0, react_1.useCallback)((e) => {
        if (e.target === e.currentTarget)
            handleClose();
    }, [handleClose]);
    /* ── Escape key ── */
    (0, react_1.useEffect)(() => {
        if (!isOpen)
            return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape')
                handleClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, handleClose]);
    /* ── Focus management ── */
    (0, react_1.useEffect)(() => {
        if (isOpen)
            closeRef.current?.focus();
    }, [isOpen]);
    /* ── Focus trap ── */
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (e.key !== 'Tab')
            return;
        const focusable = modalRef.current?.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }, []);
    /* ── Hierarchy flip ── */
    const flipHierarchy = (0, react_1.useCallback)(() => {
        setHierarchyMode(prev => (prev === 'primary' ? 'secondary' : 'primary'));
        setSearchScope(prev => (prev === 'group' ? 'child' : 'group')); // preserve column intent
        setCurrentPage(0); // page 0 needed — different groupby
        // expanded/children reset in fetchGroups .then()
        // searchQuery preserved — user decides
    }, []);
    /* ── Export (server-side fetch with both GROUP BY columns) ── */
    const handleExport = (0, react_1.useCallback)(async () => {
        if (!groupbyCol || !childCol)
            return;
        // Step 1: Show "Save As" dialog IMMEDIATELY (requires user gesture)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fileHandle = null;
        if ('showSaveFilePicker' in window) {
            try {
                // @ts-expect-error showSaveFilePicker not in all TS lib types
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: `${title}-detail.csv`,
                    types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }],
                });
            }
            catch {
                return; // user cancelled dialog
            }
        }
        // Step 2: Fetch data from server
        setIsExporting(true);
        try {
            const payload = (0, detailApi_1.buildExportPayload)(queryParams, activeMode, groupbyCol, childCol, metricLabel, debouncedSearch, searchScope, exactMatch);
            const { json } = await core_1.SupersetClient.post({
                endpoint: 'api/v1/chart/data',
                jsonPayload: payload,
            });
            const rows = extractApiRows(json);
            // Group rows by parent column for CSV structure
            const groupedMap = new Map();
            for (const row of rows) {
                const parentName = String(row[groupbyCol] ?? 'N/A');
                const childFormatted = (0, detailApi_1.formatServerRow)(row, childCol, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts);
                const existing = groupedMap.get(parentName);
                if (existing) {
                    existing.push(childFormatted.summary);
                }
                else {
                    groupedMap.set(parentName, [childFormatted.summary]);
                }
            }
            // Build DetailGroup[] for CSV export
            const exportGroups = [];
            for (const [name, children] of groupedMap) {
                const parentRow = (0, detailApi_1.formatServerRow)({ [groupbyCol]: name }, groupbyCol, metricLabel, comp1Label_, comp2Label_, delta1Label_, delta2Label_, fmtOpts);
                exportGroups.push({ name, summary: parentRow.summary, children });
            }
            // Step 3: Write CSV to file handle (or fallback download)
            await exportToCsv(exportGroups, title, groupLabel, childLabel, enableComp1, enableComp2, comp1Header, comp2Header, colFact, delta1Header, delta2Header, fileHandle);
        }
        finally {
            setIsExporting(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupbyCol, childCol, queryParams.datasourceId, activeMode, metricLabel, debouncedSearch, searchScope, title, groupLabel, childLabel]);
    /* ── Cleanup abort controllers on close ── */
    (0, react_1.useEffect)(() => {
        if (!isOpen) {
            groupsAbortRef.current?.abort();
            childrenAbortRef.current.forEach(c => c.abort());
            childrenAbortRef.current.clear();
            hasEverLoaded.current = false;
        }
    }, [isOpen]);
    /* ── Compute column count for table-layout ── */
    const colCount = 2 + (enableComp1 ? 2 : 0) + (enableComp2 ? 2 : 0);
    // Column widths based on visible columns
    const nameWidth = colCount <= 4 ? '40%' : '30%';
    const valWidth = colCount <= 4 ? '20%' : '14%';
    const deltaWidth = colCount <= 4 ? '15%' : '10%';
    /* ── Render guard ── */
    const isHidden = !isOpen && !isClosing;
    return ((0, jsx_runtime_1.jsxs)(styles_1.Overlay, { closing: isClosing, onClick: handleOverlayClick, style: isHidden ? { visibility: 'hidden', pointerEvents: 'none', opacity: 0 } : undefined, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Modal, { ref: modalRef, closing: isClosing, role: "dialog", "aria-modal": "true", "aria-label": `${title} — детализация`, onClick: e => e.stopPropagation(), onKeyDown: handleKeyDown, children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalTitle, { children: title }), (0, jsx_runtime_1.jsx)(styles_1.ModalValue, { children: headerValue }), (0, jsx_runtime_1.jsx)(styles_1.CloseButton, { ref: closeRef, onClick: handleClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: "\u00D7" })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalToolbar, { children: [(0, jsx_runtime_1.jsxs)(styles_1.SearchBox, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ExactMatchLabel, { title: "\u0422\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: exactMatch, onChange: e => setExactMatch(e.target.checked) }), "\u0422\u043E\u0447\u043D\u043E"] }), (0, jsx_runtime_1.jsx)(MagnifyIcon, {}), (0, jsx_runtime_1.jsx)(styles_1.SearchInput, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A...", "aria-label": "\u041F\u043E\u0438\u0441\u043A", value: searchQuery, onChange: e => setSearchQuery(e.target.value) }), (0, jsx_runtime_1.jsxs)(styles_1.SearchScopeToggle, { children: [(0, jsx_runtime_1.jsx)(styles_1.SearchScopeButton, { active: searchScope === 'group', onClick: () => setSearchScope('group'), "aria-label": `Поиск по ${groupLabel}`, children: groupLabel }), (0, jsx_runtime_1.jsx)(styles_1.SearchScopeButton, { active: searchScope === 'child', onClick: () => setSearchScope('child'), "aria-label": `Поиск по ${childLabel}`, children: childLabel })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.FlipButton, { onClick: flipHierarchy, "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u0435\u0440\u0430\u0440\u0445\u0438\u044E", children: [(0, jsx_runtime_1.jsx)(styles_1.FlipIcon, { flipped: !isPrimary, "aria-hidden": "true", children: "\u21C5" }), (0, jsx_runtime_1.jsx)(styles_1.FlipLabel, { children: isPrimary
                                            ? `${hierarchyLabelPrimary}\u00A0→\u00A0${hierarchyLabelSecondary}`
                                            : `${hierarchyLabelSecondary}\u00A0→\u00A0${hierarchyLabelPrimary}` })] }), (0, jsx_runtime_1.jsxs)(styles_1.ResultsCount, { children: [groupLabel, ": ", totalCount != null ? totalCount : `${groups.length}${hasNextPage ? '+' : ''}`] })] }), (0, jsx_runtime_1.jsx)(styles_1.TableWrap, { children: (0, jsx_runtime_1.jsxs)(styles_1.DetailTable, { children: [(0, jsx_runtime_1.jsx)(styles_1.THead, { children: (0, jsx_runtime_1.jsxs)(styles_1.THRow, { children: [(0, jsx_runtime_1.jsxs)(styles_1.SortableTh, { widthPx: nameWidth, onClick: () => handleSort('name'), children: [groupLabel, sortIcon('name')] }), (0, jsx_runtime_1.jsxs)(styles_1.SortableTh, { className: "r", widthPx: valWidth, onClick: () => handleSort('value'), children: [colFact, sortIcon('value')] }), enableComp1 && ((0, jsx_runtime_1.jsxs)(styles_1.SortableTh, { className: "r", widthPx: valWidth, onClick: () => handleSort('comp1Value'), children: [comp1Header, sortIcon('comp1Value')] })), enableComp1 && showDelta1 && ((0, jsx_runtime_1.jsxs)(styles_1.SortableTh, { className: "r", widthPx: deltaWidth, onClick: () => handleSort('comp1Delta'), children: [delta1Header, sortIcon('comp1Delta')] })), enableComp2 && ((0, jsx_runtime_1.jsxs)(styles_1.SortableTh, { className: "r", widthPx: valWidth, onClick: () => handleSort('comp2Value'), children: [comp2Header, sortIcon('comp2Value')] })), enableComp2 && showDelta2 && ((0, jsx_runtime_1.jsxs)(styles_1.SortableTh, { className: "r", widthPx: deltaWidth, onClick: () => handleSort('comp2Delta'), children: [delta2Header, sortIcon('comp2Delta')] }))] }) }), isRefreshing && (0, jsx_runtime_1.jsx)(styles_1.RefreshBar, {}), (0, jsx_runtime_1.jsx)("tbody", { style: {
                                        opacity: isRefreshing ? 0.45 : 1,
                                        transition: 'opacity 0.15s ease',
                                        pointerEvents: isRefreshing ? 'none' : 'auto',
                                    }, children: isInitialLoading ? ((0, jsx_runtime_1.jsx)(styles_1.EmptyRow, { children: (0, jsx_runtime_1.jsx)("td", { colSpan: colCount, children: (0, jsx_runtime_1.jsxs)(styles_1.LoaderRowInner, { children: [(0, jsx_runtime_1.jsx)(styles_1.InlineSpinnerLarge, {}), "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026"] }) }) })) : fetchError ? ((0, jsx_runtime_1.jsx)(styles_1.EmptyRow, { children: (0, jsx_runtime_1.jsx)("td", { colSpan: colCount, children: (0, jsx_runtime_1.jsxs)(styles_1.ErrorRowInner, { children: [(0, jsx_runtime_1.jsx)("span", { children: fetchError }), (0, jsx_runtime_1.jsx)(styles_1.RetryButton, { type: "button", onClick: () => { setFetchError(null); setCurrentPage(p => p); }, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })] }) }) })) : groups.length === 0 ? ((0, jsx_runtime_1.jsx)(styles_1.EmptyRow, { children: (0, jsx_runtime_1.jsx)("td", { colSpan: colCount, children: debouncedSearch ? 'Ничего не найдено' : 'Нет данных' }) })) : (groups.flatMap(group => {
                                        const isExpanded = expandedGroups.has(group.name);
                                        const children = expandedChildren.get(group.name) ?? [];
                                        const isChildLoading = loadingChildren.has(group.name);
                                        return [
                                            (0, jsx_runtime_1.jsx)(GroupRowView, { group: group, expanded: isExpanded, isLoadingChildren: isChildLoading, onToggle: () => fetchChildren(group.name), enableComp1: enableComp1, enableComp2: enableComp2, showDelta1: showDelta1, showDelta2: showDelta2 }, `g-${group.name}`),
                                            ...(isExpanded
                                                ? children.map(child => ((0, jsx_runtime_1.jsx)(ChildRowView, { row: child, enableComp1: enableComp1, enableComp2: enableComp2, showDelta1: showDelta1, showDelta2: showDelta2 }, `c-${group.name}-${child.name}`)))
                                                : []),
                                        ];
                                    })) })] }) }), (() => {
                        const effectivePageSize = topN > 0 ? Math.min(pageSize, topN) : pageSize;
                        const totalPages = totalCount != null ? Math.ceil(totalCount / effectivePageSize) : null;
                        if (totalPages == null || totalPages <= 1)
                            return null;
                        const getPageNumbers = (current0, total) => {
                            if (total <= 7)
                                return Array.from({ length: total }, (_, i) => i + 1);
                            const pages = new Set();
                            pages.add(1);
                            pages.add(total);
                            pages.add(total - 1);
                            pages.add(total - 2);
                            const cur1 = current0 + 1;
                            pages.add(cur1);
                            if (cur1 > 1)
                                pages.add(cur1 - 1);
                            if (cur1 < total)
                                pages.add(cur1 + 1);
                            const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
                            const result = [];
                            for (let i = 0; i < sorted.length; i++) {
                                if (i > 0 && sorted[i] - sorted[i - 1] > 1)
                                    result.push('...');
                                result.push(sorted[i]);
                            }
                            return result;
                        };
                        return ((0, jsx_runtime_1.jsxs)(styles_1.PaginationWrap, { style: {
                                opacity: isRefreshing ? 0.5 : 1,
                                pointerEvents: isRefreshing ? 'none' : 'auto',
                                transition: 'opacity 0.15s ease',
                            }, children: [getPageNumbers(currentPage, totalPages).map((item, idx) => item === '...'
                                    ? (0, jsx_runtime_1.jsx)(styles_1.PageEllipsis, { children: "\u2026" }, `e${idx}`)
                                    : (0, jsx_runtime_1.jsx)(styles_1.PageBtn, { type: "button", isActive: item === currentPage + 1, "aria-label": `Страница ${item}`, "aria-current": item === currentPage + 1 ? 'page' : undefined, onClick: () => setCurrentPage(item - 1), disabled: isRefreshing, children: item }, item)), totalPages > 7 && ((0, jsx_runtime_1.jsx)(styles_1.PageInput, { type: "number", min: 1, max: totalPages, placeholder: "\u2116", "aria-label": "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443", disabled: isRefreshing, onKeyDown: (e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(e.target.value, 10);
                                            if (val >= 1 && val <= totalPages) {
                                                setCurrentPage(val - 1);
                                                e.target.value = '';
                                            }
                                        }
                                    } }))] }));
                    })(), (0, jsx_runtime_1.jsxs)(styles_1.ModalFoot, { children: [(0, jsx_runtime_1.jsxs)(styles_1.FooterHint, { children: ["\u25B6 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044E\u2002\u00B7\u2002", (0, jsx_runtime_1.jsxs)(styles_1.FooterHintIcon, { width: "12", height: "12", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M2 2h8.5L13 4.5V14H2V2z" }), (0, jsx_runtime_1.jsx)("path", { d: "M4 2v4h6V2" }), (0, jsx_runtime_1.jsx)("path", { d: "M9 3v2" }), (0, jsx_runtime_1.jsx)("path", { d: "M4 9h6v5H4z" })] }), " \u044D\u043A\u0441\u043F\u043E\u0440\u0442          "] }), (0, jsx_runtime_1.jsx)(styles_1.ExportButton, { onClick: handleExport, "aria-label": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0432 CSV", title: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043A\u0430\u043A CSV", disabled: isExporting, children: (0, jsx_runtime_1.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M2 2h8.5L13 4.5V14H2V2z" }), (0, jsx_runtime_1.jsx)("path", { d: "M4 2v4h6V2" }), (0, jsx_runtime_1.jsx)("path", { d: "M9 3v2" }), (0, jsx_runtime_1.jsx)("path", { d: "M4 9h6v5H4z" })] }) })] })] })] }));
}
// React.memo: block ALL re-renders when modal is closed (toggle perf).
// When opening: isOpen changes false→true → allows re-render with fresh props.
function areDetailPropsEqual(prev, next) {
    // If modal stays closed → block everything (toggle A/B won't trigger heavy re-render)
    if (!prev.isOpen && !next.isOpen)
        return true;
    // If modal is opening or closing → allow re-render
    if (prev.isOpen !== next.isOpen)
        return false;
    // Modal is open → skip only function props
    const keys = Object.keys(next);
    for (const key of keys) {
        if (typeof next[key] === 'function')
            continue;
        if (prev[key] !== next[key])
            return false;
    }
    return true;
}
exports.default = react_1.default.memo(DetailModalInner, areDetailPropsEqual);
//# sourceMappingURL=DetailModal.js.map