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
import { forwardRef, type CSSProperties } from 'react';
import { Tooltip as AntdTooltip } from 'antd';
import type { TooltipRef } from 'antd/es/tooltip';

import type { TooltipProps, TooltipPlacement } from './types';

// AntD v6 moved semantic styles from `overlayStyle` / `overlayInnerStyle`
// to `styles.{root,container,arrow}`. `styles` can also be a callback in v6,
// but our wrapper always passes an object — so we narrow to the object shape.
type TooltipStylesObject = {
  root?: CSSProperties;
  container?: CSSProperties;
  arrow?: CSSProperties;
};

// forwardRef is required here: @rc-component/trigger passes a ref through to
// the wrapped trigger component, which a plain FC cannot receive. Without it,
// AntD v6 logs: "Function components cannot be given refs".
export const Tooltip = forwardRef<TooltipRef, TooltipProps>(
  (
    {
      // AntD v6 deprecations — translate to the new API so call sites don't
      // need to be rewritten one-by-one.
      overlayStyle,
      overlayInnerStyle,
      destroyTooltipOnHide,
      destroyOnHidden,
      styles: stylesProp,
      ...props
    },
    ref,
  ) => {
    const incomingStyles =
      typeof stylesProp === 'object' && stylesProp !== null
        ? (stylesProp as TooltipStylesObject)
        : ({} as TooltipStylesObject);
    return (
      <AntdTooltip
        ref={ref}
        destroyOnHidden={destroyOnHidden ?? Boolean(destroyTooltipOnHide)}
        styles={{
          // AntD v6 renamed styles.body → styles.container.
          container: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...(overlayInnerStyle ?? {}),
            ...(incomingStyles.container ?? {}),
          },
          root: { ...(overlayStyle ?? {}), ...(incomingStyles.root ?? {}) },
          arrow: incomingStyles.arrow ?? {},
        }}
        {...props}
      />
    );
  },
);
Tooltip.displayName = 'Tooltip';
export type { TooltipProps, TooltipPlacement };
