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
import { Button as AntdButton, Dropdown, Space } from 'antd';
import { kebabCase } from 'lodash';
import type { ReactElement } from 'react';
import { css, useTheme } from '@superset-ui/core';
import { Icons } from '../Icons';
import { Tooltip } from '../Tooltip';
import type { DropdownButtonProps } from './types';

// AntD v6 removed `Dropdown.Button`. The documented replacement is
// `Space.Compact` + `Button` + `Dropdown`, which we assemble here so call
// sites keep the old API surface.
export const DropdownButton = ({
  popupRender,
  overlay,
  tooltip,
  tooltipPlacement,
  children,
  onClick,
  icon,
  disabled,
  trigger,
  placement,
  buttonsRender,
  type: buttonType,
  danger,
  ...rest
}: DropdownButtonProps) => {
  const theme = useTheme();
  const buttonCss = css`
    height: 30px;
    box-shadow: none;
    font-size: ${theme.fontSizeSM}px;
    font-weight: ${theme.fontWeightStrong};
  `;

  // Preserve the v5 `overlay` prop by wiring it to v6 `popupRender`.
  const effectivePopupRender =
    popupRender ??
    (overlay ? () => overlay as ReactElement : undefined);

  const triggerButton = (
    <AntdButton
      {...rest}
      type={buttonType}
      danger={danger}
      onClick={onClick}
      disabled={disabled}
      css={buttonCss}
    >
      {children}
    </AntdButton>
  );

  const caretIcon = icon ?? (
    <Icons.DownOutlined
      iconColor={disabled ? theme.colorTextDisabled : theme.colorIcon}
    />
  );

  const compact = (
    <Space.Compact>
      {triggerButton}
      <Dropdown
        popupRender={effectivePopupRender}
        trigger={trigger ?? ['hover']}
        placement={placement}
        disabled={disabled}
      >
        <AntdButton
          type={buttonType}
          danger={danger}
          disabled={disabled}
          icon={caretIcon}
          css={buttonCss}
          aria-label="dropdown-trigger"
        />
      </Dropdown>
    </Space.Compact>
  );

  if (tooltip) {
    return (
      <Tooltip
        placement={tooltipPlacement}
        id={`${kebabCase(tooltip)}-tooltip`}
        title={tooltip}
      >
        {compact}
      </Tooltip>
    );
  }
  return compact;
};

export type { DropdownButtonProps };
