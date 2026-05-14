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
import { styled, css } from '@superset-ui/core';
import cx from 'classnames';
import { Interweave } from 'interweave';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icons } from '@superset-ui/core/components/Icons';
import { DS2_VARS } from 'src/theme/ds2';
import { ToastType, ToastMeta } from './types';

/* Toast в DS2-стиле: вертикальная карточка 220×200 (как просил юзер),
   иконка 64×64 сверху по центру, текст ниже, close ×  в правом углу.
   Цвета по дизайн-документу v2.1:
   • --s   поверхность светлая/тёмная (фон карточки)
   • --ink основной текст
   • --up / --dn / --wn / --c-sky — accent статусов
   Glass-фон (drawerBg + filter) сохранён для воздушности.
   Centering — в ToastPresenter (flex inset:0). */

/* Accent color по типу — соответствует semantic-токенам DS2 v2.1. */
function accentColor(type: ToastType): string {
  switch (type) {
    case ToastType.Warning:
      return DS2_VARS.wn;
    case ToastType.Danger:
      return DS2_VARS.dn;
    case ToastType.Info:
      return DS2_VARS.cSky;
    case ToastType.Success:
    default:
      return DS2_VARS.up;
  }
}

const ToastCard = styled.div<{ $accent: string }>`
  ${({ $accent }) => css`
    width: 220px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    padding: 24px 16px;
    gap: 12px;
    color: ${DS2_VARS.ink};

    .toast__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    /* Контейнер 64×64 для крупной иконки. Tinted-фон цвета accent
       (12% opacity) — как у DS2 chip-icon'ов в Library/DevTools tiles. */
    .toast__icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in oklab, ${$accent} 14%, transparent);
      color: ${$accent};
    }

    .toast__icon-wrap .anticon svg {
      width: 32px;
      height: 32px;
    }

    .toast__text {
      font-family: ${DS2_VARS.fontSans};
      font-size: var(--fs-body, 14px);
      font-weight: 600;
      line-height: 1.3;
      max-width: 100%;
      word-wrap: break-word;
      color: ${DS2_VARS.ink};
    }

    /* Close × в правом верхнем углу карточки. */
    .toast__close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: ${DS2_VARS.g500};
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        background 0.12s ${DS2_VARS.ease},
        color 0.12s ${DS2_VARS.ease};

      &:hover {
        background: ${DS2_VARS.g100};
        color: ${DS2_VARS.ink};
      }

      &:focus-visible {
        outline: 2px solid ${DS2_VARS.cSky};
        outline-offset: 2px;
      }

      .anticon svg {
        width: 12px;
        height: 12px;
      }
    }
  `}
`;

interface ToastPresenterProps {
  toast: ToastMeta;
  onCloseToast: (id: string) => void;
}

export default function Toast({ toast, onCloseToast }: ToastPresenterProps) {
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const [visible, setVisible] = useState(false);

  const showToast = () => {
    setVisible(true);
  };

  const handleClosePress = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    // Wait for the transition
    setVisible(() => {
      setTimeout(() => {
        onCloseToast(toast.id);
      }, 150);
      return false;
    });
  }, [onCloseToast, toast.id]);

  useEffect(() => {
    setTimeout(showToast);
    if (toast.duration > 0) {
      hideTimer.current = setTimeout(handleClosePress, toast.duration);
    }
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [handleClosePress, toast.duration]);

  const accent = accentColor(toast.toastType);
  let icon = <Icons.CheckCircleFilled />;
  let className = 'toast--success';
  if (toast.toastType === ToastType.Warning) {
    icon = <Icons.ExclamationCircleFilled />;
    className = 'toast--warning';
  } else if (toast.toastType === ToastType.Danger) {
    icon = <Icons.ExclamationCircleFilled />;
    className = 'toast--danger';
  } else if (toast.toastType === ToastType.Info) {
    icon = <Icons.InfoCircleFilled />;
    className = 'toast--info';
  }

  return (
    <ToastCard
      $accent={accent}
      className={cx('toast', visible && 'toast--visible', className)}
      data-test="toast-container"
      role="alert"
    >
      <div className="toast__content">
        <div className="toast__icon-wrap">{icon}</div>
        <div className="toast__text">
          <Interweave content={toast.text} noHtml={!toast.allowHtml} />
        </div>
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={handleClosePress}
        aria-label="Close"
        data-test="close-button"
      >
        <Icons.CloseOutlined />
      </button>
    </ToastCard>
  );
}
