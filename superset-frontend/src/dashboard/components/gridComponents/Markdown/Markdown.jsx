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
import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';

import { css, styled, t } from '@superset-ui/core';
import { SafeMarkdown, MarkdownEditor } from '@superset-ui/core/components';
import { Logger, LOG_ACTIONS_RENDER_CHART } from 'src/logger/LogUtils';

import DeleteComponentButton from 'src/dashboard/components/DeleteComponentButton';
import { Draggable } from 'src/dashboard/components/dnd/DragDroppable';
import HoverMenu from 'src/dashboard/components/menu/HoverMenu';
import ResizableContainer from 'src/dashboard/components/resizable/ResizableContainer';
import MarkdownModeDropdown from 'src/dashboard/components/menu/MarkdownModeDropdown';
import WithPopoverMenu from 'src/dashboard/components/menu/WithPopoverMenu';
import { componentShape } from 'src/dashboard/util/propShapes';
import { ROW_TYPE, COLUMN_TYPE } from 'src/dashboard/util/componentTypes';
import {
  GRID_MIN_COLUMN_COUNT,
  GRID_MIN_ROW_UNITS,
  GRID_BASE_UNIT,
} from 'src/dashboard/util/constants';

const propTypes = {
  id: PropTypes.string.isRequired,
  parentId: PropTypes.string.isRequired,
  component: componentShape.isRequired,
  parentComponent: componentShape.isRequired,
  index: PropTypes.number.isRequired,
  depth: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,

  // from redux
  logEvent: PropTypes.func.isRequired,
  addDangerToast: PropTypes.func.isRequired,
  undoLength: PropTypes.number.isRequired,
  redoLength: PropTypes.number.isRequired,

  // grid related
  availableColumnCount: PropTypes.number.isRequired,
  columnWidth: PropTypes.number.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,

  // dnd
  deleteComponent: PropTypes.func.isRequired,
  handleComponentDrop: PropTypes.func.isRequired,
  updateComponents: PropTypes.func.isRequired,

  // HTML sanitization
  htmlSanitization: PropTypes.bool,
  htmlSchemaOverrides: PropTypes.object,
};

const defaultProps = {};

// TODO: localize
const MARKDOWN_PLACE_HOLDER = `# ✨Header 1
## ✨Header 2
### ✨Header 3

<br />

Click here to learn more about [markdown formatting](https://bit.ly/1dQOfRK)`;

const MARKDOWN_ERROR_MESSAGE = t('This markdown component has an error.');

/* DS v2.0 — Markdown типографика по L-шкале (Desktop ≥1280px / 2K).
   Источник: docs/audit-ds2 wave12. Scope: только `.dashboard-markdown`,
   глобально не утекает. Шрифт текста — Manrope (var(--f)),
   моноширинный для code/pre — JetBrains Mono (var(--m)).
   Цвета через CSS-переменные DS: --ink (основной), --c-sky (ссылки),
   --g100 (фон inline-code), --g600 (мета/blockquote). */
const MarkdownStyles = styled.div`
  ${({ theme }) => css`
    &.dashboard-markdown {
      overflow: hidden;
      color: var(--ink, ${theme.colorText});
      font-family: var(--f, ${theme.fontFamily});

      /* DS v2.0 fluid: --fs-body для абзацев, списков (14-17 fluid) */
      p,
      li,
      dd,
      dt {
        font-family: var(--f, ${theme.fontFamily});
        font-size: var(--fs-body);
        line-height: 1.5;
        font-weight: 400;
        color: var(--ink, ${theme.colorText});
      }

      p {
        margin: 0 0 12px;
      }

      ul,
      ol {
        margin: 0 0 12px;
        padding-left: 24px;
      }

      /* DS v2.0 fluid: H1 = --fs-hero (28-56), растёт с viewport */
      h1 {
        font-family: var(--f, ${theme.fontFamily});
        font-size: var(--fs-hero);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--ink, ${theme.colorText});
        margin: 0 0 16px;
      }

      /* DS v2.0 fluid: H2 = --fs-title (20-28) */
      h2 {
        font-family: var(--f, ${theme.fontFamily});
        font-size: var(--fs-title);
        line-height: 1.2;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--ink, ${theme.colorText});
        margin: 0 0 12px;
      }

      /* DS v2.0 fluid: H3 = --fs-subtitle (16-20) — повышение читаемости */
      h3 {
        font-family: var(--f, ${theme.fontFamily});
        font-size: var(--fs-subtitle);
        line-height: 1.3;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--ink, ${theme.colorText});
        margin: 0 0 8px;
      }

      h4,
      h5,
      h6 {
        font-family: var(--f, ${theme.fontFamily});
        font-weight: ${theme.fontWeightNormal};
        color: var(--ink, ${theme.colorText});
      }

      h6 {
        font-size: var(--fs-meta);
      }

      strong {
        font-weight: 600;
      }

      /* Ссылки — DS sky-акцент */
      a,
      a:visited {
        color: var(--c-sky, ${theme.colorPrimary});
        text-decoration: none;
      }

      a:hover,
      a:focus-visible {
        color: var(--c-sky, ${theme.colorPrimary});
        text-decoration: underline;
      }

      a:focus-visible {
        outline: 2px solid var(--c-sky, ${theme.colorPrimary});
        outline-offset: 2px;
      }

      /* DS v2.0 fluid: --fs-meta моно для inline-code и блоков */
      code,
      pre,
      kbd,
      samp {
        font-family: var(--m, ${theme.fontFamilyCode || 'monospace'});
        font-size: var(--fs-meta);
        line-height: 1.5;
        font-weight: 400;
      }

      code {
        background: var(--g100, ${theme.colorBgLayout});
        color: var(--ink, ${theme.colorText});
        padding: 2px 6px;
        border-radius: 4px;
      }

      pre {
        background: var(--g100, ${theme.colorBgLayout});
        color: var(--ink, ${theme.colorText});
        padding: 12px 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 0 0 12px;
      }

      pre code {
        background: transparent;
        padding: 0;
        border-radius: 0;
      }

      blockquote {
        margin: 0 0 12px;
        padding: 0 12px;
        border-left: 3px solid var(--g100, ${theme.colorBorder});
        color: var(--g600, ${theme.colorTextSecondary});
        font-style: normal;
      }

      .dashboard-component-chart-holder {
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: ${theme.borderRadius}px;
      }

      .dashboard--editing & {
        cursor: move;
      }
    }
  `}
`;

class Markdown extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      markdownSource: props.component.meta.code,
      editor: null,
      editorMode: 'preview',
      undoLength: props.undoLength,
      redoLength: props.redoLength,
    };
    this.renderStartTime = Logger.getTimestamp();

    this.handleChangeFocus = this.handleChangeFocus.bind(this);
    this.handleChangeEditorMode = this.handleChangeEditorMode.bind(this);
    this.handleMarkdownChange = this.handleMarkdownChange.bind(this);
    this.handleDeleteComponent = this.handleDeleteComponent.bind(this);
    this.handleResizeStart = this.handleResizeStart.bind(this);
    this.setEditor = this.setEditor.bind(this);
    this.shouldFocusMarkdown = this.shouldFocusMarkdown.bind(this);
  }

  componentDidMount() {
    this.props.logEvent(LOG_ACTIONS_RENDER_CHART, {
      viz_type: 'markdown',
      start_offset: this.renderStartTime,
      ts: new Date().getTime(),
      duration: Logger.getTimestamp() - this.renderStartTime,
    });
  }

  static getDerivedStateFromProps(nextProps, state) {
    const { hasError, editorMode, markdownSource, undoLength, redoLength } =
      state;
    const {
      component: nextComponent,
      undoLength: nextUndoLength,
      redoLength: nextRedoLength,
    } = nextProps;
    // user click undo or redo ?
    if (nextUndoLength !== undoLength || nextRedoLength !== redoLength) {
      return {
        ...state,
        undoLength: nextUndoLength,
        redoLength: nextRedoLength,
        markdownSource: nextComponent.meta.code,
        hasError: false,
      };
    }
    // Защита: не затирать локально набранный markdown пустым/неинициализированным
    // meta.code из Redux. Иначе любой re-render с propsRef-сменой (например смена
    // темы → новый emotionCache → каскад re-render по дереву) сбрасывает текст,
    // если Markdown был добавлен но ещё не сохранён в Redux (newComponentFactory
    // не сидит meta.code, save идёт только на edit→preview).
    if (
      !hasError &&
      editorMode === 'preview' &&
      typeof nextComponent.meta.code === 'string' &&
      nextComponent.meta.code !== markdownSource
    ) {
      return {
        ...state,
        markdownSource: nextComponent.meta.code,
      };
    }

    return state;
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.editor &&
      (prevProps.component.meta.width !== this.props.component.meta.width ||
        prevProps.columnWidth !== this.props.columnWidth)
    ) {
      this.state.editor.resize(true);
    }
    // pre-load AceEditor when entering edit mode
    if (this.props.editMode) {
      MarkdownEditor.preload();
    }
  }

  componentDidCatch() {
    if (this.state.editor && this.state.editorMode === 'preview') {
      this.props.addDangerToast(
        t(
          'This markdown component has an error. Please revert your recent changes.',
        ),
      );
    }
  }

  setEditor(editor) {
    editor.getSession().setUseWrapMode(true);
    this.setState({
      editor,
    });
  }

  handleChangeFocus(nextFocus) {
    const nextFocused = !!nextFocus;
    const nextEditMode = nextFocused ? 'edit' : 'preview';
    this.setState(() => ({ isFocused: nextFocused }));
    this.handleChangeEditorMode(nextEditMode);
  }

  handleChangeEditorMode(mode) {
    const nextState = {
      ...this.state,
      editorMode: mode,
    };
    if (mode === 'preview') {
      this.updateMarkdownContent();
      nextState.hasError = false;
    }

    this.setState(nextState);
  }

  updateMarkdownContent() {
    const { updateComponents, component } = this.props;
    if (component.meta.code !== this.state.markdownSource) {
      updateComponents({
        [component.id]: {
          ...component,
          meta: {
            ...component.meta,
            code: this.state.markdownSource,
          },
        },
      });
    }
  }

  handleMarkdownChange(nextValue) {
    this.setState({
      markdownSource: nextValue,
    });
  }

  handleDeleteComponent() {
    const { deleteComponent, id, parentId } = this.props;
    deleteComponent(id, parentId);
  }

  handleResizeStart(e) {
    const { editorMode } = this.state;
    const { editMode, onResizeStart } = this.props;
    const isEditing = editorMode === 'edit';
    onResizeStart(e);
    if (editMode && isEditing) {
      this.updateMarkdownContent();
    }
  }

  shouldFocusMarkdown(event, container, menuRef) {
    if (container?.contains(event.target)) return true;
    if (menuRef?.contains(event.target)) return true;

    return false;
  }

  renderEditMode() {
    return (
      <MarkdownEditor
        onChange={this.handleMarkdownChange}
        width="100%"
        height="100%"
        showGutter={false}
        editorProps={{ $blockScrolling: true }}
        value={
          // this allows "select all => delete" to give an empty editor
          typeof this.state.markdownSource === 'string'
            ? this.state.markdownSource
            : MARKDOWN_PLACE_HOLDER
        }
        readOnly={false}
        onLoad={this.setEditor}
        data-test="editor"
      />
    );
  }

  renderPreviewMode() {
    const { hasError } = this.state;

    return (
      <SafeMarkdown
        source={
          hasError
            ? MARKDOWN_ERROR_MESSAGE
            : this.state.markdownSource || MARKDOWN_PLACE_HOLDER
        }
        htmlSanitization={this.props.htmlSanitization}
        htmlSchemaOverrides={this.props.htmlSchemaOverrides}
      />
    );
  }

  render() {
    const { isFocused, editorMode } = this.state;

    const {
      component,
      parentComponent,
      index,
      depth,
      availableColumnCount,
      columnWidth,
      onResize,
      onResizeStop,
      handleComponentDrop,
      editMode,
    } = this.props;

    // inherit the size of parent columns
    const widthMultiple =
      parentComponent.type === COLUMN_TYPE
        ? parentComponent.meta.width || GRID_MIN_COLUMN_COUNT
        : component.meta.width || GRID_MIN_COLUMN_COUNT;

    const isEditing = editorMode === 'edit';

    return (
      <Draggable
        component={component}
        parentComponent={parentComponent}
        orientation={parentComponent.type === ROW_TYPE ? 'column' : 'row'}
        index={index}
        depth={depth}
        onDrop={handleComponentDrop}
        disableDragDrop={isFocused}
        editMode={editMode}
      >
        {({ dragSourceRef }) => (
          <WithPopoverMenu
            onChangeFocus={this.handleChangeFocus}
            shouldFocus={this.shouldFocusMarkdown}
            menuItems={[
              <MarkdownModeDropdown
                id={`${component.id}-mode`}
                value={this.state.editorMode}
                onChange={this.handleChangeEditorMode}
              />,
            ]}
            editMode={editMode}
          >
            <MarkdownStyles
              data-test="dashboard-markdown-editor"
              className={cx(
                'dashboard-markdown',
                isEditing && 'dashboard-markdown--editing',
              )}
              id={component.id}
            >
              <ResizableContainer
                id={component.id}
                adjustableWidth={parentComponent.type === ROW_TYPE}
                adjustableHeight
                widthStep={columnWidth}
                widthMultiple={widthMultiple}
                heightStep={GRID_BASE_UNIT}
                heightMultiple={component.meta.height}
                minWidthMultiple={GRID_MIN_COLUMN_COUNT}
                minHeightMultiple={GRID_MIN_ROW_UNITS}
                maxWidthMultiple={availableColumnCount + widthMultiple}
                gridSnapColumnBase={columnWidth}
                onResizeStart={this.handleResizeStart}
                onResize={onResize}
                onResizeStop={onResizeStop}
                editMode={isFocused ? false : editMode}
              >
                <div
                  ref={dragSourceRef}
                  className="dashboard-component dashboard-component-chart-holder"
                  data-test="dashboard-component-chart-holder"
                >
                  {editMode && (
                    <HoverMenu position="top">
                      <DeleteComponentButton
                        onDelete={this.handleDeleteComponent}
                      />
                    </HoverMenu>
                  )}
                  {editMode && isEditing
                    ? this.renderEditMode()
                    : this.renderPreviewMode()}
                </div>
              </ResizableContainer>
            </MarkdownStyles>
          </WithPopoverMenu>
        )}
      </Draggable>
    );
  }
}

Markdown.propTypes = propTypes;
Markdown.defaultProps = defaultProps;

function mapStateToProps(state) {
  return {
    undoLength: state.dashboardLayout.past.length,
    redoLength: state.dashboardLayout.future.length,
    htmlSanitization: state.common.conf.HTML_SANITIZATION,
    htmlSchemaOverrides: state.common.conf.HTML_SANITIZATION_SCHEMA_EXTENSIONS,
  };
}
export default connect(mapStateToProps)(Markdown);
