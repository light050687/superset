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
import { type FC } from 'react';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

interface AiEmptyProps {
  userFirstName?: string;
  prompts: string[];
  onPrompt: (text: string) => void;
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  font-family: ${DS2_VARS.fontSans};
  color: ${DS2_VARS.ink};
`;

const Logo = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${DS2_VARS.cSky}, ${DS2_VARS.cViolet});
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${DS2_SPACE.s4}px;
  box-shadow: 0 8px 32px rgba(59, 139, 217, 0.25);

  svg {
    width: 28px;
    height: 28px;
    color: ${DS2_VARS.s};
  }
`;

const H1 = styled.h1`
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 ${DS2_SPACE.s1}px;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: ${DS2_VARS.g500};
  margin-bottom: ${DS2_SPACE.s8}px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${DS2_SPACE.s2}px;
  width: 100%;
  max-width: 560px;
`;

const Suggest = styled.button`
  padding: ${DS2_SPACE.s4}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: ${DS2_RADIUS.card}px;
  text-align: left;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  color: ${DS2_VARS.g700};
  line-height: 1.4;
  transition:
    border-color 0.15s ${DS2_VARS.ease},
    background 0.15s ${DS2_VARS.ease},
    transform 0.15s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.cSky};
    background: rgba(59, 139, 217, 0.05);
    color: ${DS2_VARS.ink};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const AiLogoSvg: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
  </svg>
);

export const AiEmpty: FC<AiEmptyProps> = ({
  userFirstName,
  prompts,
  onPrompt,
}) => (
  <Root>
    <Logo aria-hidden>
      <AiLogoSvg />
    </Logo>
    <H1>
      {userFirstName
        ? t('Привет, %s', userFirstName)
        : t('Добро пожаловать в ИИ-аналитик')}
    </H1>
    <Subtitle>{t('О чём вы хотите спросить ваши данные?')}</Subtitle>
    <Grid>
      {prompts.map(prompt => (
        <Suggest
          key={prompt}
          type="button"
          onClick={() => onPrompt(prompt)}
          aria-label={t('Отправить вопрос: %s', prompt)}
        >
          {prompt}
        </Suggest>
      ))}
    </Grid>
  </Root>
);
