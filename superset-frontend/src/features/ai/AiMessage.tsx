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
 * Рендер одного сообщения в AI-чате.
 * Поддерживает:
 * - user: пузырь с текстом
 * - thinking: индикатор «Анализирую...»
 * - bot: структурированный ответ (title/text/kpi/chart/insight/actions/source/followup)
 */
import { styled, t } from '@superset-ui/core';
import { type FC } from 'react';
import { useHistory } from 'react-router-dom';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type { AiAnswerBlocks } from './types';

const MsgUser = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${DS2_SPACE.s6}px;
`;

const Bubble = styled.div`
  background: ${DS2_VARS.g100};
  color: ${DS2_VARS.ink};
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s4}px;
  border-radius: 18px 18px 4px 18px;
  font-size: 14px;
  max-width: 80%;
  line-height: 1.5;
  font-family: ${DS2_VARS.fontSans};
`;

const MsgBot = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s3}px;
  margin-bottom: ${DS2_SPACE.s6}px;
`;

const Avatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${DS2_VARS.cSky}, ${DS2_VARS.cViolet});
  color: ${DS2_VARS.s};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  font-family: ${DS2_VARS.fontSans};
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: ${DS2_SPACE.s3}px;
  color: ${DS2_VARS.ink};
`;

const Text = styled.div`
  font-size: 14px;
  line-height: 1.65;
  color: ${DS2_VARS.g700};
  margin-bottom: ${DS2_SPACE.s3}px;

  strong {
    color: ${DS2_VARS.ink};
    font-weight: 600;
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: ${DS2_SPACE.s2}px;
  margin-bottom: ${DS2_SPACE.s4}px;
`;

const KpiCard = styled.div`
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: ${DS2_RADIUS.card}px;
  padding: ${DS2_SPACE.s3}px ${DS2_SPACE.s3}px;
`;

const KpiLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
`;

const KpiValue = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 20px;
  font-weight: 800;
  color: ${DS2_VARS.ink};
  font-variant-numeric: tabular-nums;
`;

const KpiDelta = styled.div<{ $kind?: 'up' | 'dn' | 'neutral' }>`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  margin-top: 3px;
  color: ${({ $kind }) => {
    if ($kind === 'up') return DS2_VARS.up;
    if ($kind === 'dn') return DS2_VARS.dn;
    return DS2_VARS.g500;
  }};
`;

const Chart = styled.div`
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: ${DS2_RADIUS.card}px;
  padding: ${DS2_SPACE.s4}px;
  margin-bottom: ${DS2_SPACE.s4}px;
`;

const ChartHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${DS2_SPACE.s3}px;
`;

const ChartTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${DS2_VARS.g700};
`;

const ChartSubtitle = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
`;

const Insight = styled.div`
  background: ${DS2_VARS.wnBg};
  border: 1px solid rgba(204, 182, 4, 0.25);
  border-left: 3px solid ${DS2_VARS.wn};
  border-radius: ${DS2_RADIUS.control}px;
  padding: ${DS2_SPACE.s3}px ${DS2_SPACE.s4}px;
  font-size: 13px;
  color: ${DS2_VARS.g700};
  line-height: 1.55;
  margin-bottom: ${DS2_SPACE.s4}px;
  display: flex;
  gap: ${DS2_SPACE.s3}px;
  align-items: flex-start;

  strong {
    color: ${DS2_VARS.ink};
  }
`;

const InsightIcon = styled.span`
  color: ${DS2_VARS.wn};
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${DS2_SPACE.s1}px;
  margin-bottom: ${DS2_SPACE.s4}px;
`;

const ActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 20px;
  font-size: 12px;
  color: ${DS2_VARS.g700};
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: rgba(59, 139, 217, 0.05);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const Source = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s2}px 0;
  border-top: 1px solid ${DS2_VARS.g100};
  margin-top: ${DS2_SPACE.s3}px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  color: ${DS2_VARS.g500};
  flex-wrap: wrap;
`;

const SrcChip = styled.span`
  background: ${DS2_VARS.g100};
  padding: 2px 8px;
  border-radius: 4px;
  color: ${DS2_VARS.g600};
`;

const SrcTime = styled.span`
  margin-left: auto;
`;

const Followups = styled.div`
  margin-top: ${DS2_SPACE.s4}px;
`;

const FollowupLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: ${DS2_SPACE.s2}px;
`;

const FollowupItem = styled.button`
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: ${DS2_RADIUS.control}px;
  font-size: 13px;
  color: ${DS2_VARS.g700};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  width: 100%;
  text-align: left;
  margin-bottom: ${DS2_SPACE.s1}px;
  font-family: ${DS2_VARS.fontSans};
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: rgba(59, 139, 217, 0.05);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const FuArrow = styled.span`
  margin-left: auto;
  color: ${DS2_VARS.g400};
  font-size: 10px;
`;

const Thinking = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s3}px 0;
  color: ${DS2_VARS.g500};
  font-size: 13px;
`;

const Dots = styled.span`
  display: flex;
  gap: 3px;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${DS2_VARS.cSky};
    animation: blink 1.4s infinite;
  }
  span:nth-of-type(2) {
    animation-delay: 0.2s;
  }
  span:nth-of-type(3) {
    animation-delay: 0.4s;
  }

  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const BotIcon: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
  </svg>
);

interface AiMessageProps {
  role: 'user' | 'bot' | 'thinking';
  text?: string;
  blocks?: AiAnswerBlocks;
  onFollowup?: (text: string) => void;
  onAction?: (label: string, url?: string) => void;
}

export const AiMessage: FC<React.PropsWithChildren<AiMessageProps>> = ({
  role,
  text,
  blocks,
  onFollowup,
  onAction,
}) => {
  const history = useHistory();

  if (role === 'user') {
    return (
      <MsgUser>
        <Bubble>{text}</Bubble>
      </MsgUser>
    );
  }

  if (role === 'thinking') {
    return (
      <MsgBot>
        <Avatar aria-hidden>
          <BotIcon />
        </Avatar>
        <Content>
          <Thinking>
            {t('Анализирую ваши данные')}
            <Dots aria-hidden>
              <span />
              <span />
              <span />
            </Dots>
          </Thinking>
        </Content>
      </MsgBot>
    );
  }

  const b = blocks ?? {};
  const handleAction = (label: string, url?: string) => {
    if (onAction) {
      onAction(label, url);
      return;
    }
    if (url && url !== '#') {
      if (url.startsWith('/')) {
        history.push(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <MsgBot>
      <Avatar aria-hidden>
        <BotIcon />
      </Avatar>
      <Content>
        {b.title ? <Title>{b.title}</Title> : null}
        {b.text ? <Text>{b.text}</Text> : null}

        {b.kpi && b.kpi.length > 0 ? (
          <KpiGrid>
            {b.kpi.map((k, i) => (
              <KpiCard key={`${k.label}-${i}`}>
                <KpiLabel>{k.label}</KpiLabel>
                <KpiValue>{k.value}</KpiValue>
                {k.deltaLabel ? (
                  <KpiDelta $kind={k.deltaKind}>{k.deltaLabel}</KpiDelta>
                ) : null}
              </KpiCard>
            ))}
          </KpiGrid>
        ) : null}

        {b.chart ? (
          <Chart>
            <ChartHead>
              {b.chart.title ? <ChartTitle>{b.chart.title}</ChartTitle> : null}
              {b.chart.subtitle ? (
                <ChartSubtitle>{b.chart.subtitle}</ChartSubtitle>
              ) : null}
            </ChartHead>
            {b.chart.svg ? (
              // eslint-disable-next-line react/no-danger
              (<div dangerouslySetInnerHTML={{ __html: b.chart.svg }} />)
            ) : (
              <ChartSubtitle>
                {t('(график будет отрисован через ECharts)')}
              </ChartSubtitle>
            )}
          </Chart>
        ) : null}

        {b.insight ? (
          <Insight>
            <InsightIcon>💡</InsightIcon>
            <div>
              {b.insight.prefix ? <strong>{b.insight.prefix}: </strong> : null}
              {b.insight.text}
            </div>
          </Insight>
        ) : null}

        {b.actions && b.actions.length > 0 ? (
          <Actions>
            {b.actions.map((a, i) => (
              <ActionBtn
                key={`${a.label}-${i}`}
                type="button"
                onClick={() => handleAction(a.label, a.url)}
              >
                {a.label}
              </ActionBtn>
            ))}
          </Actions>
        ) : null}

        {b.source ? (
          <Source>
            {b.source.chips.map((chip, i) => (
              <SrcChip key={`${chip}-${i}`}>{chip}</SrcChip>
            ))}
            {b.source.updatedHuman ? (
              <SrcTime>
                {t('Обновлено')} {b.source.updatedHuman}
              </SrcTime>
            ) : null}
          </Source>
        ) : null}

        {b.followups && b.followups.length > 0 ? (
          <Followups>
            <FollowupLabel>{t('Спросить также')}</FollowupLabel>
            {b.followups.map((f, i) => (
              <FollowupItem
                key={`${f.text}-${i}`}
                type="button"
                onClick={() => onFollowup?.(f.text)}
              >
                {f.text}
                <FuArrow>→</FuArrow>
              </FollowupItem>
            ))}
          </Followups>
        ) : null}
      </Content>
    </MsgBot>
  );
};
