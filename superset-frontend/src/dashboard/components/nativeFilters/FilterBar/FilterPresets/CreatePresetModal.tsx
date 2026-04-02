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
import { useCallback, useState } from 'react';
import { css, DataMaskState, Filters, styled, t } from '@superset-ui/core';
import { Checkbox, Input, Modal, Switch, message } from 'antd';
import { createPreset, setDefaultPreset } from './api';

const FormGroup = styled.div`
  ${({ theme }) => css`
    margin-bottom: ${theme.sizeUnit * 4}px;
  `}
`;

const Label = styled.label`
  ${({ theme }) => css`
    display: block;
    font-size: ${theme.fontSizeSM}px;
    font-weight: ${theme.fontWeightStrong};
    color: ${theme.colorText};
    margin-bottom: ${theme.sizeUnit}px;
  `}
`;

const FilterCheckboxList = styled.div`
  ${({ theme }) => css`
    max-height: 240px;
    overflow-y: auto;
    border: 1px solid ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadiusSM}px;
    padding: ${theme.sizeUnit * 2}px;
  `}
`;

const FilterCheckboxItem = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit}px 0;
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
  `}
`;

const FilterValue = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.fontSizeXS}px;
    color: ${theme.colorTextSecondary};
    margin-left: auto;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

const ToggleRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.sizeUnit * 2}px 0;
  `}
`;

interface CreatePresetModalProps {
  dashboardId: number;
  dataMaskSelected: DataMaskState;
  filters: Filters;
  onClose: () => void;
}

function getFilterDisplayValue(
  filterId: string,
  dataMask: DataMaskState,
): string {
  const mask = dataMask[filterId];
  if (!mask?.filterState?.value) return '—';
  const val = mask.filterState.value;
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

const CreatePresetModal = ({
  dashboardId,
  dataMaskSelected,
  filters,
  onClose,
}: CreatePresetModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>(
    Object.keys(filters),
  );
  const [isDefault, setIsDefault] = useState(false);
  const [isShared, setIsShared] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleToggleFilter = useCallback(
    (filterId: string, checked: boolean) => {
      setSelectedFilterIds(prev =>
        checked ? [...prev, filterId] : prev.filter(id => id !== filterId),
      );
    },
    [],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedFilterIds(Object.keys(filters));
  }, [filters]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFilterIds([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      message.error(t('Укажите название пресета'));
      return;
    }
    if (selectedFilterIds.length === 0) {
      message.error(t('Выберите хотя бы один фильтр'));
      return;
    }

    setSaving(true);
    try {
      const filterData: DataMaskState = {};
      for (const filterId of selectedFilterIds) {
        if (dataMaskSelected[filterId]) {
          filterData[filterId] = dataMaskSelected[filterId];
        }
      }

      const result = await createPreset(dashboardId, {
        name: name.trim(),
        description: description.trim() || undefined,
        filter_data: filterData,
        included_filters: selectedFilterIds,
        is_shared: isShared,
      });

      if (result && isDefault) {
        await setDefaultPreset(dashboardId, result.id);
      }

      message.success(t('Пресет сохранён'));
      onClose();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : t('Ошибка сохранения пресета');
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  }, [
    name,
    description,
    selectedFilterIds,
    dataMaskSelected,
    dashboardId,
    isDefault,
    isShared,
    onClose,
  ]);

  const filterEntries = Object.entries(filters);

  return (
    <Modal
      open
      title={t('Создать пресет')}
      onCancel={onClose}
      onOk={handleSave}
      okText={t('Сохранить')}
      cancelText={t('Отмена')}
      confirmLoading={saving}
      okButtonProps={{
        disabled: !name.trim() || selectedFilterIds.length === 0,
      }}
      destroyOnClose
    >
      <FormGroup>
        <Label htmlFor="preset-name">{t('Название')}</Label>
        <Input
          id="preset-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('Например: Продовольствие, текущий месяц')}
          maxLength={256}
          autoFocus
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="preset-description">{t('Описание')}</Label>
        <Input.TextArea
          id="preset-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('Необязательное описание')}
          rows={2}
        />
      </FormGroup>

      <FormGroup>
        <div
          css={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          `}
        >
          <Label>{t('Фильтры для включения')}</Label>
          <div
            css={css`
              display: flex;
              gap: 12px;
            `}
          >
            <button
              type="button"
              onClick={handleSelectAll}
              css={css`
                border: none;
                background: none;
                cursor: pointer;
                font-size: 12px;
                color: var(--ant-color-primary);
                padding: 0;
              `}
            >
              {t('Все')}
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              css={css`
                border: none;
                background: none;
                cursor: pointer;
                font-size: 12px;
                color: var(--ant-color-primary);
                padding: 0;
              `}
            >
              {t('Ничего')}
            </button>
          </div>
        </div>
        <FilterCheckboxList>
          {filterEntries.map(([filterId, filter]) => (
            <FilterCheckboxItem key={filterId}>
              <Checkbox
                checked={selectedFilterIds.includes(filterId)}
                onChange={e => handleToggleFilter(filterId, e.target.checked)}
              >
                {filter.name}
              </Checkbox>
              <FilterValue>
                {getFilterDisplayValue(filterId, dataMaskSelected)}
              </FilterValue>
            </FilterCheckboxItem>
          ))}
        </FilterCheckboxList>
      </FormGroup>

      <ToggleRow>
        <span>{t('Назначить по умолчанию')}</span>
        <Switch checked={isDefault} onChange={setIsDefault} size="small" />
      </ToggleRow>

      <ToggleRow>
        <span>{t('Доступен всем')}</span>
        <Switch checked={isShared} onChange={setIsShared} size="small" />
      </ToggleRow>
    </Modal>
  );
};

export default CreatePresetModal;
