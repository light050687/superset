import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Global, css } from '@emotion/react';
import type { SetDataMaskHook } from '@superset-ui/core';

import {
  Card,
  CardHead,
  CardSub,
  CardTitle,
  Controls,
  FilterResetBtn,
  FilterResetRow,
  Root,
  TableWrap,
  TitleBlock,
  Wrap,
  KEYFRAMES_CSS,
} from './styles';
import type {
  ChartUiAction,
  ChartUiState,
  FormatCode,
  RankedStoresTransformedProps,
  SortDir,
  SortKey,
  StatusCode,
  Store,
} from './types';
import { useDsThemeTokens } from './hooks/useDsThemeTokens';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useDerivedRows } from './hooks/useDerivedRows';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { STATUSES } from './utils/statusRules';
import {
  FORMAT_ORDER,
  FORMATS_META,
} from './mocks/rankedStoresMock';
import { buildDataMask } from './utils/crossFilter';
import { colorFromKey } from './utils/colorFromKey';

import TableHeader from './components/TableHeader';
import TableBody from './components/TableBody';
import MultiSelectDropdown, {
  DropdownOption,
} from './components/MultiSelectDropdown';
import SearchInput from './components/SearchInput';
import CsvExportButton from './components/CsvExportButton';
import FooterHints, { ControlsHint } from './components/FooterHints';
import EmptyState from './components/EmptyState';
import Tooltip from './components/Tooltip';
import MiniSparkline from './components/MiniSparkline';
import StoreModal from './components/StoreModal';
import SegmentModal from './components/SegmentModal';
import { deltaClass, nf2 } from './utils/formatRussian';

/* =================================================================
 * Reducer
 * ================================================================= */

function createInitialState(defaultSort: SortKey): ChartUiState {
  return {
    sortBy: defaultSort,
    sortDir: 'desc',
    search: '',
    statusFilters: new Set(),
    formatFilters: new Set(),
    pinned: new Set(),
    expanded: new Set(),
    storeCross: new Set(),
    segmentCross: new Set(),
    lastClickedIdx: null,
    modal: { kind: null, storeId: null, segmentId: null },
    focusedRowId: null,
  };
}

function reducer(state: ChartUiState, action: ChartUiAction): ChartUiState {
  switch (action.type) {
    case 'TOGGLE_SORT': {
      if (state.sortBy === action.payload.sortKey) {
        return {
          ...state,
          sortDir: state.sortDir === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        ...state,
        sortBy: action.payload.sortKey,
        sortDir: action.payload.defaultDir ?? 'desc',
      };
    }
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'TOGGLE_STATUS': {
      const next = new Set(state.statusFilters);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, statusFilters: next };
    }
    case 'TOGGLE_FORMAT': {
      const next = new Set(state.formatFilters);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, formatFilters: next };
    }
    case 'TOGGLE_PIN': {
      const next = new Set(state.pinned);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, pinned: next };
    }
    case 'TOGGLE_EXPAND': {
      const { id, segmentIds } = action.payload;
      const next = new Set(state.expanded);
      const nextSegCross = new Set(state.segmentCross);
      if (next.has(id)) {
        /* collapse — убираем все сегменты этого магазина из cross-filter */
        next.delete(id);
        segmentIds.forEach(sid => nextSegCross.delete(sid));
      } else {
        next.add(id);
      }
      return { ...state, expanded: next, segmentCross: nextSegCross };
    }
    case 'ROW_CLICK': {
      const next = new Set(state.storeCross);
      if (next.has(action.payload.id)) next.delete(action.payload.id);
      else next.add(action.payload.id);
      return {
        ...state,
        storeCross: next,
        lastClickedIdx: action.payload.idx,
      };
    }
    case 'ROW_SHIFT_CLICK': {
      const next = new Set(state.storeCross);
      action.payload.range.forEach(id => next.add(id));
      return {
        ...state,
        storeCross: next,
        lastClickedIdx: action.payload.idx,
      };
    }
    case 'TOGGLE_SEGMENT_CROSS': {
      const next = new Set(state.segmentCross);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, segmentCross: next };
    }
    case 'CLEAR_CROSS':
      return {
        ...state,
        storeCross: new Set(),
        segmentCross: new Set(),
      };
    case 'OPEN_STORE_MODAL':
      return {
        ...state,
        modal: { kind: 'store', storeId: action.payload, segmentId: null },
      };
    case 'OPEN_SEGMENT_MODAL':
      return {
        ...state,
        modal: {
          kind: 'segment',
          storeId: action.payload.storeId,
          segmentId: action.payload.segmentId,
        },
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: { kind: null, storeId: null, segmentId: null },
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        search: '',
        statusFilters: new Set(),
        formatFilters: new Set(),
      };
    case 'FOCUS_ROW':
      return { ...state, focusedRowId: action.payload };
    default:
      return state;
  }
}

/* =================================================================
 * Component
 * ================================================================= */

export default function RankedStoresChart(
  props: RankedStoresTransformedProps,
) {
  const {
    width,
    height,
    stores,
    hooks,
    emitCrossFilters,
    periodLabel,
    defaultSort,
    storeIdCol,
    segmentIdCol,
  } = props;

  const { tokens, cssVars } = useDsThemeTokens();
  const [state, dispatch] = useReducer(reducer, defaultSort, createInitialState);

  /* Sync когда пользователь меняет default_sort в controlPanel — но только
     если пользователь не выбрал свою сортировку (т.е. sortBy совпадает со
     старым defaultSort). Используем ref чтобы знать предыдущий defaultSort. */
  const prevDefaultSortRef = useRef<SortKey>(defaultSort);
  useEffect(() => {
    const prev = prevDefaultSortRef.current;
    if (prev !== defaultSort) {
      if (state.sortBy === prev) {
        dispatch({
          type: 'TOGGLE_SORT',
          payload: { sortKey: defaultSort, defaultDir: 'desc' },
        });
      }
      prevDefaultSortRef.current = defaultSort;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSort]);

  const debouncedSearch = useDebouncedValue(state.search, 250);

  const {
    rankedStores,
    flatRows,
    shownCount,
    totalCount,
  } = useDerivedRows({
    stores,
    debouncedSearch,
    statusFilters: state.statusFilters,
    formatFilters: state.formatFilters,
    pinned: state.pinned,
    expanded: state.expanded,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
  });

  /* ----------------- Cross-filter → setDataMask (через ref) -----------------
     hooks — новый объект в каждом рендере, если поместить setDataMask
     в dep-array напрямую, useEffect будет срабатывать в цикле. Храним в ref. */
  const setDataMaskRef = useRef<SetDataMaskHook | undefined>(
    hooks.setDataMask as SetDataMaskHook | undefined,
  );
  useEffect(() => {
    setDataMaskRef.current = hooks.setDataMask as SetDataMaskHook | undefined;
  }, [hooks]);

  useEffect(() => {
    if (!emitCrossFilters) return;
    const fn = setDataMaskRef.current;
    if (!fn) return;
    fn(
      buildDataMask({
        storeCross: state.storeCross,
        segmentCross: state.segmentCross,
        storeIdCol,
        segmentIdCol,
      }),
    );
  }, [
    emitCrossFilters,
    state.storeCross,
    state.segmentCross,
    storeIdCol,
    segmentIdCol,
  ]);

  /* ----------------- Dropdown options (counts per status/format) ----------------- */
  const statusOptions: DropdownOption[] = useMemo(() => {
    const counts: Record<StatusCode, number> = {
      ok: 0,
      writeoff: 0,
      shrinkage: 0,
      critical: 0,
    };
    stores.forEach(s => {
      counts[s.status] += 1;
    });
    return (Object.keys(STATUSES) as StatusCode[]).map(key => ({
      key,
      label: STATUSES[key].label,
      color: colorFromKey(STATUSES[key].colorKey, tokens),
      count: counts[key],
    }));
  }, [stores, tokens]);

  const formatOptions: DropdownOption[] = useMemo(() => {
    const counts: Record<FormatCode, number> = {
      express: 0,
      minimarket: 0,
      super: 0,
      home: 0,
      superstore: 0,
    };
    stores.forEach(s => {
      counts[s.format] += 1;
    });
    return FORMAT_ORDER.map(code => ({
      key: code,
      label: FORMATS_META[code].name,
      color: colorFromKey(FORMATS_META[code].colorKey, tokens),
      count: counts[code],
    }));
  }, [stores, tokens]);

  /* ----------------- Event handlers ----------------- */
  const handleSort = useCallback((sortKey: SortKey, defaultDir: SortDir) => {
    dispatch({ type: 'TOGGLE_SORT', payload: { sortKey, defaultDir } });
  }, []);

  const handleRowClick = useCallback(
    (id: string, idx: number, e: React.MouseEvent) => {
      const seg = stores
        .flatMap(s => s.segmentsDist)
        .find(x => x.id === id);
      if (seg) {
        if (e.ctrlKey || e.metaKey) {
          dispatch({
            type: 'OPEN_SEGMENT_MODAL',
            payload: { storeId: seg.storeId, segmentId: id },
          });
          return;
        }
        dispatch({ type: 'TOGGLE_SEGMENT_CROSS', payload: seg.segmentId });
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        dispatch({ type: 'OPEN_STORE_MODAL', payload: id });
        return;
      }
      if (e.shiftKey && state.lastClickedIdx !== null) {
        const from = Math.min(state.lastClickedIdx, idx);
        const to = Math.max(state.lastClickedIdx, idx);
        const range = rankedStores.slice(from, to + 1).map(s => s.id);
        dispatch({ type: 'ROW_SHIFT_CLICK', payload: { id, idx, range } });
      } else {
        dispatch({ type: 'ROW_CLICK', payload: { id, idx } });
      }
    },
    [stores, rankedStores, state.lastClickedIdx],
  );

  const handleRowDblClick = useCallback(
    (id: string, parentStoreId?: string) => {
      if (parentStoreId) {
        dispatch({
          type: 'OPEN_SEGMENT_MODAL',
          payload: { storeId: parentStoreId, segmentId: id },
        });
      } else {
        dispatch({ type: 'OPEN_STORE_MODAL', payload: id });
      }
    },
    [],
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      const store = stores.find(s => s.id === id);
      const segmentIds = store
        ? store.segmentsDist.map(seg => seg.segmentId)
        : [];
      dispatch({ type: 'TOGGLE_EXPAND', payload: { id, segmentIds } });
    },
    [stores],
  );

  const handleTogglePin = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PIN', payload: id });
  }, []);

  /* ----------------- Tooltip ----------------- */
  const [tt, setTt] = useState<{
    store: Store | null;
    pos: { x: number; y: number } | null;
  }>({ store: null, pos: null });

  const handleRowMouseEnter = useCallback(
    (id: string, e: React.MouseEvent) => {
      const s = rankedStores.find(x => x.id === id);
      if (s) setTt({ store: s, pos: { x: e.clientX, y: e.clientY } });
    },
    [rankedStores],
  );
  const handleRowMouseMove = useCallback((_id: string, e: React.MouseEvent) => {
    setTt(prev =>
      prev.store ? { store: prev.store, pos: { x: e.clientX, y: e.clientY } } : prev,
    );
  }, []);
  const handleRowMouseLeave = useCallback(() => {
    setTt({ store: null, pos: null });
  }, []);

  /* ----------------- Active modal store/segment ----------------- */
  const activeModalStore = useMemo<Store | null>(
    () =>
      state.modal.kind && state.modal.storeId
        ? stores.find(s => s.id === state.modal.storeId) ?? null
        : null,
    [state.modal, stores],
  );
  const activeModalSegment = useMemo(() => {
    if (state.modal.kind !== 'segment' || !activeModalStore) return null;
    return (
      activeModalStore.segmentsDist.find(x => x.id === state.modal.segmentId) ??
      null
    );
  }, [state.modal, activeModalStore]);

  /* ----------------- Flags ----------------- */
  const hasAnyFilter =
    state.statusFilters.size > 0 ||
    state.formatFilters.size > 0 ||
    state.search.length > 0;

  const rootRef = useRef<HTMLDivElement>(null);

  /* ----------------- Keyboard navigation ↑/↓/Enter/Esc ----------------- */
  const focusedIdx = useMemo(() => {
    if (!state.focusedRowId) return -1;
    return flatRows.findIndex(r => r.data.id === state.focusedRowId);
  }, [flatRows, state.focusedRowId]);

  useKeyboardNav(
    {
      onArrowDown: () => {
        if (state.modal.kind) return;
        const next =
          focusedIdx < 0 ? 0 : Math.min(flatRows.length - 1, focusedIdx + 1);
        const r = flatRows[next];
        if (r) dispatch({ type: 'FOCUS_ROW', payload: r.data.id });
      },
      onArrowUp: () => {
        if (state.modal.kind) return;
        const prev = focusedIdx <= 0 ? 0 : focusedIdx - 1;
        const r = flatRows[prev];
        if (r) dispatch({ type: 'FOCUS_ROW', payload: r.data.id });
      },
      onEnter: () => {
        if (state.modal.kind) return;
        const r = flatRows[focusedIdx];
        if (!r) return;
        if (r.kind === 'segment') {
          dispatch({
            type: 'OPEN_SEGMENT_MODAL',
            payload: { storeId: r.parentStoreId, segmentId: r.data.id },
          });
        } else {
          dispatch({ type: 'OPEN_STORE_MODAL', payload: r.data.id });
        }
      },
      onEscape: () => {
        if (state.modal.kind) {
          dispatch({ type: 'CLOSE_MODAL' });
        } else if (hasAnyFilter) {
          dispatch({ type: 'RESET_FILTERS' });
        } else if (state.storeCross.size > 0 || state.segmentCross.size > 0) {
          dispatch({ type: 'CLEAR_CROSS' });
        }
      },
    },
    rootRef,
  );

  return (
    <Root
      ref={rootRef}
      $width={width}
      $height={height}
      style={cssVars}
      className="leaderboard-card"
    >
      <Global styles={css(KEYFRAMES_CSS)} />
      <Wrap>
        <Card data-info-hint-container="">
          <CardHead>
            <TitleBlock>
              <CardTitle>Рейтинг магазинов</CardTitle>
              <CardSub>
                <span>{totalCount} магазинов</span>
                {periodLabel && (
                  <>
                    <span className="dot" />
                    <span>{periodLabel}</span>
                  </>
                )}
                <span className="dot" />
                <span>Сортировка — {sortLabel(state.sortBy)}</span>
              </CardSub>
            </TitleBlock>
            <Controls>
              <MultiSelectDropdown
                label="Статус"
                options={statusOptions}
                selected={state.statusFilters as Set<string>}
                onToggle={k =>
                  dispatch({ type: 'TOGGLE_STATUS', payload: k as StatusCode })
                }
              />
              <MultiSelectDropdown
                label="Форматы"
                options={formatOptions}
                selected={state.formatFilters as Set<string>}
                onToggle={k =>
                  dispatch({ type: 'TOGGLE_FORMAT', payload: k as FormatCode })
                }
              />
              <SearchInput
                value={state.search}
                onChange={v => dispatch({ type: 'SET_SEARCH', payload: v })}
              />
              <CsvExportButton stores={rankedStores} />
              <ControlsHint />
            </Controls>
          </CardHead>

          {hasAnyFilter && (
            <FilterResetRow>
              <FilterResetBtn
                type="button"
                onClick={() => dispatch({ type: 'RESET_FILTERS' })}
              >
                Сбросить фильтры
              </FilterResetBtn>
            </FilterResetRow>
          )}

          {stores.length === 0 ? (
            <EmptyState
              title="Нет данных магазинов"
              description={
                'Включите «Режим проектирования» в настройках для тестовых данных, ' +
                'либо настройте Сопоставление колонок под ваш dataset. Ожидаемые поля: ' +
                'store_id, store_name, city, format, format_name, division, to_class, ' +
                'writeoff_pct, shrinkage_pct, plan_writeoff_pct, plan_shrinkage_pct, ' +
                'avg_writeoff_rub, avg_shrinkage_check_rub.'
              }
            />
          ) : (
            <TableWrap role="table" aria-label="Рейтинг магазинов">
              <TableHeader
                sortBy={state.sortBy}
                sortDir={state.sortDir}
                onSort={handleSort}
              />
              <TableBody
                rows={flatRows}
                allStores={stores}
                crossSelected={state.storeCross}
                segmentCrossSelected={state.segmentCross}
                pinned={state.pinned}
                expanded={state.expanded}
                focusedRowId={state.focusedRowId}
                tokens={tokens}
                onRowClick={handleRowClick}
                onRowDblClick={handleRowDblClick}
                onRowMouseEnter={handleRowMouseEnter}
                onRowMouseMove={handleRowMouseMove}
                onRowMouseLeave={handleRowMouseLeave}
                onToggleExpand={handleToggleExpand}
                onTogglePin={handleTogglePin}
              />
            </TableWrap>
          )}

          <FooterHints shown={shownCount} total={totalCount} />
        </Card>
      </Wrap>

      <Tooltip visible={tt.store !== null} pos={tt.pos}>
        {tt.store && (
          <TooltipContent store={tt.store} allStores={stores} tokens={tokens} />
        )}
      </Tooltip>

      <StoreModal
        open={state.modal.kind === 'store'}
        store={activeModalStore}
        allStores={stores}
        tokens={tokens}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        periodLabel={periodLabel}
      />
      <SegmentModal
        open={state.modal.kind === 'segment'}
        parentStore={activeModalStore}
        segment={activeModalSegment}
        allStores={stores}
        tokens={tokens}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        periodLabel={periodLabel}
      />
    </Root>
  );
}

/* =================================================================
 * Tooltip content
 * ================================================================= */

function sortLabel(sortBy: SortKey): string {
  switch (sortBy) {
    case 'lossCombined':
      return 'по уровню потерь';
    case 'writeoff':
      return 'по % списаний';
    case 'shrinkage':
      return 'по % недостач';
    case 'avgWriteoff':
      return 'по ср. сумме списаний';
    case 'avgShrinkageCheck':
      return 'по ср. чеку недостач';
    case 'statusRank':
      return 'по статусу';
    case 'name':
      return 'по имени';
    default:
      return '';
  }
}

interface TooltipContentProps {
  store: Store;
  allStores: Store[];
  tokens: ReturnType<typeof useDsThemeTokens>['tokens'];
}

function TooltipContent({ store, allStores, tokens }: TooltipContentProps) {
  const st = STATUSES[store.status];
  const color = colorFromKey(st.colorKey, tokens);
  const dW = store.writeoff - store.planWriteoff;
  const dS = store.shrinkage - store.planShrinkage;
  const dWcls = deltaClass(dW, true);
  const dScls = deltaClass(dS, true);
  const fmtStores = allStores
    .filter(x => x.format === store.format)
    .sort((a, b) => b.lossCombined - a.lossCombined);
  const rank = fmtStores.findIndex(x => x.id === store.id) + 1;

  return (
    <>
      <div className="tt-head">
        <div className="tt-status" style={{ background: color }} />
        <div className="tt-titles">
          <div className="tt-name">{store.shortLabel}</div>
          <div className="tt-sub">
            {store.code} · {store.city} · {store.formatName}
          </div>
        </div>
      </div>
      <div className="tt-trend">
        <div className="tt-trend-l">Тренд списаний (12 нед)</div>
        <MiniSparkline
          data={store.spark}
          color={tokens.tangerine}
          background={tokens.g100}
          width={280}
          height={36}
        />
      </div>
      <div className="tt-rows">
        <div className="tt-row">
          <span className="tt-l">Списания / план</span>
          <span className={`tt-v ${dWcls}`}>
            {nf2(store.writeoff)}%{' '}
            <span style={{ color: 'var(--g500)', fontWeight: 500 }}>
              /{nf2(store.planWriteoff)}%
            </span>
          </span>
        </div>
        <div className="tt-row">
          <span className="tt-l">Недостачи / план</span>
          <span className={`tt-v ${dScls}`}>
            {nf2(store.shrinkage)}%{' '}
            <span style={{ color: 'var(--g500)', fontWeight: 500 }}>
              /{nf2(store.planShrinkage)}%
            </span>
          </span>
        </div>
        <div className="tt-row">
          <span className="tt-l">Ранг в формате</span>
          <span className="tt-v">
            #{rank} из {fmtStores.length}
          </span>
        </div>
        <div className="tt-row">
          <span className="tt-l">ТО</span>
          <span className="tt-v">{store.toClass} млн ₽</span>
        </div>
      </div>
    </>
  );
}
