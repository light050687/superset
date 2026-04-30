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
import { css, styled, t } from '@superset-ui/core';
import { Input, Modal, Alert, message } from 'antd';
import { importPreset } from './api';
import { FilterPresetExport } from './types';

const PreviewBox = styled.div`
  ${({ theme }) => css`
    margin-top: ${theme.sizeUnit * 3}px;
    padding: ${theme.sizeUnit * 3}px;
    border: 1px solid ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadiusSM}px;
    background: ${theme.colorBgLayout};
    font-size: ${theme.fontSizeSM}px;
  `}
`;

const PreviewRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    justify-content: space-between;
    padding: ${theme.sizeUnit}px 0;
    color: ${theme.colorText};
  `}
`;

const PreviewLabel = styled.span`
  ${({ theme }) => css`
    color: ${theme.colorTextSecondary};
    font-weight: ${theme.fontWeightStrong};
  `}
`;

interface ImportPresetModalProps {
  dashboardId: number;
  onClose: () => void;
}

const ImportPresetModal = ({
  dashboardId,
  onClose,
}: ImportPresetModalProps) => {
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<FilterPresetExport | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleJsonChange = useCallback((value: string) => {
    setJsonText(value);
    setParseError(null);
    setParsed(null);

    if (!value.trim()) return;

    try {
      const data = JSON.parse(value) as FilterPresetExport & {
        filter_data?: FilterPresetExport['filterData'];
        included_filters?: string[];
      };
      // Accept both camelCase and snake_case from export
      const filterData = data.filterData ?? data.filter_data;
      const includedFilters =
        data.includedFilters ?? data.included_filters;
      if (!data.version || !data.name || !filterData) {
        setParseError(t('Неверный формат JSON пресета'));
        return;
      }
      // Normalize to camelCase
      setParsed({
        ...data,
        filterData,
        includedFilters: includedFilters ?? [],
      });
    } catch {
      setParseError(t('Невалидный JSON'));
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      handleJsonChange(text);
    } catch {
      message.error(t('Не удалось прочитать буфер обмена'));
    }
  }, [handleJsonChange]);

  const handleImport = useCallback(async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      await importPreset(dashboardId, parsed);
      message.success(t('Пресет импортирован'));
      onClose();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : t('Ошибка импорта пресета');
      message.error(errMsg);
    } finally {
      setImporting(false);
    }
  }, [parsed, dashboardId, onClose]);

  const filterCount = parsed?.includedFilters?.length ?? 0;

  return (
    <Modal
      open
      title={t('Импорт пресета')}
      onCancel={onClose}
      onOk={handleImport}
      okText={t('Импортировать')}
      cancelText={t('Отмена')}
      confirmLoading={importing}
      okButtonProps={{ disabled: !parsed }}
      destroyOnClose
      centered
      width={typeof window !== 'undefined' && window.innerWidth <= 570 ? '95vw' : 520}
      styles={{
        body: {
          maxHeight: typeof window !== 'undefined' && window.innerWidth <= 570 ? '60vh' : 'none',
          overflowY: 'auto',
        },
      }}
    >
      <div
        css={css`
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        `}
      >
        <button
          type="button"
          onClick={handlePaste}
          css={css`
            border: none;
            background: none;
            cursor: pointer;
            font-size: 13px;
            color: var(--ant-color-primary);
            padding: 0;
          `}
        >
          {t('Вставить из буфера')}
        </button>
      </div>

      <Input.TextArea
        value={jsonText}
        onChange={e => handleJsonChange(e.target.value)}
        placeholder={t('Вставьте JSON пресета сюда...')}
        rows={8}
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
        aria-label={t('JSON пресета')}
      />

      {parseError && (
        <Alert
          type="error"
          message={parseError}
          showIcon
          css={css`
            margin-top: 12px;
          `}
        />
      )}

      {parsed && (
        <PreviewBox>
          <PreviewRow>
            <PreviewLabel>{t('Название')}</PreviewLabel>
            <span>{parsed.name}</span>
          </PreviewRow>
          {parsed.description && (
            <PreviewRow>
              <PreviewLabel>{t('Описание')}</PreviewLabel>
              <span>{parsed.description}</span>
            </PreviewRow>
          )}
          <PreviewRow>
            <PreviewLabel>{t('Фильтров')}</PreviewLabel>
            <span>{filterCount}</span>
          </PreviewRow>
          {parsed.metadata?.createdBy && (
            <PreviewRow>
              <PreviewLabel>{t('Автор')}</PreviewLabel>
              <span>{parsed.metadata.createdBy}</span>
            </PreviewRow>
          )}
        </PreviewBox>
      )}
    </Modal>
  );
};

export default ImportPresetModal;
