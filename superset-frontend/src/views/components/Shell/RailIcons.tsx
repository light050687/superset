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
 * Inline SVG-иконки для rail. Все иконки:
 * - viewBox 0 0 16 16
 * - stroke="currentColor", fill="none", stroke-width=1.5
 * - focusable=false, aria-hidden=true (roles лежат на <button>)
 */
import type { FC, SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  focusable: false,
  'aria-hidden': true,
};

export const IconHome: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" />
  </svg>
);

export const IconCatalog: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <path d="M2 2h5l2 2h5v10H2V2z" />
  </svg>
);

export const IconTools: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

export const IconCreate: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const IconSearch: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <circle cx="7" cy="7" r="4" />
    <path d="M10 10l3.5 3.5" />
  </svg>
);

export const IconCalendar: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6h12M5 1.5v3M11 1.5v3" />
  </svg>
);

export const IconTheme: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="4" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
  </svg>
);

export const IconAi: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
  </svg>
);

/** История чатов — часы с 9-часовой стрелкой (мокап #raHistory). */
export const IconHistory: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <path d="M8 4v4l3 2" />
    <path d="M8 14A6 6 0 108 2a6 6 0 000 12z" />
  </svg>
);

/** Тема «солнце» (мокап .th-sun, видима при data-theme=light). */
export const IconSun: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
  </svg>
);

/** Тема «луна» (мокап .th-moon, видима при data-theme=dark). */
export const IconMoon: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    {...base}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
  </svg>
);

export const IconSettings: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
  </svg>
);

export const IconClose: FC<React.PropsWithChildren<unknown>> = () => (
  <svg {...base}>
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);
