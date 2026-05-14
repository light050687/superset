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
import { styled } from '@superset-ui/core';
import { DS2_VARS } from 'src/theme/ds2';
import { ToastMeta } from 'src/components/MessageToasts/types';
import Toast from './Toast';

export interface VisualProps {
  position: 'bottom' | 'top';
}

/* Toast notifications — DS2 glass-pill по центру экрана (по запросу
   юзера: «сделай по центру как раньше было»). Раньше было «220×200
   квадратом по центру» — слишком intrusive, блокировало контент.
   Сейчас compact pill сохранил центрирование, но не блокирует дашборд
   из-за маленького размера. Stack вертикальный, fade+scale-in. */
const StyledToastPresenter = styled.div<VisualProps>(
  ({ theme }) =>
    `
    position: fixed;
    inset: 0;
    z-index: ${theme.zIndexPopupBase + 1};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: none;
    word-break: break-word;

    .toast {
      background: ${DS2_VARS.drawerBg};
      backdrop-filter: ${DS2_VARS.drawerFilter};
      -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
      border: 1px solid ${DS2_VARS.drawerBorder};
      border-radius: 12px;
      box-shadow: ${DS2_VARS.drawerShadow};
      opacity: 0;
      transform: scale(0.94);
      pointer-events: auto;
      will-change: transform, opacity;
      transition:
        transform 0.22s ${DS2_VARS.ease},
        opacity 0.18s ${DS2_VARS.ease};
    }

    .toast--visible {
      opacity: 1;
      transform: scale(1);
    }

    @media print {
      display: none;
    }
  `,
);

type ToastPresenterProps = Partial<VisualProps> & {
  toasts: Array<ToastMeta>;
  removeToast: () => any;
};

export default function ToastPresenter({
  toasts,
  removeToast,
  position = 'bottom',
}: ToastPresenterProps) {
  return (
    <>
      {toasts.length > 0 && (
        <StyledToastPresenter id="toast-presenter" position={position}>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onCloseToast={removeToast} />
          ))}
        </StyledToastPresenter>
      )}
    </>
  );
}
