/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import { t } from '@superset-ui/core';
import { addWarningToast } from 'src/components/MessageToasts/actions';
import {
  TABS_TYPE,
  ROW_TYPE,
  PAGES_TYPE,
} from 'src/dashboard/util/componentTypes';
import {
  DASHBOARD_ROOT_ID,
  NEW_COMPONENTS_SOURCE_ID,
  DASHBOARD_HEADER_ID,
  GRID_COLUMN_COUNT,
  GRID_MIN_COLUMN_COUNT,
} from 'src/dashboard/util/constants';
import dropOverflowsParent from 'src/dashboard/util/dropOverflowsParent';
import findParentId from 'src/dashboard/util/findParentId';
import isInDifferentFilterScopes from 'src/dashboard/util/isInDifferentFilterScopes';
import { updateLayoutComponents } from './dashboardFilters';
import { setUnsavedChanges } from './dashboardState';

// Component CRUD -------------------------------------------------------------
export const UPDATE_COMPONENTS = 'UPDATE_COMPONENTS';

// this is a helper that takes an action as input and dispatches
// an additional setUnsavedChanges(true) action after the dispatch in the case
// that dashboardState.hasUnsavedChanges is false.
function setUnsavedChangesAfterAction(action) {
  return (...args) =>
    (dispatch, getState) => {
      const result = action(...args);
      if (typeof result === 'function') {
        dispatch(result(dispatch, getState));
      } else {
        dispatch(result);
      }

      const { dashboardLayout, dashboardState } = getState();

      const isComponentLevelEvent =
        result.type === UPDATE_COMPONENTS &&
        result.payload &&
        result.payload.nextComponents;
      // trigger dashboardFilters state update if dashboard layout is changed.
      if (!isComponentLevelEvent) {
        const components = dashboardLayout.present;
        dispatch(updateLayoutComponents(components));
      }

      if (!dashboardState.hasUnsavedChanges) {
        dispatch(setUnsavedChanges(true));
      }
    };
}

export const updateComponents = setUnsavedChangesAfterAction(
  nextComponents => ({
    type: UPDATE_COMPONENTS,
    payload: {
      nextComponents,
    },
  }),
);

export function updateDashboardTitle(text) {
  return (dispatch, getState) => {
    const { dashboardLayout } = getState();
    dispatch(
      updateComponents({
        [DASHBOARD_HEADER_ID]: {
          ...dashboardLayout.present[DASHBOARD_HEADER_ID],
          meta: {
            text,
          },
        },
      }),
    );
  };
}

export const DASHBOARD_TITLE_CHANGED = 'DASHBOARD_TITLE_CHANGED';

// call this one when it's not an undo-able action
export function dashboardTitleChanged(text) {
  return {
    type: DASHBOARD_TITLE_CHANGED,
    text,
  };
}

export const DELETE_COMPONENT = 'DELETE_COMPONENT';
export const deleteComponent = setUnsavedChangesAfterAction((id, parentId) => ({
  type: DELETE_COMPONENT,
  payload: {
    id,
    parentId,
  },
}));

export const CREATE_COMPONENT = 'CREATE_COMPONENT';
export const createComponent = setUnsavedChangesAfterAction(dropResult => ({
  type: CREATE_COMPONENT,
  payload: {
    dropResult,
  },
}));

// Tabs -----------------------------------------------------------------------
export const CREATE_TOP_LEVEL_TABS = 'CREATE_TOP_LEVEL_TABS';
export const createTopLevelTabs = setUnsavedChangesAfterAction(dropResult => ({
  type: CREATE_TOP_LEVEL_TABS,
  payload: {
    dropResult,
  },
}));

export const DELETE_TOP_LEVEL_TABS = 'DELETE_TOP_LEVEL_TABS';
export const deleteTopLevelTabs = setUnsavedChangesAfterAction(() => ({
  type: DELETE_TOP_LEVEL_TABS,
  payload: {},
}));

// Pages ----------------------------------------------------------------------
export const CREATE_TOP_LEVEL_PAGES = 'CREATE_TOP_LEVEL_PAGES';
export const createTopLevelPages = setUnsavedChangesAfterAction(dropResult => ({
  type: CREATE_TOP_LEVEL_PAGES,
  payload: { dropResult },
}));

export const DELETE_TOP_LEVEL_PAGES = 'DELETE_TOP_LEVEL_PAGES';
export const deleteTopLevelPages = setUnsavedChangesAfterAction(() => ({
  type: DELETE_TOP_LEVEL_PAGES,
  payload: {},
}));

export const COPY_PAGE = 'COPY_PAGE';
export const copyPage = setUnsavedChangesAfterAction((pageId, pagesId) => ({
  type: COPY_PAGE,
  payload: { pageId, pagesId },
}));

// Resize ---------------------------------------------------------------------
export const RESIZE_COMPONENT = 'RESIZE_COMPONENT';
/**
 * Resize action. Расширен для поддержки трёх режимов layout:
 *  - col: legacy {id, width, height} — width/height = column-multiple (1..12)
 *  - sub: {id, layoutMode:'sub', widthSub, heightSub, subdivisionsUsed}
 *         widthSub = sub-cell count (1..12*sub), subdivisionsUsed = N at save time
 *  - free: {id, layoutMode:'free', freePxWidth, freePxHeight} — пиксельные размеры
 *
 * Любые поля из meta могут быть переданы — будут merged в meta объект.
 * Это позволяет одной action'ой переключать чарт между режимами.
 *
 * @param {{
 *   id: string,
 *   width?: number,
 *   height?: number,
 *   layoutMode?: 'col' | 'sub' | 'free',
 *   widthSub?: number,
 *   heightSub?: number,
 *   subdivisionsUsed?: number,
 *   freePxWidth?: number,
 *   freePxHeight?: number,
 * }} payload
 */
export function resizeComponent({
  id,
  width,
  height,
  layoutMode,
  widthSub,
  heightSub,
  subdivisionsUsed,
  freePxWidth,
  freePxHeight,
}) {
  return (dispatch, getState) => {
    const { dashboardLayout: undoableLayout } = getState();
    const { present: dashboard } = undoableLayout;
    const component = dashboard[id];
    if (!component) return;
    const nextMeta = { ...component.meta };
    if (width !== undefined) nextMeta.width = width;
    if (height !== undefined) nextMeta.height = height;
    if (layoutMode !== undefined) nextMeta.layoutMode = layoutMode;
    if (widthSub !== undefined) nextMeta.widthSub = widthSub;
    if (heightSub !== undefined) nextMeta.heightSub = heightSub;
    if (subdivisionsUsed !== undefined) {
      nextMeta.subdivisionsUsed = subdivisionsUsed;
    }
    if (freePxWidth !== undefined) nextMeta.freePxWidth = freePxWidth;
    if (freePxHeight !== undefined) nextMeta.freePxHeight = freePxHeight;
    /* При переходе в col-mode чистим sub/free поля чтобы старая мета
       не висела и не сбивала рендеринг (ChartHolder инферит mode по
       наличию полей). */
    if (layoutMode === 'col') {
      delete nextMeta.widthSub;
      delete nextMeta.heightSub;
      delete nextMeta.subdivisionsUsed;
      delete nextMeta.freePxWidth;
      delete nextMeta.freePxHeight;
    } else if (layoutMode === 'sub') {
      delete nextMeta.freePxWidth;
      delete nextMeta.freePxHeight;
    } else if (layoutMode === 'free') {
      delete nextMeta.widthSub;
      delete nextMeta.heightSub;
      delete nextMeta.subdivisionsUsed;
    }
    /* Diff: меняем только если что-то реально изменилось. */
    const keys = [
      'width',
      'height',
      'layoutMode',
      'widthSub',
      'heightSub',
      'subdivisionsUsed',
      'freePxWidth',
      'freePxHeight',
    ];
    const changed = keys.some(k => nextMeta[k] !== component.meta[k]);
    if (!changed) return;
    dispatch(
      updateComponents({
        [id]: { ...component, meta: nextMeta },
      }),
    );
  };
}

/**
 * Push-shrink resize для col-mode и sub-mode. Когда юзер тащит resize
 * handle вправо за пределы свободного места в Row — соседи справа
 * сжимаются (ближайший первым) до GRID_MIN_COLUMN_COUNT.
 *
 * Все расчёты ведутся внутренне в col-units; sub-mode конвертирует
 * widthSub ↔ col через subdivisionsUsed. Mixed-mode соседи (col-saved
 * + sub-saved в одной Row) корректно учитываются: widthOfInCols читает
 * .widthSub / .freePxWidth / .width в зависимости от того что сохранено.
 *
 * Если parent — не Row, fallback к resizeComponent.
 *
 * Все обновления (текущий чарт + сжатые соседи) идут одной batch
 * UPDATE_COMPONENTS action → undo/redo откатывает атомарно.
 *
 * @param {{
 *   id: string,
 *   width?: number,                 // col-mode: 1..12
 *   widthSub?: number,              // sub-mode: 1..12*sub
 *   height?: number,
 *   heightSub?: number,
 *   layoutMode?: 'col' | 'sub',
 *   subdivisionsUsed?: number,      // sub-mode only, default 1
 *   parentId: string,
 * }} payload
 */
export function resizeComponentWithShrinkingNeighbors({
  id,
  width,
  widthSub,
  height,
  heightSub,
  layoutMode = 'col',
  subdivisionsUsed = 1,
  parentId,
}) {
  return (dispatch, getState) => {
    const { dashboardLayout: undoableLayout } = getState();
    const { present: layout } = undoableLayout;
    const component = layout[id];
    const parent = parentId ? layout[parentId] : null;
    if (!component) return;
    /* Fallback к single-component update если parent не Row. */
    if (!parent || parent.type !== ROW_TYPE) {
      if (layoutMode === 'sub') {
        dispatch(
          resizeComponent({
            id,
            layoutMode: 'sub',
            widthSub,
            heightSub,
            subdivisionsUsed,
          }),
        );
      } else {
        dispatch(resizeComponent({ id, width, height, layoutMode: 'col' }));
      }
      return;
    }
    const siblingIds = parent.children || [];
    const idx = siblingIds.indexOf(id);
    if (idx < 0) {
      if (layoutMode === 'sub') {
        dispatch(
          resizeComponent({
            id,
            layoutMode: 'sub',
            widthSub,
            heightSub,
            subdivisionsUsed,
          }),
        );
      } else {
        dispatch(resizeComponent({ id, width, height, layoutMode: 'col' }));
      }
      return;
    }
    const leftSiblings = siblingIds.slice(0, idx);
    const rightSiblings = siblingIds.slice(idx + 1);

    /* Работаем в UNIT'ах: col-mode → cols (1..12), sub-mode → sub-cells
       (1..12*sub). Это критично для sub-mode где widthSub=27 при sub=5 =
       5.4 col; Math.ceil(5.4)=6 ⇒ потеря 0.6 col empty space, и thunk
       начинает сжимать соседа когда не должен. */
    const inSubMode = layoutMode === 'sub';
    const UNIT_TOTAL = inSubMode
      ? GRID_COLUMN_COUNT * subdivisionsUsed
      : GRID_COLUMN_COUNT;
    const UNIT_MIN = inSubMode
      ? subdivisionsUsed // 1 col в sub-cells
      : GRID_MIN_COLUMN_COUNT;

    /* widthOfInUnits — возвращает ширину sibling'а в текущих units.
       Если sibling сохранён в другом режиме, конвертируем:
       - col-saved sibling в sub-mode: width*sub = sub-cells
       - sub-saved sibling в col-mode: ceil(widthSub/sub) = cols
       free-mode sibling — fixed MIN, не сжимается. */
    const widthOfInUnits = sibId => {
      const m = layout[sibId]?.meta;
      if (!m) return 0;
      if (m.freePxWidth != null) return UNIT_MIN;
      if (inSubMode) {
        if (m.widthSub != null && m.subdivisionsUsed === subdivisionsUsed) {
          return m.widthSub; // exact sub-cell precision сохраняется
        }
        if (m.widthSub != null && m.subdivisionsUsed) {
          // sibling sub-saved но в другом subdivisionsUsed — конвертация
          return Math.round((m.widthSub / m.subdivisionsUsed) * subdivisionsUsed);
        }
        return (m.width || 0) * subdivisionsUsed;
      }
      if (m.widthSub != null && m.subdivisionsUsed) {
        return Math.ceil(m.widthSub / m.subdivisionsUsed);
      }
      return m.width || 0;
    };

    const widthLeftUnits = leftSiblings.reduce(
      (s, sId) => s + widthOfInUnits(sId),
      0,
    );
    const widthRightUnits = rightSiblings.reduce(
      (s, sId) => s + widthOfInUnits(sId),
      0,
    );

    /* incomingWidth в текущих units. */
    const incomingWidthUnits = inSubMode
      ? widthSub || UNIT_MIN
      : width || UNIT_MIN;

    /* Max: 12*sub - (left+right)*MIN sub-cells (sub-mode), или
       12 - (left+right)*1 cols (col-mode). Push-shrink в обе стороны. */
    const maxWidthUnits = Math.max(
      UNIT_MIN,
      UNIT_TOTAL -
        (leftSiblings.length + rightSiblings.length) * UNIT_MIN,
    );
    const clampedWidthUnits = Math.min(
      Math.max(UNIT_MIN, incomingWidthUnits),
      maxWidthUnits,
    );
    const totalSiblingsAfterUnits = UNIT_TOTAL - clampedWidthUnits;
    const currentSiblingsTotalUnits = widthLeftUnits + widthRightUnits;
    /* Сжимать соседей нужно ТОЛЬКО если их текущая суммарная ширина
       превышает доступное место (12 - clampedWidth). Если row имеет
       empty space — drag заполняет его БЕЗ сжатия соседей. */
    const needShrinkUnits = Math.max(
      0,
      currentSiblingsTotalUnits - totalSiblingsAfterUnits,
    );

    /* Для col-mode legacy локальных alias (используются ниже в write back). */
    const clampedWidthCols = inSubMode
      ? Math.max(GRID_MIN_COLUMN_COUNT, Math.ceil(clampedWidthUnits / subdivisionsUsed))
      : clampedWidthUnits;

    /* Write-back в native units. */
    const nextMeta = { ...component.meta };
    if (inSubMode) {
      nextMeta.widthSub = Math.max(UNIT_MIN, clampedWidthUnits);
      if (heightSub !== undefined) nextMeta.heightSub = heightSub;
      nextMeta.subdivisionsUsed = subdivisionsUsed;
      nextMeta.layoutMode = 'sub';
      delete nextMeta.freePxWidth;
      delete nextMeta.freePxHeight;
    } else {
      nextMeta.width = clampedWidthUnits;
      if (height !== undefined) nextMeta.height = height;
      nextMeta.layoutMode = 'col';
      delete nextMeta.widthSub;
      delete nextMeta.heightSub;
      delete nextMeta.subdivisionsUsed;
      delete nextMeta.freePxWidth;
      delete nextMeta.freePxHeight;
    }

    const updates = {
      [id]: { ...component, meta: nextMeta },
    };

    /* Push-shrink ТОЛЬКО если row over-capacity (current siblings total >
       remaining room). Empty space row заполняется БЕЗ сжатия соседей.
       Порядок: right closest → left closest. Каждый сосед сжимается до
       UNIT_MIN, остаток передаётся следующему. */
    let needShrink = needShrinkUnits;
    const shrinkSibling = sibId => {
      const sib = layout[sibId];
      if (!sib) return 0;
      const sibMeta = sib.meta || {};
      if (sibMeta.freePxWidth != null) return 0;
      const currentUnits = widthOfInUnits(sibId);
      const canShrinkBy = Math.max(0, currentUnits - UNIT_MIN);
      if (canShrinkBy <= 0) return 0;
      const shrinkBy = Math.min(canShrinkBy, needShrink);
      const newUnits = currentUnits - shrinkBy;
      /* Write-back в native units соседа (col-saved или sub-saved). */
      if (inSubMode) {
        /* В sub-mode units = sub-cells текущего subdivisionsUsed. */
        if (sibMeta.widthSub != null && sibMeta.subdivisionsUsed === subdivisionsUsed) {
          updates[sibId] = { ...sib, meta: { ...sibMeta, widthSub: Math.max(UNIT_MIN, newUnits) } };
        } else if (sibMeta.widthSub != null && sibMeta.subdivisionsUsed) {
          /* Сосед в другом sub — конвертация newUnits (в нашем sub) → его sub. */
          const newInSibSub = Math.round((newUnits / subdivisionsUsed) * sibMeta.subdivisionsUsed);
          updates[sibId] = { ...sib, meta: { ...sibMeta, widthSub: Math.max(sibMeta.subdivisionsUsed, newInSibSub) } };
        } else {
          /* col-saved сосед — write в col-units. */
          const newCols = Math.max(GRID_MIN_COLUMN_COUNT, Math.ceil(newUnits / subdivisionsUsed));
          updates[sibId] = { ...sib, meta: { ...sibMeta, width: newCols } };
        }
      } else {
        /* col-mode: units = cols. */
        if (sibMeta.widthSub != null && sibMeta.subdivisionsUsed) {
          updates[sibId] = {
            ...sib,
            meta: { ...sibMeta, widthSub: Math.max(GRID_MIN_COLUMN_COUNT, newUnits * sibMeta.subdivisionsUsed) },
          };
        } else {
          updates[sibId] = { ...sib, meta: { ...sibMeta, width: newUnits } };
        }
      }
      return shrinkBy;
    };

    if (needShrink > 0) {
      for (let i = 0; i < rightSiblings.length && needShrink > 0; i += 1) {
        needShrink -= shrinkSibling(rightSiblings[i]);
      }
      for (
        let i = leftSiblings.length - 1;
        i >= 0 && needShrink > 0;
        i -= 1
      ) {
        needShrink -= shrinkSibling(leftSiblings[i]);
      }
    }

    /* Diff guard: если ни у кого ничего не изменилось — не диспатчим. */
    const changedSomething = Object.keys(updates).some(uid => {
      const before = layout[uid];
      const after = updates[uid];
      const bm = before?.meta || {};
      const am = after?.meta || {};
      return (
        (bm.width || 0) !== (am.width || 0) ||
        (bm.widthSub || 0) !== (am.widthSub || 0) ||
        (bm.height || 0) !== (am.height || 0) ||
        (bm.heightSub || 0) !== (am.heightSub || 0) ||
        (bm.subdivisionsUsed || 0) !== (am.subdivisionsUsed || 0) ||
        bm.layoutMode !== am.layoutMode
      );
    });
    if (!changedSomething) return;

    dispatch(updateComponents(updates));
  };
}

// Drag and drop --------------------------------------------------------------
export const MOVE_COMPONENT = 'MOVE_COMPONENT';
const moveComponent = setUnsavedChangesAfterAction(dropResult => ({
  type: MOVE_COMPONENT,
  payload: {
    dropResult,
  },
}));

export const HANDLE_COMPONENT_DROP = 'HANDLE_COMPONENT_DROP';
export function handleComponentDrop(dropResult) {
  return (dispatch, getState) => {
    const overflowsParent = dropOverflowsParent(
      dropResult,
      getState().dashboardLayout.present,
    );

    if (overflowsParent) {
      return dispatch(
        addWarningToast(
          t(
            `There is not enough space for this component. Try decreasing its width, or increasing the destination width.`,
          ),
        ),
      );
    }

    const { source, destination } = dropResult;
    const droppedOnRoot = destination && destination.id === DASHBOARD_ROOT_ID;
    const isNewComponent = source.id === NEW_COMPONENTS_SOURCE_ID;
    const dashboardRoot = getState().dashboardLayout.present[DASHBOARD_ROOT_ID];
    const rootChildId =
      dashboardRoot && dashboardRoot.children ? dashboardRoot.children[0] : '';

    if (droppedOnRoot) {
      if (dropResult.dragging?.type === PAGES_TYPE) {
        dispatch(createTopLevelPages(dropResult));
      } else {
        dispatch(createTopLevelTabs(dropResult));
      }
    } else if (
      destination &&
      isNewComponent &&
      dropResult.dragging?.type === PAGES_TYPE
    ) {
      // Pages can be dropped anywhere — always promote to top-level
      dispatch(
        createTopLevelPages({
          ...dropResult,
          destination: {
            id: DASHBOARD_ROOT_ID,
            type: 'ROOT',
            index: 0,
          },
        }),
      );
    } else if (destination && isNewComponent) {
      dispatch(createComponent(dropResult));
    } else if (
      // Add additional allow-to-drop logic for tag/tags source.
      // We only allow
      // - top-level tab => top-level tab: rearrange top-level tab order
      // - nested tab => top-level tab: allow row tab become top-level tab
      // Dashboard does not allow top-level tab become nested tab, to avoid
      // nested tab inside nested tab.
      source.type === TABS_TYPE &&
      destination.type === TABS_TYPE &&
      source.id === rootChildId &&
      destination.id !== rootChildId
    ) {
      return dispatch(
        addWarningToast(t('Can not move top level tab into nested tabs')),
      );
    } else if (
      destination &&
      source &&
      !(
        // ensure it has moved
        (destination.id === source.id && destination.index === source.index)
      )
    ) {
      dispatch(moveComponent(dropResult));
    }

    // call getState() again down here in case redux state is stale after
    // previous dispatch(es)
    const { dashboardFilters, dashboardLayout: undoableLayout } = getState();

    // if we moved a child from a Tab or Row parent and it was the only child, delete the parent.
    if (!isNewComponent) {
      const { present: layout } = undoableLayout;
      const sourceComponent = layout[source.id] || {};
      const destinationComponent = layout[destination.id] || {};
      if (
        (sourceComponent.type === TABS_TYPE ||
          sourceComponent.type === PAGES_TYPE ||
          sourceComponent.type === ROW_TYPE) &&
        sourceComponent.children &&
        sourceComponent.children.length === 0
      ) {
        const parentId = findParentId({
          childId: source.id,
          layout,
        });
        dispatch(deleteComponent(source.id, parentId));
      }

      // show warning if item has been moved between different scope
      if (
        isInDifferentFilterScopes({
          dashboardFilters,
          source: (sourceComponent.parents || []).concat(source.id),
          destination: (destinationComponent.parents || []).concat(
            destination.id,
          ),
        })
      ) {
        dispatch(
          addWarningToast(
            t('This chart has been moved to a different filter scope.'),
          ),
        );
      }
    }

    return null;
  };
}

export const clearDashboardHistory = () => UndoActionCreators.clearHistory();

// Undo redo ------------------------------------------------------------------
export function undoLayoutAction() {
  return (dispatch, getState) => {
    dispatch(UndoActionCreators.undo());

    const { dashboardLayout, dashboardState } = getState();

    if (
      dashboardLayout.past.length === 0 &&
      !dashboardState.maxUndoHistoryExceeded &&
      !dashboardState.updatedColorScheme
    ) {
      dispatch(setUnsavedChanges(false));
    }
  };
}

export const redoLayoutAction = setUnsavedChangesAfterAction(
  UndoActionCreators.redo,
);

// Update component parents list ----------------------------------------------
export const UPDATE_COMPONENTS_PARENTS_LIST = 'UPDATE_COMPONENTS_PARENTS_LIST';
