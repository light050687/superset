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
import {
  Fragment,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  memo,
} from 'react';
import PropTypes from 'prop-types';
import { shallowEqual, useSelector } from 'react-redux';
import cx from 'classnames';
import {
  css,
  FeatureFlag,
  isFeatureEnabled,
  styled,
  t,
} from '@superset-ui/core';
import { Icons, Constants } from '@superset-ui/core/components';

import {
  Draggable,
  Droppable,
} from 'src/dashboard/components/dnd/DragDroppable';
import DragHandle from 'src/dashboard/components/dnd/DragHandle';
import DashboardComponent from 'src/dashboard/containers/DashboardComponent';
import DeleteComponentButton from 'src/dashboard/components/DeleteComponentButton';
import HoverMenu from 'src/dashboard/components/menu/HoverMenu';
import IconButton from 'src/dashboard/components/IconButton';
import BackgroundStyleDropdown from 'src/dashboard/components/menu/BackgroundStyleDropdown';
import WithPopoverMenu from 'src/dashboard/components/menu/WithPopoverMenu';
import { componentShape } from 'src/dashboard/util/propShapes';
import backgroundStyleOptions from 'src/dashboard/util/backgroundStyleOptions';
import { BACKGROUND_TRANSPARENT } from 'src/dashboard/util/constants';
import { isEmbedded } from 'src/dashboard/util/isEmbedded';
import { EMPTY_CONTAINER_Z_INDEX } from 'src/dashboard/constants';
import { isCurrentUserBot } from 'src/utils/isBot';
import { useDebouncedEffect } from '../../../../explore/exploreUtils';

const propTypes = {
  id: PropTypes.string.isRequired,
  parentId: PropTypes.string.isRequired,
  component: componentShape.isRequired,
  parentComponent: componentShape.isRequired,
  index: PropTypes.number.isRequired,
  depth: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,

  // grid related
  availableColumnCount: PropTypes.number.isRequired,
  columnWidth: PropTypes.number.isRequired,
  occupiedColumnCount: PropTypes.number.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,
  maxChildrenHeight: PropTypes.number.isRequired,

  // dnd
  handleComponentDrop: PropTypes.func.isRequired,
  deleteComponent: PropTypes.func.isRequired,
  updateComponents: PropTypes.func.isRequired,
};

const GridRow = styled.div`
  ${({ theme, editMode }) => css`
    position: relative;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    /* DS2 row equalization: все виджеты в строке тянутся до высоты самого
       высокого. Без этого markdown короткий, чарт длинный — «ступенька»
       при resize окна. align-items: stretch заставляет flex-children
       заполнять cross-axis (высоту row) полностью. */
    align-items: stretch;
    width: 100%;
    height: fit-content;

    /* DS2 row equalization — align-items: stretch выше + flex-chain в
       DashboardBuilder.tsx ([data-view-mode="true"]) растягивает ВСЕ
       визуалы (markdown/charts/любые плагины) до высоты row. Этот файл
       только задаёт base align-items: stretch — детальный flex-chain
       живёт в одном месте (DashboardBuilder) и применяется глобально.
       Memory: feedback_row_stretch_visuals.md */

    & > :not(:last-child):not(.hover-menu) {
      ${!editMode && `margin-right: ${theme.sizeUnit * 4}px;`}
    }
    /* Row equalization (view-mode) реализована в DashboardBuilder.tsx
       через flex-chain: .resizable-container height:unset + flex:1 на
       каждом wrapper'е до плагина. Тут CSS не дублируем. */

    & .empty-droptarget {
      position: relative;
      align-self: center;
      &.empty-droptarget--vertical {
        min-width: ${theme.sizeUnit * 4}px;
        &:not(:last-child) {
          width: ${theme.sizeUnit * 4}px;
        }
        &:first-of-type:not(.droptarget-side) {
          z-index: ${EMPTY_CONTAINER_Z_INDEX};
          position: absolute;
          width: 100%;
          height: 100%;
        }
      }
      &.droptarget-side {
        z-index: ${EMPTY_CONTAINER_Z_INDEX};
        position: absolute;
        width: ${theme.sizeUnit * 4}px;
        &:first-of-type {
          inset-inline-start: 0;
        }
      }
    }

    &.grid-row--empty {
      min-height: ${theme.sizeUnit * 25}px;
    }
  `}
`;

const emptyRowContentStyles = theme => css`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colorTextLabel};
`;

const Row = props => {
  const {
    component: rowComponent,
    parentComponent,
    index,
    availableColumnCount,
    columnWidth,
    occupiedColumnCount,
    depth,
    onResizeStart,
    onResize,
    onResizeStop,
    handleComponentDrop,
    editMode,
    onChangeTab,
    isComponentVisible,
    updateComponents,
    deleteComponent,
    parentId,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  // `isInView` is permanently `true`. The built-in dashboard
  // virtualization via `IntersectionObserver` has two known issues in
  // our AntD v6 + React 18 environment:
  //   (1) IO doesn't re-fire on window resize if the element becomes
  //       visible through viewport change (W3C IntersectionObserver
  //       issue #311) — lower charts get stuck invisible after resize.
  //   (2) `CSSMotion` inside AntD Tabs occasionally swallows the
  //       observer callback for components that mount while their tab
  //       is animating in.
  // Apache Superset upstream (#29636, #18586) recommends disabling
  // virtualization for dashboards with <100 charts, which matches our
  // production distribution (typical dashboard size 15-30 charts).
  // Keeping the flag on for telemetry / future re-enabling, but
  // forcing `isInView=true` bypasses the broken observer entirely.
  const [isInView] = useState(true);
  const [hoverMenuHovered, setHoverMenuHovered] = useState(false);
  const [containerHeight, setContainerHeight] = useState(null);
  const containerRef = useRef();
  const isComponentVisibleRef = useRef(isComponentVisible);

  useEffect(() => {
    isComponentVisibleRef.current = isComponentVisible;
  }, [isComponentVisible]);

  // IntersectionObserver-based virtualization is disabled (isInView is
  // always true) — see comment on `useState(true)` above for rationale.

  useDebouncedEffect(
    () => {
      const updatedHeight = containerRef.current?.clientHeight;
      if (
        editMode &&
        containerRef.current &&
        updatedHeight !== containerHeight
      ) {
        setContainerHeight(updatedHeight);
      }
    },
    Constants.FAST_DEBOUNCE,
    [editMode, containerHeight],
  );

  const handleChangeFocus = useCallback(nextFocus => {
    setIsFocused(Boolean(nextFocus));
  }, []);

  const handleChangeBackground = useCallback(
    nextValue => {
      const metaKey = 'background';
      if (nextValue && rowComponent.meta[metaKey] !== nextValue) {
        updateComponents({
          [rowComponent.id]: {
            ...rowComponent,
            meta: {
              ...rowComponent.meta,
              [metaKey]: nextValue,
            },
          },
        });
      }
    },
    [updateComponents, rowComponent],
  );

  const handleDeleteComponent = useCallback(() => {
    deleteComponent(rowComponent.id, parentId);
  }, [deleteComponent, rowComponent, parentId]);

  const handleMenuHover = useCallback(hovered => {
    const { isHovered } = hovered;
    setHoverMenuHovered(isHovered);
  }, []);

  const rowItems = useMemo(
    () => rowComponent.children || [],
    [rowComponent.children],
  );

  /* Ширины детей нужны чтобы посчитать widthLeft / rightSiblingsCount для
     push-shrink resize в col-mode (см. resizeComponentWithShrinkingNeighbors).
     shallowEqual чтобы массив не вызывал лишних перерендеров — useSelector
     re-fire'ит только при изменении одной из ширин. */
  const rowChildWidths = useSelector(
    state =>
      rowItems.map(
        childId => state.dashboardLayout.present[childId]?.meta?.width || 0,
      ),
    shallowEqual,
  );

  const backgroundStyle = backgroundStyleOptions.find(
    opt =>
      opt.value === (rowComponent.meta.background || BACKGROUND_TRANSPARENT),
  );
  const remainColumnCount = availableColumnCount - occupiedColumnCount;
  const renderChild = useCallback(
    ({ dragSourceRef }) => (
      <WithPopoverMenu
        isFocused={isFocused}
        onChangeFocus={handleChangeFocus}
        disableClick
        menuItems={[
          <BackgroundStyleDropdown
            id={`${rowComponent.id}-background`}
            value={backgroundStyle.value}
            onChange={handleChangeBackground}
          />,
        ]}
        editMode={editMode}
      >
        {editMode && (
          <HoverMenu
            onHover={handleMenuHover}
            innerRef={dragSourceRef}
            position="left"
          >
            <DragHandle position="left" />
            <DeleteComponentButton onDelete={handleDeleteComponent} />
            <IconButton
              onClick={handleChangeFocus}
              icon={<Icons.SettingOutlined iconSize="l" />}
            />
          </HoverMenu>
        )}
        <GridRow
          className={cx(
            'grid-row',
            rowItems.length === 0 && 'grid-row--empty',
            hoverMenuHovered && 'grid-row--hovered',
            backgroundStyle.className,
          )}
          data-test={`grid-row-${backgroundStyle.className}`}
          ref={containerRef}
          editMode={editMode}
        >
          {editMode && (
            <Droppable
              {...(rowItems.length === 0
                ? {
                    component: rowComponent,
                    parentComponent: rowComponent,
                    dropToChild: true,
                  }
                : {
                    component: rowItems[0],
                    parentComponent: rowComponent,
                  })}
              depth={depth}
              index={0}
              orientation="row"
              onDrop={handleComponentDrop}
              className={cx(
                'empty-droptarget',
                'empty-droptarget--vertical',
                rowItems.length > 0 && 'droptarget-side',
              )}
              editMode
              style={{
                height: rowItems.length > 0 ? containerHeight : '100%',
                ...(rowItems.length > 0 && { width: 16 }),
              }}
            >
              {({ dropIndicatorProps }) =>
                dropIndicatorProps && <div {...dropIndicatorProps} />
              }
            </Droppable>
          )}
          {rowItems.length === 0 && (
            <div css={emptyRowContentStyles}>{t('Empty row')}</div>
          )}
          {rowItems.length > 0 &&
            rowItems.map((componentId, itemIndex) => {
              /* widthLeft = сумма ширин ВСЕХ соседей слева;
                 leftSiblingsCount = число соседей слева (для push-shrink);
                 rightSiblingsCount = число соседей справа.
                 Используются ChartHolder'ом для расчёта maxWidthMultiple
                 (push-shrink в обе стороны) и для thunk при onResizeStop. */
              let widthLeft = 0;
              for (let i = 0; i < itemIndex; i += 1) {
                widthLeft += rowChildWidths[i] || 0;
              }
              const leftSiblingsCount = itemIndex;
              const rightSiblingsCount = rowItems.length - itemIndex - 1;
              return (
                <Fragment key={componentId}>
                  <DashboardComponent
                    key={componentId}
                    id={componentId}
                    parentId={rowComponent.id}
                    depth={depth + 1}
                    index={itemIndex}
                    availableColumnCount={remainColumnCount}
                    columnWidth={columnWidth}
                    widthLeft={widthLeft}
                    leftSiblingsCount={leftSiblingsCount}
                    rightSiblingsCount={rightSiblingsCount}
                    onResizeStart={onResizeStart}
                    onResize={onResize}
                    onResizeStop={onResizeStop}
                    isComponentVisible={isComponentVisible}
                    onChangeTab={onChangeTab}
                    isInView={isInView}
                  />
                  {editMode && (
                    <Droppable
                      component={rowItems}
                      parentComponent={rowComponent}
                      depth={depth}
                      index={itemIndex + 1}
                      orientation="row"
                      onDrop={handleComponentDrop}
                      className={cx(
                        'empty-droptarget',
                        'empty-droptarget--vertical',
                        remainColumnCount === 0 &&
                          itemIndex === rowItems.length - 1 &&
                          'droptarget-side',
                      )}
                      editMode
                      style={{
                        height: containerHeight,
                        ...(remainColumnCount === 0 &&
                          itemIndex === rowItems.length - 1 && { width: 16 }),
                      }}
                    >
                      {({ dropIndicatorProps }) =>
                        dropIndicatorProps && <div {...dropIndicatorProps} />
                      }
                    </Droppable>
                  )}
                </Fragment>
              );
            })}
        </GridRow>
      </WithPopoverMenu>
    ),
    [
      backgroundStyle.className,
      backgroundStyle.value,
      columnWidth,
      containerHeight,
      depth,
      editMode,
      handleChangeBackground,
      handleChangeFocus,
      handleComponentDrop,
      handleDeleteComponent,
      handleMenuHover,
      hoverMenuHovered,
      isComponentVisible,
      isFocused,
      isInView,
      onChangeTab,
      onResize,
      onResizeStart,
      onResizeStop,
      remainColumnCount,
      rowChildWidths,
      rowComponent,
      rowItems,
    ],
  );

  return (
    <Draggable
      component={rowComponent}
      parentComponent={parentComponent}
      orientation="row"
      index={index}
      depth={depth}
      onDrop={handleComponentDrop}
      editMode={editMode}
    >
      {renderChild}
    </Draggable>
  );
};

Row.propTypes = propTypes;

export default memo(Row);
