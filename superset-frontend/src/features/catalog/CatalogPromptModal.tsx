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
 * Модалка-prompt каталога — создать/переименовать папку.
 * Pixel-perfect мокап .cat-modal из analytics-floating-dock.html:
 *   Title (h3) → Sub (optional, с <strong>) → Input → Btn-row.
 */
import { t } from '@superset-ui/core';
import { type FC, useEffect, useRef, useState } from 'react';
import {
  CatalogModalBox,
  ModalBtn,
  ModalBtnPrimary,
  ModalBtnRow,
  ModalInput,
  ModalSub,
} from './CatalogModalBox';

interface CatalogPromptModalProps {
  open: boolean;
  title: string;
  /** Подсказка под заголовком. Поддерживает <strong> для акцентов
   *  («Текущее: <strong>Маркетинг</strong>» и т.п.). */
  subtitle?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void> | void;
}

export const CatalogPromptModal: FC<
  React.PropsWithChildren<CatalogPromptModalProps>
> = ({
  open,
  title,
  subtitle,
  placeholder,
  defaultValue = '',
  submitLabel,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* При открытии модалки: сбрасываем значение, фокусируем input,
     выделяем текст (удобно для переименования — сразу можно печатать). */
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 60);
    }
  }, [open, defaultValue]);

  const handleSubmit = async (): Promise<void> => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CatalogModalBox
      open={open}
      onClose={onClose}
      width={380}
      title={title}
      dataTest="catalog-prompt-modal"
    >
      {subtitle ? (
        <ModalSub dangerouslySetInnerHTML={{ __html: subtitle }} />
      ) : null}
      <ModalInput
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !submitting && value.trim()) {
            e.preventDefault();
            void handleSubmit();
          }
        }}
        disabled={submitting}
      />
      <ModalBtnRow>
        <ModalBtn type="button" onClick={onClose} disabled={submitting}>
          {t('Отмена')}
        </ModalBtn>
        <ModalBtnPrimary
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !value.trim()}
        >
          {submitting ? t('…') : (submitLabel ?? t('Сохранить'))}
        </ModalBtnPrimary>
      </ModalBtnRow>
    </CatalogModalBox>
  );
};
