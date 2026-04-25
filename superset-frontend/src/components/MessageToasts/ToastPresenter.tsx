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
import { ToastMeta } from 'src/components/MessageToasts/types';
import Toast from './Toast';

export interface VisualProps {
  position: 'bottom' | 'top';
}

/* Toast notifications — карточки строго по центру экрана. Юзер просил
   квадратный/вертикальный формат и центрирование (старый правый-нижний
   угол прятал тосты за shell-dock). Каждый toast — самостоятельная
   220×200 карточка, появляется fade-in + scale, центрируется flex'ом. */
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
    gap: ${theme.sizeUnit * 3}px;
    pointer-events: none;
    word-break: break-word;

    .toast {
      background: ${theme.colorBgSpotlight};
      border-radius: 16px;
      box-shadow:
        0 24px 64px rgba(0, 0, 0, 0.18),
        0 4px 12px rgba(0, 0, 0, 0.06);
      color: ${theme.colorTextLightSolid};
      opacity: 0;
      transform: scale(0.92);
      pointer-events: auto;
      will-change: transform, opacity;
      transition:
        transform ${theme.motionDurationMid} ease,
        opacity ${theme.motionDurationMid} ease;
    }

    .toast--visible {
      opacity: 1;
      transform: scale(1);
    }

    .toast--success { border: 1px solid ${theme.colorSuccess}; }
    .toast--warning { border: 1px solid ${theme.colorWarning}; }
    .toast--danger  { border: 1px solid ${theme.colorError}; }
    .toast--info    { border: 1px solid ${theme.colorInfo}; }
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
