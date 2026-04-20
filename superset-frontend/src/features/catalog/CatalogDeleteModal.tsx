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
 * Модалка подтверждения удаления папки каталога на DS 2.0.
 * Замена window.confirm — точнее соответствует мокапу, a11y-compliant.
 */
import { styled, t } from '@superset-ui/core';
import { Modal } from '@superset-ui/core/components';
import { type FC, useState } from 'react';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

interface CatalogDeleteModalProps {
  open: boolean;
  folderName: string;
  /** Показывает предупреждение «содержимое не будет удалено». */
  preserveContents?: boolean;
  /** Есть ли вложенный контент для удаления (скрывает checkbox если нет). */
  hasContents?: boolean;
  onClose: () => void;
  /** Вызывается с флагом каскадного удаления. */
  onConfirm: (deleteContents: boolean) => Promise<void> | void;
}

const Body = styled.div`
  font-family: ${DS2_VARS.fontSans};
  padding: ${DS2_SPACE.s1}px 0;
`;

const P = styled.p`
  font-size: 13px;
  color: ${DS2_VARS.g700};
  line-height: 1.6;
  margin: 0 0 ${DS2_SPACE.s2}px;

  strong {
    color: ${DS2_VARS.ink};
    font-weight: 600;
  }
`;

const CheckLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  font-size: 12px;
  color: ${DS2_VARS.g700};
  cursor: pointer;
  margin: ${DS2_SPACE.s3}px 0 0;

  input[type='checkbox'] {
    accent-color: ${DS2_VARS.dn};
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s2}px;
  justify-content: flex-end;
  margin-top: ${DS2_SPACE.s4}px;
`;

const BaseBtn = styled.button`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 6px 14px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g700};

  &:hover {
    border-color: ${DS2_VARS.g400};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DangerBtn = styled(BaseBtn)`
  border-color: ${DS2_VARS.dn};
  color: ${DS2_VARS.dn};

  &:hover {
    background: ${DS2_VARS.dnBg};
    border-color: ${DS2_VARS.dn};
    color: ${DS2_VARS.dn};
  }
`;

export const CatalogDeleteModal: FC<React.PropsWithChildren<CatalogDeleteModalProps>> = ({
  open,
  folderName,
  preserveContents = true,
  hasContents = true,
  onClose,
  onConfirm,
}) => {
  const [cascade, setCascade] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(cascade);
      setCascade(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={t('Удаление папки')}
      hideFooter
      width="420px"
      data-test="catalog-delete-modal"
    >
      <Body>
        <P>
          {t('Вы удаляете папку')} <strong>«{folderName}»</strong>.
        </P>
        {preserveContents ? (
          <P>
            {t('Содержимое')} <strong>{t('не будет удалено')}</strong>
            {' — '}
            {t('объекты переместятся в «Без категории».')}
          </P>
        ) : null}
        {hasContents ? (
          <CheckLabel>
            <input
              type="checkbox"
              checked={cascade}
              onChange={e => setCascade(e.target.checked)}
              disabled={submitting}
            />
            {t('Также удалить всё содержимое')}
          </CheckLabel>
        ) : null}
        <ButtonRow>
          <BaseBtn type="button" onClick={onClose} disabled={submitting}>
            {t('Отмена')}
          </BaseBtn>
          <DangerBtn type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? t('…') : t('Удалить')}
          </DangerBtn>
        </ButtonRow>
      </Body>
    </Modal>
  );
};
