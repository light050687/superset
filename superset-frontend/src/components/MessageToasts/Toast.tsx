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
import { styled, css, SupersetTheme, useTheme } from '@superset-ui/core';
import cx from 'classnames';
import { Interweave } from 'interweave';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icons } from '@superset-ui/core/components/Icons';
import { ToastType, ToastMeta } from './types';

/* Vertical card-style toast: квадрат/вертикальный прямоугольник,
   иконка сверху по центру, текст под ней, close-кнопка в углу.
   Юзер просил квадрат с большей высотой — заменили старый
   горизонтальный alert. */
const ToastContainer = styled.div`
  ${({ theme }) => css`
    width: 220px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    padding: ${theme.sizeUnit * 6}px ${theme.sizeUnit * 4}px;
    gap: ${theme.sizeUnit * 3}px;

    .toast__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${theme.sizeUnit * 3}px;
    }

    /* Контейнер 64×64 для крупной иконки — как в SaveOverlay. */
    .toast__icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${theme.colorFillTertiary};
    }

    .anticon {
      padding: 0;
    }

    .toast__icon-wrap .anticon svg {
      width: 32px;
      height: 32px;
    }

    .toast__text {
      font-family: ${theme.fontFamily};
      font-size: ${theme.fontSize}px;
      font-weight: ${theme.fontWeightStrong};
      line-height: 1.3;
      max-width: 100%;
      word-wrap: break-word;
    }

    /* Close-кнопка в правом верхнем углу карточки. */
    .toast__close {
      position: absolute;
      top: ${theme.sizeUnit * 2}px;
      right: ${theme.sizeUnit * 2}px;
      padding: ${theme.sizeUnit}px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.12s ease;

      &:hover {
        background: ${theme.colorFillTertiary};
      }

      .anticon svg {
        width: 14px;
        height: 14px;
      }
    }
  `}
`;

const notificationStyledIcon = (theme: SupersetTheme) => css`
  color: ${theme.colorTextLightSolid};
  margin-right: 0;
  font-size: 32px;
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

  const theme = useTheme();
  let className = 'toast--success';
  let icon = (
    <Icons.CheckCircleFilled
      css={theme => notificationStyledIcon(theme)}
      iconColor={theme.colorSuccess}
    />
  );

  if (toast.toastType === ToastType.Warning) {
    icon = (
      <Icons.ExclamationCircleFilled
        css={notificationStyledIcon}
        iconColor={theme.colorWarning}
      />
    );
    className = 'toast--warning';
  } else if (toast.toastType === ToastType.Danger) {
    icon = (
      <Icons.ExclamationCircleFilled
        css={notificationStyledIcon}
        iconColor={theme.colorError}
      />
    );
    className = 'toast--danger';
  } else if (toast.toastType === ToastType.Info) {
    icon = (
      <Icons.InfoCircleFilled
        css={notificationStyledIcon}
        iconColor={theme.colorInfo}
      />
    );
    className = 'toast--info';
  }

  return (
    <ToastContainer
      className={cx('alert', 'toast', visible && 'toast--visible', className)}
      data-test="toast-container"
      role="alert"
    >
      <div className="toast__content">
        <div className="toast__icon-wrap">{icon}</div>
        <div className="toast__text">
          <Interweave content={toast.text} noHtml={!toast.allowHtml} />
        </div>
      </div>
      <Icons.CloseOutlined
        iconSize="m"
        className="toast__close pointer"
        role="button"
        tabIndex={0}
        onClick={handleClosePress}
        aria-label="Close"
        data-test="close-button"
      />
    </ToastContainer>
  );
}
