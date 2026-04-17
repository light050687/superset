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
 */
import { styled, t } from '@superset-ui/core';
import { Input, Modal } from '@superset-ui/core/components';
import { type FC, useMemo, useState } from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import {
  createCatalogFolder,
  deleteCatalogFolder,
  updateCatalogFolder,
} from './api';
import type { CatalogFolderNode } from './types';

interface CatalogAdminModalProps {
  open: boolean;
  folders: CatalogFolderNode[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

const List = styled.div`
  max-height: 420px;
  overflow-y: auto;
  padding: ${DS2_SPACE.s1}px 0;
  border-top: 1px solid ${DS2_VARS.g100};
  border-bottom: 1px solid ${DS2_VARS.g100};

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const Row = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;
  padding-left: ${({ $depth }) => DS2_SPACE.s3 + $depth * DS2_SPACE.s4}px;
  border-bottom: 1px solid ${DS2_VARS.g100};
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  color: ${DS2_VARS.ink};

  &:last-child {
    border-bottom: none;
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Count = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
`;

const Actions = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s1}px;
  margin-left: auto;
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.g700)};
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    border-color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.cSky)};
    color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.cSky)};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s3}px 0 ${DS2_SPACE.s2}px;
  align-items: flex-start;
`;

const FormLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s1}px;
  flex: 1;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g500};
`;

const ColorInput = styled.input`
  width: 40px;
  height: 32px;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  background: transparent;
`;

function flatten(
  folders: CatalogFolderNode[],
): Array<{ node: CatalogFolderNode; depth: number }> {
  // Строим глубину по parent_id.
  const byId = new Map<number, CatalogFolderNode>();
  folders.forEach(f => byId.set(f.id, f));
  const depth = (id: number, seen = new Set<number>()): number => {
    const node = byId.get(id);
    if (!node || node.parent_id === null) return 0;
    if (seen.has(id)) return 0;
    seen.add(id);
    return 1 + depth(node.parent_id, seen);
  };
  return folders
    .map(node => ({ node, depth: depth(node.id) }))
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.node.name.localeCompare(b.node.name);
    });
}

export const CatalogAdminModal: FC<CatalogAdminModalProps> = ({
  open,
  folders,
  onClose,
  onChanged,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B8BD9');
  const [newParent, setNewParent] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => flatten(folders), [folders]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      setError(t('Введите название папки'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCatalogFolder({
        name,
        color: newColor,
        parent_id: newParent,
      });
      setNewName('');
      setNewParent(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async (folder: CatalogFolderNode) => {
    const name = window.prompt(t('Новое название'), folder.name);
    if (!name || name === folder.name) return;
    try {
      await updateCatalogFolder(folder.id, { name: name.trim() });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка'));
    }
  };

  const handleDelete = async (folder: CatalogFolderNode) => {
    const confirmed = window.confirm(
      t(
        'Удалить папку «%s»? Подпапки станут корневыми, привязки к объектам удалятся.',
        folder.name,
      ),
    );
    if (!confirmed) return;
    try {
      await deleteCatalogFolder(folder.id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Ошибка'));
    }
  };

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={t('Управление каталогом')}
      hideFooter
      width="560px"
      data-test="catalog-admin-modal"
    >
      <List>
        {rows.length === 0 ? (
          <Row $depth={0}>
            <span style={{ color: 'var(--g500)' }}>
              {t('Папок ещё нет. Добавьте первую ниже.')}
            </span>
          </Row>
        ) : (
          rows.map(({ node, depth }) => (
            <Row key={node.id} $depth={depth}>
              <Dot $color={node.color ?? '#999999'} />
              <span style={{ flex: 1 }}>{node.name}</span>
              <Count>{node.item_count}</Count>
              <Actions>
                <ActionBtn type="button" onClick={() => handleRename(node)}>
                  {t('Править')}
                </ActionBtn>
                <ActionBtn
                  type="button"
                  $danger
                  onClick={() => handleDelete(node)}
                >
                  {t('Удалить')}
                </ActionBtn>
              </Actions>
            </Row>
          ))
        )}
      </List>

      <AddRow>
        <FormLabel>
          {t('Название')}
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('Например, «Коммерция»')}
            maxLength={255}
          />
        </FormLabel>
        <FormLabel style={{ flex: '0 0 110px' }}>
          {t('Родитель')}
          <select
            value={newParent ?? ''}
            onChange={e =>
              setNewParent(e.target.value ? Number(e.target.value) : null)
            }
            style={{
              height: 32,
              border: `1px solid ${DS2_VARS.g200}`,
              borderRadius: 4,
              fontFamily: DS2_VARS.fontSans,
              fontSize: 12,
            }}
          >
            <option value="">— {t('корень')} —</option>
            {rows.map(({ node, depth }) => (
              <option key={node.id} value={node.id}>
                {'— '.repeat(depth)}
                {node.name}
              </option>
            ))}
          </select>
        </FormLabel>
        <FormLabel style={{ flex: '0 0 50px' }}>
          {t('Цвет')}
          <ColorInput
            type="color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
          />
        </FormLabel>
        <ActionBtn
          type="button"
          onClick={handleAdd}
          disabled={submitting}
          style={{ alignSelf: 'flex-end', padding: '8px 14px' }}
        >
          {submitting ? t('…') : t('+ Добавить')}
        </ActionBtn>
      </AddRow>

      {error ? (
        <div
          style={{
            color: 'var(--dn)',
            fontSize: 11,
            padding: `${DS2_SPACE.s2}px 0`,
          }}
        >
          {error}
        </div>
      ) : null}
    </Modal>
  );
};
