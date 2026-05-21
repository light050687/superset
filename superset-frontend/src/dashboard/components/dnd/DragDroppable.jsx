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
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import cx from 'classnames';
import { css, styled } from '@superset-ui/core';

import { TAB_TYPE } from 'src/dashboard/util/componentTypes';
import { componentShape } from '../../util/propShapes';
import { DROP_FORBIDDEN } from '../../util/getDropPosition';
import handleHover from './handleHover';
import handleDrop from './handleDrop';

// React-dnd item type for dashboard components
const TYPE = 'DRAG_DROPPABLE';

const propTypes = {
  children: PropTypes.func,
  className: PropTypes.string,
  component: componentShape,
  parentComponent: componentShape,
  depth: PropTypes.number.isRequired,
  disableDragDrop: PropTypes.bool,
  dropToChild: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  orientation: PropTypes.oneOf(['row', 'column']),
  index: PropTypes.number.isRequired,
  style: PropTypes.object,
  onDrop: PropTypes.func,
  onHover: PropTypes.func,
  onDropIndicatorChange: PropTypes.func,
  onDragTab: PropTypes.func,
  editMode: PropTypes.bool,
  useEmptyDragPreview: PropTypes.bool,

  // Injected by wrappers below (or supplied directly in tests).
  isDragging: PropTypes.bool,
  isDraggingOver: PropTypes.bool,
  isDraggingOverShallow: PropTypes.bool,
  dragComponentType: PropTypes.string,
  dragComponentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  droppableRef: PropTypes.func,
  dragSourceRef: PropTypes.func,
  dragPreviewRef: PropTypes.func,

  // Test-only override — forces the internal dropIndicator state.
  dropIndicatorOverride: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
  ]),
};

const DragDroppableStyles = styled.div`
  ${({ theme }) => css`
    position: relative;

    &.dragdroppable--dragging {
      opacity: 0.2;
    }

    &.dragdroppable-row {
      width: 100%;
    }

    &.dragdroppable-column .resizable-container span div {
      z-index: 10;
    }

    & {
      .drop-indicator {
        display: block;
        background-color: ${theme.colorPrimary};
        position: absolute;
        z-index: 10;
        opacity: 0.3;
        width: 100%;
        height: 100%;
        &.drop-indicator--forbidden {
          background-color: ${theme.colorErrorBg};
        }
      }
    }
  `};
`;

// Presentational FC. Takes all drag/drop state as props; the wrappers below
// (Draggable / Droppable / DragDroppable) inject those via react-dnd hooks.
export const UnwrappedDragDroppable = forwardRef((props, forwardedRef) => {
  // Inline defaults replace the legacy `Component.defaultProps`, which React
  // 18 deprecates on function components.
  const {
    children = () => {},
    className = null,
    orientation = 'row',
    dragSourceRef = () => {},
    dragPreviewRef = () => {},
    droppableRef = () => {},
    disableDragDrop = false,
    isDragging = false,
    isDraggingOver = false,
    style = null,
    editMode,
    component,
    dragComponentType,
    dragComponentId,
    onDropIndicatorChange = () => {},
    onDragTab = () => {},
    index,
    useEmptyDragPreview = false,
    dropIndicatorOverride,
  } = props;

  // Only the combined DragDroppable wrapper writes here; Draggable / Droppable
  // supply no-op handlers and the test override path bypasses this setter.
  const [dropIndicator, setDropIndicator] = useState(null);
  const effectiveDropIndicator =
    dropIndicatorOverride !== undefined ? dropIndicatorOverride : dropIndicator;

  const elementRef = useRef(null);
  const prevIndicatorRef = useRef(effectiveDropIndicator);
  const prevIsDraggingOverRef = useRef(isDraggingOver);
  const prevIndexRef = useRef(index);
  const prevDragComponentIdRef = useRef(dragComponentId);

  // Expose setState({ dropIndicator }) to handleHover / handleDrop which still
  // operate on a classic class-component shape.
  const setStateLike = useCallback(updater => {
    const next = typeof updater === 'function' ? updater({}) : updater;
    if (next && 'dropIndicator' in next) {
      setDropIndicator(next.dropIndicator);
    }
  }, []);

  // Classic-API proxy used by handleHover/handleDrop. Props are read lazily so
  // the handlers always see the latest values across re-renders.
  const propsRef = useRef(props);
  propsRef.current = props;
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const componentProxyRef = useRef(null);
  if (!componentProxyRef.current) {
    componentProxyRef.current = {
      get props() {
        return propsRef.current;
      },
      get mounted() {
        return mountedRef.current;
      },
      get ref() {
        return elementRef.current;
      },
      setState: setStateLike,
    };
  }

  // Compose the forwarded ref with the react-dnd refs and our internal ref.
  const setNodeRef = useCallback(
    node => {
      elementRef.current = node;

      if (useEmptyDragPreview) {
        dragPreviewRef?.(getEmptyImage(), { captureDraggingState: true });
      } else {
        dragPreviewRef?.(node);
      }
      droppableRef?.(node);

      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [dragPreviewRef, droppableRef, useEmptyDragPreview, forwardedRef],
  );

  // Surface onDropIndicatorChange for TAB components — mirrors the previous
  // componentDidUpdate behavior.
  useEffect(() => {
    const isTabsType = component?.type === TAB_TYPE;
    if (!isTabsType || !onDropIndicatorChange) return;
    const changed =
      prevIndicatorRef.current !== effectiveDropIndicator ||
      prevIsDraggingOverRef.current !== isDraggingOver ||
      prevIndexRef.current !== index;
    if (changed) {
      onDropIndicatorChange({
        dropIndicator: effectiveDropIndicator,
        isDraggingOver,
        index,
      });
    }
    prevIndicatorRef.current = effectiveDropIndicator;
    prevIsDraggingOverRef.current = isDraggingOver;
    prevIndexRef.current = index;
  }, [
    component?.type,
    effectiveDropIndicator,
    isDraggingOver,
    index,
    onDropIndicatorChange,
  ]);

  useEffect(() => {
    if (prevDragComponentIdRef.current !== dragComponentId) {
      prevDragComponentIdRef.current = dragComponentId;
      // Defer so drag refs are attached before the node is removed in Tabs.jsx,
      // otherwise react-dnd fails to build the drag preview.
      const id = window.setTimeout(() => onDragTab?.(dragComponentId), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [dragComponentId, onDragTab]);

  const dropIndicatorProps =
    isDraggingOver && effectiveDropIndicator && !disableDragDrop
      ? {
          className: cx(
            'drop-indicator',
            effectiveDropIndicator === DROP_FORBIDDEN &&
              'drop-indicator--forbidden',
          ),
        }
      : null;

  const draggingTabOnTab =
    component?.type === TAB_TYPE && dragComponentType === TAB_TYPE;

  const childProps = editMode
    ? {
        dragSourceRef,
        dropIndicatorProps,
        draggingTabOnTab,
        'data-test': 'dragdroppable-content',
      }
    : {
        'data-test': 'dragdroppable-content',
      };

  // Expose the proxy for handler-mode wrappers via a ref on the DOM node.
  UnwrappedDragDroppable._lastProxy = componentProxyRef.current;

  return (
    <DragDroppableStyles
      style={style}
      ref={setNodeRef}
      data-test="dragdroppable-object"
      className={cx(
        'dragdroppable',
        editMode && 'dragdroppable--edit-mode',
        orientation === 'row' && 'dragdroppable-row',
        orientation === 'column' && 'dragdroppable-column',
        isDragging && 'dragdroppable--dragging',
        className,
      )}
    >
      {children(childProps)}
    </DragDroppableStyles>
  );
});

UnwrappedDragDroppable.displayName = 'UnwrappedDragDroppable';
UnwrappedDragDroppable.propTypes = propTypes;

// Shared useLayoutEffect to keep component proxy props up to date; exported as
// a small hook so wrappers below can attach hover/drop handlers against it.
// Returns [proxyRef, nodeRef]. nodeRef must be forwarded to UnwrappedDragDroppable
// so handleHover/handleDrop → getDropPosition can read Component.ref
// (legacy class-API contract: ref is the DOM node for getBoundingClientRect).
function useComponentProxy() {
  const nodeRef = useRef(null);
  const proxyRef = useRef(null);
  if (!proxyRef.current) {
    const slot = {
      mounted: false,
      props: {},
      setState: () => {},
    };
    Object.defineProperty(slot, 'ref', {
      get: () => nodeRef.current,
      enumerable: true,
    });
    proxyRef.current = slot;
  }
  useLayoutEffect(() => {
    proxyRef.current.mounted = true;
    return () => {
      proxyRef.current.mounted = false;
    };
  }, []);
  return [proxyRef, nodeRef];
}

// Drag-only wrapper (parity with legacy `Draggable` HOC export).
export function Draggable(props) {
  const [proxyRef, nodeRef] = useComponentProxy();
  proxyRef.current.props = props;

  const [
    { isDragging, dragComponentId, dragComponentType },
    dragRef,
    dragPreviewRef,
  ] = useDrag(
    () => ({
      type: TYPE,
      canDrag: () => !props.disableDragDrop,
      item: () => {
        const { component, index, parentComponent } = proxyRef.current.props;
        return {
          type: component?.type,
          id: component?.id,
          meta: component?.meta,
          index,
          parentId: parentComponent?.id,
          parentType: parentComponent?.type,
        };
      },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
        dragComponentId: monitor.getItem()?.id,
        dragComponentType: monitor.getItem()?.type,
      }),
    }),
    [props.disableDragDrop],
  );

  return (
    <UnwrappedDragDroppable
      {...props}
      ref={nodeRef}
      isDragging={isDragging}
      dragComponentId={dragComponentId}
      dragComponentType={dragComponentType}
      dragSourceRef={dragRef}
      dragPreviewRef={dragPreviewRef}
    />
  );
}
Draggable.propTypes = propTypes;

// Drop-only wrapper (parity with legacy `Droppable` HOC export).
export function Droppable(props) {
  const [proxyRef, nodeRef] = useComponentProxy();
  proxyRef.current.props = props;
  const [internalDropIndicator, setInternalDropIndicator] = useState(null);
  proxyRef.current.setState = updater => {
    const next = typeof updater === 'function' ? updater({}) : updater;
    if (next && 'dropIndicator' in next) {
      setInternalDropIndicator(next.dropIndicator);
    }
  };

  const [{ isDraggingOver, isDraggingOverShallow }, dropRef] = useDrop(
    () => ({
      accept: TYPE,
      canDrop: () => !props.disableDragDrop,
      hover: (_item, monitor) => {
        if (proxyRef.current.mounted) {
          handleHover(proxyRef.current.props, monitor, proxyRef.current);
        }
      },
      drop: (_item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (
          (!dropResult || !dropResult.destination) &&
          proxyRef.current.mounted
        ) {
          return handleDrop(proxyRef.current.props, monitor, proxyRef.current);
        }
        return undefined;
      },
      collect: monitor => ({
        isDraggingOver: monitor.isOver(),
        isDraggingOverShallow: monitor.isOver({ shallow: true }),
      }),
    }),
    [props.disableDragDrop],
  );

  return (
    <UnwrappedDragDroppable
      {...props}
      ref={nodeRef}
      isDraggingOver={isDraggingOver}
      isDraggingOverShallow={isDraggingOverShallow}
      droppableRef={dropRef}
      dropIndicatorOverride={internalDropIndicator ?? undefined}
    />
  );
}
Droppable.propTypes = propTypes;

// Combined drag+drop wrapper (primary dashboard grid export).
export function DragDroppable(props) {
  const [proxyRef, nodeRef] = useComponentProxy();
  proxyRef.current.props = props;
  const [internalDropIndicator, setInternalDropIndicator] = useState(null);
  proxyRef.current.setState = updater => {
    const next = typeof updater === 'function' ? updater({}) : updater;
    if (next && 'dropIndicator' in next) {
      setInternalDropIndicator(next.dropIndicator);
    }
  };

  const [
    { isDragging, dragComponentId, dragComponentType },
    dragRef,
    dragPreviewRef,
  ] = useDrag(
    () => ({
      type: TYPE,
      canDrag: () => !props.disableDragDrop,
      item: () => {
        const { component, index, parentComponent } = proxyRef.current.props;
        return {
          type: component?.type,
          id: component?.id,
          meta: component?.meta,
          index,
          parentId: parentComponent?.id,
          parentType: parentComponent?.type,
        };
      },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
        dragComponentId: monitor.getItem()?.id,
        dragComponentType: monitor.getItem()?.type,
      }),
    }),
    [props.disableDragDrop],
  );

  const [{ isDraggingOver, isDraggingOverShallow }, dropRef] = useDrop(
    () => ({
      accept: TYPE,
      canDrop: () => !props.disableDragDrop,
      hover: (_item, monitor) => {
        if (proxyRef.current.mounted) {
          handleHover(proxyRef.current.props, monitor, proxyRef.current);
        }
      },
      drop: (_item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (
          (!dropResult || !dropResult.destination) &&
          proxyRef.current.mounted
        ) {
          return handleDrop(proxyRef.current.props, monitor, proxyRef.current);
        }
        return undefined;
      },
      collect: monitor => ({
        isDraggingOver: monitor.isOver(),
        isDraggingOverShallow: monitor.isOver({ shallow: true }),
      }),
    }),
    [props.disableDragDrop],
  );

  return (
    <UnwrappedDragDroppable
      {...props}
      ref={nodeRef}
      isDragging={isDragging}
      dragComponentId={dragComponentId}
      dragComponentType={dragComponentType}
      dragSourceRef={dragRef}
      dragPreviewRef={dragPreviewRef}
      isDraggingOver={isDraggingOver}
      isDraggingOverShallow={isDraggingOverShallow}
      droppableRef={dropRef}
      dropIndicatorOverride={internalDropIndicator ?? undefined}
    />
  );
}
DragDroppable.propTypes = propTypes;
