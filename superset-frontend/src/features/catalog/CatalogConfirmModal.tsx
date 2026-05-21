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
 * Универсальная confirm-модалка каталога. Pixel-perfect мокап
 * #catConfirmModal: warning icon + title + text (HTML) + опциональный
 * meta-блок (список фактов) + опциональный checkbox + Отмена/Confirm.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useEffect, useState } from 'react';
import { DS2_VARS } from 'src/theme/ds2';
import {
  CatalogModalBox,
  ModalBtn,
  ModalBtnDanger,
  ModalBtnPrimary,
  ModalBtnRow,
  ModalCheck,
  ModalMeta,
  ModalSub,
} from './CatalogModalBox';

export interface CatalogConfirmModalProps {
  open: boolean;
  title: string;
  /** Поддерживает HTML-разметку (strong для акцентов). */
  text: string;
  /** Опциональный meta-блок: список строк вида «Папок: 3». */
  meta?: string[];
  /** Чекбокс (опционально) — например, «Также удалить содержимое». */
  checkLabel?: string;
  /** Начальное состояние чекбокса. */
  checkDefault?: boolean;
  /** Текст submit-кнопки. По умолчанию «Удалить». */
  submitLabel?: string;
  /** Вариант submit — danger (красный) или primary (чёрный). */
  variant?: 'danger' | 'primary';
  /** Только OK (без Cancel, для информационных модалок). */
  okOnly?: boolean;
  onClose: () => void;
  onConfirm: (checked: boolean) => Promise<void> | void;
}

/* Для confirm в primary-варианте иконка не красная, а sky — чтобы
   отличаться от destructive. Создаём локальный вариант ModalIcon,
   вместо того чтобы переопределять базовый. */
const IconBox = styled.div<{ $variant: 'danger' | 'primary' }>`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 10px;
  color: ${({ $variant }) =>
    $variant === 'danger' ? DS2_VARS.dn : DS2_VARS.cSky};
  background: ${({ $variant }) =>
    $variant === 'danger'
      ? `color-mix(in oklab, ${DS2_VARS.dn} 14%, transparent)`
      : `color-mix(in oklab, ${DS2_VARS.cSky} 14%, transparent)`};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const WarnIcon = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="10" cy="10" r="8.2" />
    <path d="M10 6v5M10 13.5v.5" />
  </svg>
);

export const CatalogConfirmModal: FC<
  React.PropsWithChildren<CatalogConfirmModalProps>
> = ({
  open,
  title,
  text,
  meta,
  checkLabel,
  checkDefault = false,
  submitLabel,
  variant = 'danger',
  okOnly = false,
  onClose,
  onConfirm,
}) => {
  const [checked, setChecked] = useState(checkDefault);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setChecked(checkDefault);
    }
  }, [open, checkDefault]);

  const handleConfirm = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await onConfirm(checked);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const SubmitBtn = variant === 'danger' ? ModalBtnDanger : ModalBtnPrimary;
  const defaultSubmitLabel = variant === 'danger' ? t('Удалить') : t('OK');

  return (
    <CatalogModalBox
      open={open}
      onClose={onClose}
      width={380}
      title={title}
      dataTest="catalog-confirm-modal"
    >
      <IconBox $variant={variant}>
        <WarnIcon />
      </IconBox>
      <ModalSub dangerouslySetInnerHTML={{ __html: text }} />
      {meta && meta.length > 0 ? (
        <ModalMeta>
          {meta.map((line, i) => (
            // Порядок строк статичен — index как key допустим.
            // eslint-disable-next-line react/no-array-index-key
            <div key={i}>{line}</div>
          ))}
        </ModalMeta>
      ) : null}
      {checkLabel ? (
        <ModalCheck>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            disabled={submitting}
          />
          <span>{checkLabel}</span>
        </ModalCheck>
      ) : null}
      <ModalBtnRow>
        {okOnly ? null : (
          <ModalBtn type="button" onClick={onClose} disabled={submitting}>
            {t('Отмена')}
          </ModalBtn>
        )}
        <SubmitBtn type="button" onClick={handleConfirm} disabled={submitting}>
          {submitting ? t('…') : (submitLabel ?? defaultSubmitLabel)}
        </SubmitBtn>
      </ModalBtnRow>
    </CatalogModalBox>
  );
};
