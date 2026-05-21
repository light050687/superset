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
 * Inline-SVG превью для bento-карточек. Паттерны детерминированные
 * (seeded по id), чтобы карточки не «прыгали» между рендерами.
 */
import type { FC } from 'react';
import { DS2_VARS } from 'src/theme/ds2';
import type { BentoCardKind } from './types';

interface PreviewProps {
  id: number;
  kind: BentoCardKind;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const Geo: FC<React.PropsWithChildren<{ id: number }>> = ({ id }) => {
  const rng = mulberry32(id || 7);
  const dots = Array.from({ length: 10 }, (_, j) => ({
    cx: 15 + Math.floor(rng() * 220),
    cy: 8 + Math.floor(rng() * 65),
    r: 2 + (j % 3),
    fill: j % 3 === 0 ? DS2_VARS.cTangerine : DS2_VARS.cSky,
    opacity: 0.35 + (j % 3) * 0.15,
  }));
  return (
    <svg
      viewBox="0 0 260 80"
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={d.fill}
          opacity={d.opacity}
        />
      ))}
    </svg>
  );
};

const Table: FC<React.PropsWithChildren<{ id: number }>> = ({ id }) => {
  const rng = mulberry32(id || 11);
  const rows = Array.from({ length: 4 }, (_, j) => ({
    y: 6 + j * 17,
    w1: 35 + Math.floor(rng() * 50),
    w2: 25 + Math.floor(rng() * 35),
    accent: j > 1,
  }));
  return (
    <svg
      viewBox="0 0 260 75"
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    >
      {rows.map((r, i) => (
        <g key={i}>
          <rect
            x={8}
            y={r.y}
            width={r.w1}
            height={9}
            rx={2}
            fill={i === 0 ? DS2_VARS.g300 : DS2_VARS.g200}
            opacity={0.6}
          />
          <rect
            x={70}
            y={r.y}
            width={r.w2}
            height={9}
            rx={2}
            fill={r.accent ? DS2_VARS.cTangerine : DS2_VARS.g200}
            opacity={0.45}
          />
        </g>
      ))}
    </svg>
  );
};

const Doc: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    viewBox="0 0 260 75"
    style={{ width: '100%', height: '100%' }}
    aria-hidden
  >
    <rect
      x={16}
      y={8}
      width={100}
      height={9}
      rx={2}
      fill={DS2_VARS.g300}
      opacity={0.5}
    />
    <rect
      x={16}
      y={24}
      width={180}
      height={5}
      rx={2}
      fill={DS2_VARS.g200}
      opacity={0.4}
    />
    <rect
      x={16}
      y={35}
      width={150}
      height={5}
      rx={2}
      fill={DS2_VARS.g200}
      opacity={0.4}
    />
    <rect
      x={16}
      y={46}
      width={190}
      height={5}
      rx={2}
      fill={DS2_VARS.g200}
      opacity={0.4}
    />
  </svg>
);

const Line: FC<React.PropsWithChildren<{ id: number }>> = ({ id }) => {
  const rng = mulberry32(id || 13);
  const points = Array.from({ length: 10 }, (_, x) => {
    const y = 65 - (12 + Math.floor(rng() * 45));
    return `${8 + x * 26},${y}`;
  });
  return (
    <svg
      viewBox="0 0 260 75"
      style={{ width: '100%', height: '100%', padding: 6 }}
      aria-hidden
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={DS2_VARS.cViolet}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
};

const Bars: FC<React.PropsWithChildren<{ id: number }>> = ({ id }) => {
  const rng = mulberry32(id || 17);
  const bars = Array.from({ length: 9 }, (_, x) => {
    const h = 10 + Math.floor(rng() * 45);
    return { x: 6 + x * 28, y: 70 - h, h, alt: x % 3 === 2 };
  });
  return (
    <svg
      viewBox="0 0 260 75"
      style={{ width: '100%', height: '100%', padding: 4 }}
      aria-hidden
    >
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={20}
          height={b.h}
          rx={3}
          fill={DS2_VARS.cSky}
          opacity={b.alt ? 0.3 : 0.7}
        />
      ))}
    </svg>
  );
};

export const BentoPreview: FC<React.PropsWithChildren<PreviewProps>> = ({
  id,
  kind,
}) => {
  switch (kind) {
    case 'geo':
      return <Geo id={id} />;
    case 'table':
      return <Table id={id} />;
    case 'doc':
      return <Doc />;
    case 'chart':
      return <Line id={id} />;
    case 'dashboard':
    default:
      return <Bars id={id} />;
  }
};
