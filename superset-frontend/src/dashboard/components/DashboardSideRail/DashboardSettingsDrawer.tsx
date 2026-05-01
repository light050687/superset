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
 * DashboardSettingsDrawer — настройки дашборда в формате нижнего drawer'а
 * (как Каталог / Фильтры / Конструктор). Открывается из gear-tile в
 * DevToolsPanel через toggleDrawer('dashboardSettings').
 *
 * Текущая секция: «Загрузка чартов» (concurrency limit + lazy + skeleton).
 * Готов к расширению — добавляются как новые <Section> блоки.
 *
 * Сохраняет в json_metadata.fetch_strategy через saveFetchStrategy thunk.
 * Read-only для viewer'ов без dash_edit_perm.
 */
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Switch, Slider } from 'antd';
import { styled, t } from '@superset-ui/core';
import { DS2_VARS } from 'src/theme/ds2';
import {
  DRAWER_FOOTER_SLOT_ID,
} from 'src/views/components/Shell/Drawer';
import { useShell } from 'src/views/components/Shell/ShellContext';
import {
  DEFAULT_FETCH_STRATEGY,
  FETCH_QUEUE_MIN_CONCURRENCY,
  FETCH_QUEUE_MAX_CONCURRENCY,
  type FetchStrategyMetadata,
  selectFetchStrategy,
} from 'src/dashboard/utils/fetchStrategy';
import { saveFetchStrategy } from 'src/dashboard/actions/fetchStrategy';
import type { RootState } from 'src/dashboard/types';

/* ─── Styled ─────────────────────────────────────────────────────── */

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: ${DS2_VARS.fontSans};
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: ${DS2_VARS.bg3};
  border-radius: 10px;
  border: 1px solid ${DS2_VARS.g200};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
  font-family: ${DS2_VARS.fontMono};
`;

const SectionDesc = styled.p`
  margin: -8px 0 0;
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  line-height: 1.4;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Label = styled.label`
  font-size: var(--fs-interactive);
  font-weight: 600;
  color: ${DS2_VARS.ink};
  cursor: pointer;
  flex: 1;
  min-width: 0;
`;

const Helper = styled.div`
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  line-height: 1.4;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  & .ant-slider {
    flex: 1;
  }
`;

const SliderValue = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-body);
  font-weight: 700;
  color: ${DS2_VARS.cFuchsia};
  min-width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const ReadOnlyNote = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  background: ${DS2_VARS.bg3};
  border-radius: 8px;
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g600};
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const FooterSpacer = styled.div`
  flex: 1;
`;

const ResetLink = styled.button`
  background: transparent;
  border: none;
  color: ${DS2_VARS.cSky};
  cursor: pointer;
  font-size: var(--fs-meta);
  padding: 4px 0;
  font-family: ${DS2_VARS.fontSans};
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/* ─── Component ──────────────────────────────────────────────────── */

export const DashboardSettingsDrawer: FC = () => {
  const dispatch = useDispatch();
  const { closeDrawer } = useShell();
  const currentStrategy = useSelector(selectFetchStrategy);
  const canEdit = useSelector<RootState, boolean>(
    s => s.dashboardInfo?.dash_edit_perm ?? false,
  );
  const dashboardId = useSelector<RootState, number | undefined>(
    s => s.dashboardInfo?.id,
  );

  const [concurrency, setConcurrency] = useState(currentStrategy.concurrency);
  const [lazy, setLazy] = useState(currentStrategy.lazy_offscreen);
  const [skeleton, setSkeleton] = useState(currentStrategy.show_skeletons);
  const [saving, setSaving] = useState(false);

  // Sync local state когда currentStrategy меняется (другая вкладка / БД).
  // Срабатывает на mount тоже — это норма (drawer mount = открытие).
  useEffect(() => {
    setConcurrency(currentStrategy.concurrency);
    setLazy(currentStrategy.lazy_offscreen);
    setSkeleton(currentStrategy.show_skeletons);
  }, [currentStrategy]);

  // Footer-slot DOM-узел берём через useState + ref на случай, если
  // <Drawer> ещё не успел смонтировать DrawerFooter slot к моменту
  // mount'а нашего компонента (race condition при быстром toggleDrawer).
  // requestAnimationFrame гарантирует что slot уже в DOM.
  const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setFooterSlot(document.getElementById(DRAWER_FOOTER_SLOT_ID));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const dirty = useMemo(
    () =>
      concurrency !== currentStrategy.concurrency ||
      lazy !== currentStrategy.lazy_offscreen ||
      skeleton !== currentStrategy.show_skeletons,
    [concurrency, lazy, skeleton, currentStrategy],
  );

  const handleSave = useCallback(async () => {
    if (!canEdit || !dirty || saving || dashboardId === undefined) return;
    setSaving(true);
    try {
      const payload: FetchStrategyMetadata = {
        concurrency,
        lazy_offscreen: lazy,
        show_skeletons: skeleton,
      };
      // @ts-ignore — thunk типизация
      await dispatch(saveFetchStrategy(payload));
      closeDrawer();
    } finally {
      setSaving(false);
    }
  }, [
    canEdit,
    dirty,
    saving,
    dashboardId,
    concurrency,
    lazy,
    skeleton,
    dispatch,
    closeDrawer,
  ]);

  const handleReset = useCallback(() => {
    setConcurrency(DEFAULT_FETCH_STRATEGY.concurrency);
    setLazy(DEFAULT_FETCH_STRATEGY.lazy_offscreen);
    setSkeleton(DEFAULT_FETCH_STRATEGY.show_skeletons);
  }, []);

  return (
    <>
      <Body>
        <Section>
          <SectionTitle>{t('Загрузка чартов')}</SectionTitle>
          <SectionDesc>
            {t(
              'Контролирует обращение чартов к backend. Снижает нагрузку на StarRocks через ограничение одновременных SQL-запросов и lazy-загрузку off-screen чартов.',
            )}
          </SectionDesc>

          <Field>
            <FieldHeader>
              <Label htmlFor="fs-concurrency">
                {t('Параллельные SQL-запросы')}
              </Label>
            </FieldHeader>
            <SliderRow>
              <Slider
                id="fs-concurrency"
                min={FETCH_QUEUE_MIN_CONCURRENCY}
                max={FETCH_QUEUE_MAX_CONCURRENCY}
                step={1}
                value={concurrency}
                onChange={(v: number) => setConcurrency(v)}
                disabled={!canEdit}
                marks={{ 1: '1', 4: '4', 6: '6', 8: '8', 12: '12' }}
                aria-describedby="fs-concurrency-help"
              />
              <SliderValue>{concurrency}</SliderValue>
            </SliderRow>
            <Helper id="fs-concurrency-help">
              {t(
                'Сколько SQL-запросов выполняется одновременно (1–12). Power BI default = 6, рекомендуем 8 для StarRocks dedicated.',
              )}
            </Helper>
          </Field>

          <Field>
            <FieldHeader>
              <Label htmlFor="fs-lazy">
                {t('Не грузить чарты вне экрана')}
              </Label>
              <Switch
                id="fs-lazy"
                checked={lazy}
                onChange={setLazy}
                disabled={!canEdit}
                aria-describedby="fs-lazy-help"
              />
            </FieldHeader>
            <Helper id="fs-lazy-help">
              {t(
                'Чарты ниже видимой области ждут scroll и не отправляют SQL. Реально снижает нагрузку на backend для длинных дашбордов.',
              )}
            </Helper>
          </Field>

          <Field>
            <FieldHeader>
              <Label htmlFor="fs-skeleton">
                {t('Показывать skeleton-плейсхолдер при загрузке')}
              </Label>
              <Switch
                id="fs-skeleton"
                checked={skeleton}
                onChange={setSkeleton}
                disabled={!canEdit}
                aria-describedby="fs-skeleton-help"
              />
            </FieldHeader>
            <Helper id="fs-skeleton-help">
              {t(
                'Анимированный shimmer-плейсхолдер поверх чарта пока он грузится. Если выключено — чарт появляется через fade-in.',
              )}
            </Helper>
          </Field>
        </Section>

        {/* Будущие секции добавлять как новые <Section>...</Section> */}

        {!canEdit && (
          <ReadOnlyNote>
            {t(
              'Только для просмотра. Изменения может вносить только редактор дашборда.',
            )}
          </ReadOnlyNote>
        )}
      </Body>

      {footerSlot &&
        createPortal(
          <FooterRow>
            {dirty && canEdit && (
              <ResetLink type="button" onClick={handleReset}>
                {t('Сбросить к значениям по умолчанию')}
              </ResetLink>
            )}
            <FooterSpacer />
            <Button onClick={closeDrawer}>{t('Отмена')}</Button>
            <Button
              type="primary"
              loading={saving}
              disabled={!canEdit || !dirty}
              onClick={handleSave}
            >
              {saving ? t('Сохранение…') : t('Сохранить')}
            </Button>
          </FooterRow>,
          footerSlot,
        )}
    </>
  );
};

export default DashboardSettingsDrawer;
