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
import { styled } from '@superset-ui/core';
import type { FC, ReactNode } from 'react';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

/** 12-колоночная bento-сетка. */
export const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: ${DS2_SPACE.s3}px;
  margin-top: ${DS2_SPACE.s1}px;
`;

const SectionLabelRoot = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  margin: ${DS2_SPACE.s6}px 0 ${DS2_SPACE.s3}px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g600};
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${DS2_VARS.g100};
`;

export const SectionLabel: FC<{ title: string; children?: ReactNode }> = ({
  title,
  children,
}) => (
  <SectionLabelRoot>
    <span>{title}</span>
    <SectionLine />
    {children}
  </SectionLabelRoot>
);

export const Skeleton = styled.div`
  grid-column: span 4;
  height: 170px;
  background: linear-gradient(
    90deg,
    ${DS2_VARS.g100} 0%,
    ${DS2_VARS.g50} 50%,
    ${DS2_VARS.g100} 100%
  );
  background-size: 200% 100%;
  animation: bento-shimmer 1.4s ease-in-out infinite;
  border-radius: ${DS2_RADIUS.card}px;

  @keyframes bento-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

export const EmptyBlock = styled.div`
  grid-column: span 12;
  padding: ${DS2_SPACE.s6}px ${DS2_SPACE.s4}px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  color: ${DS2_VARS.g500};
  background: ${DS2_VARS.s};
  border: 1px dashed ${DS2_VARS.g200};
  border-radius: ${DS2_RADIUS.card}px;
  text-align: center;
`;

export const ErrorBlock = styled.div`
  grid-column: span 12;
  padding: ${DS2_SPACE.s4}px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  color: ${DS2_VARS.dn};
  background: ${DS2_VARS.dnBg};
  border: 1px solid ${DS2_VARS.dn};
  border-radius: ${DS2_RADIUS.card}px;
`;
