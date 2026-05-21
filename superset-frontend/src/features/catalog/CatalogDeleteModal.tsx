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
 * Модалка подтверждения удаления папки каталога.
 *
 * Требование заказчика: объекты (дашборды/чарты/датасеты) НИКОГДА не
 * удаляются вместе с папкой — они переезжают в родительскую папку.
 *
 * Два режима удаления:
 *  1. Сохранить структуру (по умолчанию): подпапки перевешиваются на
 *     родителя удаляемой папки, items тоже туда переезжают.
 *  2. Оставить только объекты (checkbox): все вложенные подпапки
 *     каскадно удаляются; items из них + из самой папки едут плоским
 *     списком в родителя удаляемой папки.
 *
 * Чекбокс показывается только когда у папки есть подпапки —
 * в противном случае оба режима дают одинаковый результат.
 *
 * Мокап: analytics-floating-dock.html → deleteDept/deleteSub/deleteFolderCat.
 */
import { t } from '@superset-ui/core';
import { type FC, useEffect, useState } from 'react';
import {
  CatalogModalBox,
  ModalBtn,
  ModalBtnDanger,
  ModalBtnRow,
  ModalCheck,
  ModalIcon,
  ModalMeta,
  ModalSub,
} from './CatalogModalBox';

interface CatalogDeleteModalProps {
  open: boolean;
  /** Имя удаляемой папки. */
  folderName: string;
  /** Количество объектов (items) непосредственно в этой папке. */
  itemCount?: number;
  /** Количество прямых подпапок. Если > 0 — показывается чекбокс
   *  каскадного удаления структуры. */
  subfolderCount?: number;
  /** Общее количество вложенных подпапок (включая глубокие уровни) —
   *  используется для текста «Удалено подпапок: N» в режиме cascade. */
  descendantFolderCount?: number;
  /** Общее количество items во всех вложенных подпапках (рекурсивно) —
   *  показывается в meta для полноты картины. */
  descendantItemCount?: number;
  /** Имя папки-назначения, куда переедут объекты. Если undefined —
   *  удаляемая папка корневая и объекты переедут в «Без департамента». */
  parentFolderName?: string;
  onClose: () => void;
  /** cascade=true → удалить все подпапки, сохранив только объекты.
   *  cascade=false → сохранить структуру (подпапки перевешиваются). */
  onConfirm: (cascade: boolean) => Promise<void> | void;
}

const DangerIconSvg = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="10" cy="10" r="8.2" />
    <path d="M10 6v5M10 13.5v.5" />
  </svg>
);

const DEFAULT_PARENT_LABEL = 'Без департамента';

export const CatalogDeleteModal: FC<
  React.PropsWithChildren<CatalogDeleteModalProps>
> = ({
  open,
  folderName,
  itemCount = 0,
  subfolderCount = 0,
  descendantFolderCount,
  descendantItemCount,
  parentFolderName,
  onClose,
  onConfirm,
}) => {
  const [cascade, setCascade] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Чекбокс сбрасывается на каждом открытии модалки — иначе юзер
     откроет второй раз и увидит свой старый выбор. */
  useEffect(() => {
    if (open) setCascade(false);
  }, [open]);

  const handleConfirm = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await onConfirm(cascade);
    } finally {
      setSubmitting(false);
    }
  };

  const targetName = parentFolderName ?? DEFAULT_PARENT_LABEL;
  const hasSubfolders = subfolderCount > 0;
  const totalDescendantFolders = descendantFolderCount ?? subfolderCount;
  const totalDescendantItems = descendantItemCount ?? 0;

  /* Текст-подтверждение собирается из 3 частей:
     1. Что произойдёт со структурой (сохранится / удалится)
     2. Куда переедут объекты (<targetName>)
     3. Инвариант: сами объекты не будут удалены. */
  const renderText = (): JSX.Element => {
    if (!hasSubfolders) {
      if (itemCount === 0) {
        return (
          <>
            {t('Папка')} <strong>«{folderName}»</strong> {t('будет удалена.')}
          </>
        );
      }
      return (
        <>
          {t('Папка')} <strong>«{folderName}»</strong> {t('будет удалена.')}{' '}
          {t('Объекты переедут в папку')} <strong>«{targetName}»</strong>.
        </>
      );
    }
    if (cascade) {
      return (
        <>
          {t('Структура подпапок будет удалена. Объекты переедут в папку')}{' '}
          <strong>«{targetName}»</strong> {t('плоским списком.')}
        </>
      );
    }
    return (
      <>
        {t('Всё содержимое сохранится в папке')} <strong>«{targetName}»</strong>{' '}
        {t('— подпапки и объекты переедут вместе.')}
      </>
    );
  };

  /* Meta-строки: факты о содержимом, показываем только непустые. */
  const metaLines: string[] = [];
  if (hasSubfolders) {
    metaLines.push(`${t('Подпапок (прямых):')} ${subfolderCount}`);
  }
  if (totalDescendantFolders > subfolderCount && totalDescendantFolders > 0) {
    metaLines.push(`${t('Всего вложенных папок:')} ${totalDescendantFolders}`);
  }
  if (itemCount > 0) {
    metaLines.push(`${t('Объектов в папке:')} ${itemCount}`);
  }
  if (totalDescendantItems > 0) {
    metaLines.push(`${t('Объектов в подпапках:')} ${totalDescendantItems}`);
  }

  return (
    <CatalogModalBox
      open={open}
      onClose={onClose}
      width={380}
      title={t('Удалить папку?')}
      dataTest="catalog-delete-modal"
    >
      <ModalIcon>
        <DangerIconSvg />
      </ModalIcon>
      <ModalSub>{renderText()}</ModalSub>
      {metaLines.length > 0 ? (
        <ModalMeta>
          {metaLines.map(line => (
            <div key={line}>{line}</div>
          ))}
        </ModalMeta>
      ) : null}
      {hasSubfolders ? (
        <ModalCheck>
          <input
            type="checkbox"
            checked={cascade}
            onChange={e => setCascade(e.target.checked)}
            disabled={submitting}
            aria-describedby="catalog-delete-cascade-hint"
          />
          <span id="catalog-delete-cascade-hint">
            {t('Оставить внутри только объекты (удалить структуру подпапок)')}
          </span>
        </ModalCheck>
      ) : null}
      <ModalBtnRow>
        <ModalBtn type="button" onClick={onClose} disabled={submitting}>
          {t('Отмена')}
        </ModalBtn>
        <ModalBtnDanger
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? t('…') : t('Удалить')}
        </ModalBtnDanger>
      </ModalBtnRow>
    </CatalogModalBox>
  );
};
