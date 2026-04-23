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
import type { ComponentProps, ReactNode } from 'react';

import type { ButtonProps as AntdButtonProps } from 'antd/es/button';
import type { DropdownProps } from 'antd/es/dropdown';
import type { TooltipPlacement } from '../Tooltip/types';

// AntD v6 removed `Dropdown.Button`, so our wrapper is hand-built from
// `Space.Compact` + `Button` + `Dropdown`. The public API preserves the
// subset of the old `Dropdown.Button` props we actually use.
export type DropdownButtonProps = Omit<AntdButtonProps, 'onClick'> & {
  onClick?: AntdButtonProps['onClick'];
  popupRender?: DropdownProps['popupRender'];
  /**
   * Legacy v5 prop kept for backward compatibility. If provided, it is passed
   * through `popupRender={() => overlay}` to the AntD v6 Dropdown.
   */
  overlay?: ReactNode;
  trigger?: DropdownProps['trigger'];
  placement?: DropdownProps['placement'];
  buttonsRender?: (buttons: ReactNode[]) => ReactNode[];
  tooltip?: string;
  tooltipPlacement?: TooltipPlacement;
};

// Re-export ComponentProps for consumers that historically extended it.
export type { ComponentProps };
