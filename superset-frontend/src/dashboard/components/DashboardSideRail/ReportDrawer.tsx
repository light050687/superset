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
 * ReportDrawer — bottom-sheet drawer для управления email-рассылкой
 * дашборда. Открывается клик'ом по envelope-иконке на DashboardSideRail.
 *
 * Стиль идентичен Shell-drawer'ам (catalog/tools/create): чёрный
 * glassmorphism-фон (DS2_VARS.drawerBg), drag-handle сверху, заголовок
 * uppercase 12px g600, footer с action-кнопками. Прижат к низу
 * viewport'а над dock'ом, ширина min(96vw, 1200px), max-height
 * min(640px, 80vh).
 *
 * Содержимое — форма из ReportModal (дублируется): Имя отчёта,
 * Описание, Расписание (CronPicker + Timezone), Ширина скриншота. Plus
 * actions для существующего report'а: Toggle active / Delete.
 *
 * Получатели: переключатель «Личная / Список адресов». При «Список
 * адресов» можно ввести произвольные emails через tags-input, а также
 * подгрузить/сохранить именованные группы (хранятся в localStorage по
 * userId — клиентское решение до полноценного backend-storage).
 */
import {
  type FC,
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  styled,
  t,
  type SupersetTheme,
  getClientErrorObject,
  logging,
} from '@superset-ui/core';
import {
  Alert,
  Input,
  Button,
  LabeledErrorBoundInput,
  Checkbox,
  type CronError,
} from '@superset-ui/core/components';
import { Radio, type RadioChangeEvent } from '@superset-ui/core/components/Radio';
import { Select as AntdSelect } from 'antd';
import TimezoneSelector from '@superset-ui/core/components/TimezoneSelector';
import { Typography } from '@superset-ui/core/components/Typography';
import { DS2_VARS } from 'src/theme/ds2';
import {
  addReport,
  editReport,
  toggleActive,
} from 'src/features/reports/ReportModal/actions';
import { CreationMethod } from 'src/features/reports/ReportModal/HeaderReportDropdown';
import { reportSelector } from 'src/views/CRUD/hooks';
import {
  type ReportObject,
  NotificationFormats,
} from 'src/features/reports/types';
import { StyledInputContainer } from 'src/features/alerts/AlertReportModal';
import {
  CustomWidthHeaderStyle,
  StyledTopSection,
  StyledBottomSection,
  StyledScheduleTitle,
  StyledCronPicker,
  StyledCronError,
  noBottomMargin,
  TimezoneHeaderStyle,
  SectionHeaderStyle,
  antDErrorAlertStyles,
} from 'src/features/reports/ReportModal/styles';
import { addDangerToast as addDangerToastAction } from 'src/components/MessageToasts/actions';

/* Русская локализация для react-js-cron внутри drawer'а. */
const RU_CRON_LOCALE = {
  everyText: 'каждую',
  emptyMonths: 'каждый месяц',
  emptyMonthDays: 'каждое число',
  emptyMonthDaysShort: 'число',
  emptyWeekDays: 'каждый день недели',
  emptyWeekDaysShort: 'день недели',
  emptyHours: 'каждый час',
  emptyMinutes: 'каждую минуту',
  emptyMinutesForHourPeriod: 'каждую',
  yearOption: 'год',
  monthOption: 'месяц',
  weekOption: 'неделю',
  dayOption: 'день',
  hourOption: 'час',
  minuteOption: 'минуту',
  rebootOption: 'reboot',
  prefixPeriod: 'Каждую',
  prefixMonths: 'в',
  prefixMonthDays: 'в',
  prefixWeekDays: 'в',
  prefixWeekDaysForMonthAndYearPeriod: 'или',
  prefixHours: 'в',
  prefixMinutes: ':',
  prefixMinutesForHourPeriod: 'в',
  suffixMinutesForHourPeriod: 'мин',
  errorInvalidCron: 'Некорректное cron-выражение',
  clearButtonText: 'Очистить',
  weekDays: [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ],
  months: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  altWeekDays: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
  altMonths: [
    'ЯНВ',
    'ФЕВ',
    'МАР',
    'АПР',
    'МАЙ',
    'ИЮН',
    'ИЮЛ',
    'АВГ',
    'СЕН',
    'ОКТ',
    'НОЯ',
    'ДЕК',
  ],
};

/* ─── Styled (mirror Shell Drawer.tsx for catalog look) ──────────── */

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.22s ${DS2_VARS.ease};
  z-index: 94;
  @media print {
    display: none;
  }
`;

const Sheet = styled.aside<{ $open: boolean }>`
  position: fixed;
  bottom: ${DS2_VARS.drawerBottom};
  left: 50%;
  transform: translateX(-50%)
    translateY(${({ $open }) => ($open ? '0' : '20px')});
  width: min(96vw, 1200px);
  max-height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  overflow: hidden;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: ${DS2_VARS.drawerShadow};
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    transform 0.28s ${DS2_VARS.ease},
    opacity 0.2s ${DS2_VARS.ease};
  z-index: 95;

  @media print {
    display: none;
  }

  @media (max-width: 767px) {
    left: 8px;
    right: 8px;
    transform: none;
    width: auto;
    bottom: ${DS2_VARS.dockMobileHeight};
    max-height: 90vh;
    height: ${({ $open }) => ($open ? '90vh' : '0')};
  }
`;

const DragHandle = styled.div`
  width: 36px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  opacity: 0.5;
  flex-shrink: 0;
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 8px 22px 10px;
  flex-shrink: 0;
  gap: 12px;
`;

const HeadLeft = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const HeadCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
`;

const HeadRight = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

const Title = styled.span`
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${DS2_VARS.g500};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.ink};
    background: ${DS2_VARS.g100};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-color: ${DS2_VARS.g300} transparent;
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 5px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${DS2_VARS.g400};
    background-clip: padding-box;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 22px 14px;
  border-top: 1px solid ${DS2_VARS.drawerBorder};
  flex-shrink: 0;
  background: transparent;
`;

const FooterRight = styled.div`
  display: flex;
  gap: 8px;
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${DS2_VARS.g600};
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
`;

/* ─── Recipients section ─────────────────────────────────────────── */

const RecipientsSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colorSplit};
  padding: ${({ theme }) =>
    `${theme.sizeUnit * 4}px ${theme.sizeUnit * 4}px ${theme.sizeUnit * 4}px`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.sizeUnit * 3}px;
`;

const RecipientsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.sizeUnit * 2}px;
  flex-wrap: wrap;
`;

const FieldLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  color: ${({ theme }) => theme.colorTextSecondary};
  margin-bottom: ${({ theme }) => theme.sizeUnit}px;
`;

const GroupActionsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.sizeUnit * 2}px;
  align-items: center;
  flex-wrap: wrap;
`;

const IconCloseX = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.6"
  >
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);

/* ─── Email-groups storage (localStorage, scoped to userId) ──────── */

interface EmailGroup {
  name: string;
  emails: string[];
}

const groupsStorageKey = (userId: number) =>
  `superset.report.emailGroups.${userId}`;

function readEmailGroups(userId: number): EmailGroup[] {
  try {
    const raw = localStorage.getItem(groupsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is EmailGroup =>
        g &&
        typeof g.name === 'string' &&
        Array.isArray(g.emails) &&
        g.emails.every((e: unknown) => typeof e === 'string'),
    );
  } catch {
    return [];
  }
}

function writeEmailGroups(userId: number, groups: EmailGroup[]): void {
  try {
    localStorage.setItem(groupsStorageKey(userId), JSON.stringify(groups));
  } catch (e) {
    logging.error('Не удалось записать группы emails в localStorage', e);
  }
}

/* Простая email-валидация (RFC-5322 lite). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Types ──────────────────────────────────────────────────────── */

interface ReportDrawerProps {
  show: boolean;
  onHide: () => void;
  userId: number;
  userEmail: string;
  dashboardId: number;
  dashboardTitle?: string;
  onRequestDelete: (report: ReportObject) => void;
}

type ReportObjectState = Partial<ReportObject> & {
  error?: string;
  isSubmitting?: boolean;
};

const INITIAL_STATE: ReportObjectState = {
  crontab: '0 12 * * 1',
};

const EMPTY_OBJECT = {} as ReportObject;

type RecipientMode = 'personal' | 'list';

/* ─── Component ──────────────────────────────────────────────────── */

export const ReportDrawer: FC<ReportDrawerProps> = ({
  show,
  onHide,
  userId,
  userEmail,
  dashboardId,
  dashboardTitle,
  onRequestDelete,
}) => {
  const dispatch = useDispatch();

  const initialState: ReportObjectState = useMemo(
    () => ({
      ...INITIAL_STATE,
      name: dashboardTitle
        ? t('Weekly Report for %s', dashboardTitle)
        : t('Weekly Report'),
    }),
    [dashboardTitle],
  );

  const reportReducer = useCallback(
    (state: ReportObjectState | null, action: 'reset' | ReportObjectState) => {
      if (action === 'reset') return initialState;
      return { ...state, ...action };
    },
    [initialState],
  );

  const [currentReport, setCurrentReport] = useReducer(
    reportReducer,
    initialState,
  );
  const [cronError, setCronError] = useState<CronError>();

  /* Recipients toggle + tags + saved groups. */
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('personal');
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [emailGroups, setEmailGroups] = useState<EmailGroup[]>(() =>
    readEmailGroups(userId),
  );
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(
    null,
  );
  const [newGroupName, setNewGroupName] = useState('');

  /* Существующий report (если уже настроен ранее). */
  const report = useSelector<any, ReportObject>(
    state =>
      reportSelector(state, CreationMethod.Dashboards, dashboardId) ||
      EMPTY_OBJECT,
  );
  const isEditMode = !!(report && Object.keys(report).length);

  /* Когда drawer открывается — синхронизируем форму с текущим
     состоянием Redux + восстанавливаем recipients-mode из report'а. */
  useEffect(() => {
    if (!show) return;
    if (isEditMode) {
      setCurrentReport(report);
      /* Парсим существующих recipients: если первый recipient.target
         совпадает с userEmail (case-insensitive) и других нет —
         personal. Иначе — list. */
      const recipients = (report as any).recipients as
        | Array<{ recipient_config_json?: { target?: string } }>
        | undefined;
      const target = recipients?.[0]?.recipient_config_json?.target ?? '';
      const targets = target
        .split(/[,;\s]+/)
        .map(e => e.trim())
        .filter(Boolean);
      if (
        targets.length === 1 &&
        targets[0].toLowerCase() === userEmail.toLowerCase()
      ) {
        setRecipientMode('personal');
        setCustomEmails([]);
      } else if (targets.length > 0) {
        setRecipientMode('list');
        setCustomEmails(targets);
      } else {
        setRecipientMode('personal');
        setCustomEmails([]);
      }
    } else {
      setCurrentReport('reset');
      setRecipientMode('personal');
      setCustomEmails([]);
    }
    setSelectedGroupName(null);
    setNewGroupName('');
  }, [show, isEditMode, report, userEmail]);

  /* Esc → close. */
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onHide();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onHide]);

  /* Загрузка группы по name → подставить emails в customEmails. */
  const handleSelectGroup = useCallback(
    (name: string) => {
      setSelectedGroupName(name);
      const group = emailGroups.find(g => g.name === name);
      if (group) {
        setCustomEmails(group.emails);
      }
    },
    [emailGroups],
  );

  /* Сохранить текущий список как новую группу. */
  const handleSaveAsGroup = useCallback(() => {
    const name = newGroupName.trim();
    if (!name) {
      dispatch(addDangerToastAction(t('Введите название группы')));
      return;
    }
    if (customEmails.length === 0) {
      dispatch(addDangerToastAction(t('Список адресов пуст')));
      return;
    }
    const next = emailGroups.filter(g => g.name !== name);
    next.push({ name, emails: [...customEmails] });
    setEmailGroups(next);
    writeEmailGroups(userId, next);
    setSelectedGroupName(name);
    setNewGroupName('');
  }, [newGroupName, customEmails, emailGroups, userId, dispatch]);

  /* Удалить текущую выбранную группу. */
  const handleDeleteGroup = useCallback(() => {
    if (!selectedGroupName) return;
    const next = emailGroups.filter(g => g.name !== selectedGroupName);
    setEmailGroups(next);
    writeEmailGroups(userId, next);
    setSelectedGroupName(null);
  }, [selectedGroupName, emailGroups, userId]);

  const handleSave = useCallback(async () => {
    /* Сборка target: personal → userEmail, list → joined custom emails. */
    let target = userEmail;
    if (recipientMode === 'list') {
      const valid = customEmails.filter(e => EMAIL_REGEX.test(e));
      if (valid.length === 0) {
        dispatch(
          addDangerToastAction(
            t('Укажите хотя бы один корректный email-адрес.'),
          ),
        );
        return;
      }
      target = valid.join(', ');
    }

    const newReportValues: Partial<ReportObject> = {
      type: 'Report',
      active: true,
      force_screenshot: false,
      custom_width: currentReport.custom_width,
      creation_method: 'dashboards',
      dashboard: dashboardId,
      owners: [userId],
      recipients: [
        {
          // ccTarget/bccTarget required в типе recipient_config_json,
          // на этом этапе UI не поддерживает CC/BCC — пустые строки.
          recipient_config_json: { target, ccTarget: '', bccTarget: '' },
          type: 'Email',
        },
      ],
      name: currentReport.name,
      description: currentReport.description,
      crontab: currentReport.crontab,
      report_format: currentReport.report_format || NotificationFormats.PNG,
      timezone: currentReport.timezone,
    };

    setCurrentReport({ isSubmitting: true, error: undefined });
    try {
      if (isEditMode && currentReport.id) {
        await dispatch(
          // @ts-ignore — editReport thunk
          editReport(currentReport.id, newReportValues as ReportObject),
        );
      } else {
        // @ts-ignore — addReport thunk
        await dispatch(addReport(newReportValues as ReportObject));
      }
      setCurrentReport({ isSubmitting: false });
      onHide();
    } catch (e) {
      const { error } = await getClientErrorObject(e);
      logging.error(error);
      setCurrentReport({ isSubmitting: false, error });
      dispatch(addDangerToastAction(t('Не удалось сохранить рассылку.')));
    }
  }, [
    currentReport,
    dashboardId,
    userId,
    userEmail,
    recipientMode,
    customEmails,
    isEditMode,
    dispatch,
    onHide,
  ]);

  const handleToggleActive = useCallback(() => {
    if (report?.id) {
      dispatch(
        // @ts-ignore — toggleActive thunk
        toggleActive(report, !report.active),
      );
    }
  }, [dispatch, report]);

  const handleDelete = useCallback(() => {
    if (report?.id) {
      onRequestDelete(report);
    }
  }, [report, onRequestDelete]);

  return (
    <>
      <Backdrop $open={show} onClick={onHide} aria-hidden="true" />
      <Sheet
        role="dialog"
        aria-modal="true"
        aria-label={t('Управление рассылкой по почте')}
        $open={show}
      >
        <DragHandle />
        <Head>
          <HeadLeft>
            <Title>{t('Управление рассылкой по почте')}</Title>
          </HeadLeft>
          <HeadCenter />
          <HeadRight>
            <CloseBtn
              type="button"
              aria-label={t('Закрыть')}
              title={t('Закрыть (Esc)')}
              onClick={onHide}
            >
              <IconCloseX />
            </CloseBtn>
          </HeadRight>
        </Head>

        <Body>
          <StyledTopSection>
            <LabeledErrorBoundInput
              id="report-name"
              name="name"
              value={currentReport.name || ''}
              placeholder={initialState.name}
              required
              validationMethods={{
                onChange: ({ target }: { target: HTMLInputElement }) =>
                  setCurrentReport({ name: target.value }),
              }}
              label={t('Имя отчёта')}
              data-test="report-drawer-name"
            />
            <LabeledErrorBoundInput
              id="report-description"
              name="description"
              value={currentReport?.description || ''}
              validationMethods={{
                onChange: ({ target }: { target: HTMLInputElement }) =>
                  setCurrentReport({ description: target.value }),
              }}
              label={t('Описание')}
              placeholder={t(
                'Описание, которое будет отправлено вместе с вашим отчётом',
              )}
              css={noBottomMargin}
              data-test="report-drawer-description"
            />
          </StyledTopSection>

          {/* Recipients: personal / list toggle + tags input + groups. */}
          <RecipientsSection>
            <Typography.Title
              level={5}
              css={(theme: SupersetTheme) => SectionHeaderStyle(theme)}
            >
              {t('Получатели')}
            </Typography.Title>
            <RecipientsRow>
              <Radio.GroupWrapper
                value={recipientMode}
                onChange={(e: RadioChangeEvent) =>
                  setRecipientMode(e.target.value as RecipientMode)
                }
                options={[
                  { label: t('Личная (мой email)'), value: 'personal' },
                  { label: t('Список адресов'), value: 'list' },
                ]}
              />
            </RecipientsRow>

            {recipientMode === 'list' && (
              <>
                <div>
                  <FieldLabel>{t('Email-адреса получателей')}</FieldLabel>
                  <AntdSelect
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder={t(
                      'Введите email и нажмите Enter (можно несколько)',
                    )}
                    value={customEmails}
                    tokenSeparators={[',', ';', ' ', '\t', '\n']}
                    onChange={(values: string[]) => {
                      setCustomEmails(values);
                      setSelectedGroupName(null);
                    }}
                  />
                </div>

                {emailGroups.length > 0 && (
                  <div>
                    <FieldLabel>{t('Сохранённые группы')}</FieldLabel>
                    <GroupActionsRow>
                      <AntdSelect
                        style={{ minWidth: 240 }}
                        placeholder={t('Выберите группу')}
                        value={selectedGroupName ?? undefined}
                        onChange={(name: string) => handleSelectGroup(name)}
                        options={emailGroups.map(g => ({
                          label: `${g.name} (${g.emails.length})`,
                          value: g.name,
                        }))}
                      />
                      {selectedGroupName && (
                        <Button
                          buttonStyle="danger"
                          onClick={handleDeleteGroup}
                        >
                          {t('Удалить группу')}
                        </Button>
                      )}
                    </GroupActionsRow>
                  </div>
                )}

                <div>
                  <FieldLabel>{t('Сохранить текущий список как группу')}</FieldLabel>
                  <GroupActionsRow>
                    <Input
                      style={{ maxWidth: 320 }}
                      placeholder={t('Название группы')}
                      value={newGroupName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewGroupName(e.target.value)
                      }
                    />
                    <Button
                      buttonStyle="secondary"
                      onClick={handleSaveAsGroup}
                      disabled={
                        !newGroupName.trim() || customEmails.length === 0
                      }
                    >
                      {t('Сохранить группу')}
                    </Button>
                  </GroupActionsRow>
                </div>
              </>
            )}
          </RecipientsSection>

          <StyledBottomSection>
            <StyledScheduleTitle>
              <Typography.Title
                level={5}
                css={(theme: SupersetTheme) => SectionHeaderStyle(theme)}
              >
                {t('Расписание')}
              </Typography.Title>
              <p>{t('Отчёт будет отправлен на указанные адреса')}</p>
            </StyledScheduleTitle>

            <StyledCronPicker
              clearButton={false}
              locale={RU_CRON_LOCALE as any}
              value={currentReport.crontab || '0 12 * * 1'}
              setValue={(newValue: string) => {
                setCurrentReport({ crontab: newValue });
              }}
              onError={setCronError}
            />
            <StyledCronError>{cronError?.description}</StyledCronError>
            <div
              className="control-label"
              css={(theme: SupersetTheme) => TimezoneHeaderStyle(theme)}
            >
              {t('Часовой пояс')}
            </div>
            <TimezoneSelector
              timezone={currentReport.timezone}
              onTimezoneChange={value => {
                setCurrentReport({ timezone: value });
              }}
            />

            <StyledInputContainer>
              <div
                className="control-label"
                css={(theme: SupersetTheme) => CustomWidthHeaderStyle(theme)}
              >
                {t('Ширина скриншота')}
              </div>
              <div className="input-container">
                <Input
                  type="number"
                  name="custom_width"
                  value={currentReport?.custom_width || ''}
                  placeholder={t('Введите ширину в пикселях')}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setCurrentReport({
                      custom_width: parseInt(event.target.value, 10) || null,
                    });
                  }}
                />
              </div>
            </StyledInputContainer>
          </StyledBottomSection>

          {currentReport.error && (
            <Alert
              type="error"
              css={(theme: SupersetTheme) => antDErrorAlertStyles(theme)}
              message={
                isEditMode
                  ? t('Не удалось обновить рассылку')
                  : t('Не удалось создать рассылку')
              }
              description={currentReport.error}
            />
          )}
        </Body>

        <Footer>
          <div>
            {isEditMode && (
              <ToggleRow>
                <Checkbox
                  checked={!!report.active}
                  onChange={handleToggleActive}
                />
                {t('Рассылка активна')}
              </ToggleRow>
            )}
          </div>
          <FooterRight>
            {isEditMode && (
              <Button
                buttonStyle="danger"
                onClick={handleDelete}
                aria-label={t('Удалить рассылку')}
              >
                {t('Удалить')}
              </Button>
            )}
            <Button buttonStyle="secondary" onClick={onHide}>
              {t('Отменить')}
            </Button>
            <Button
              buttonStyle="primary"
              onClick={handleSave}
              disabled={!currentReport.name}
              loading={!!currentReport.isSubmitting}
              data-test="report-drawer-save"
            >
              {isEditMode ? t('Сохранить') : t('Добавить')}
            </Button>
          </FooterRight>
        </Footer>
      </Sheet>
    </>
  );
};

export default ReportDrawer;
