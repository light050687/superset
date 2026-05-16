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

import { CSSProperties, ComponentType, FC } from 'react';

/* Shape-skeleton registry для устранения CLS между skeleton и loaded
   состояниями чартов. Каждый shape — упрощённая копия DOM плагина с
   точными размерами/padding/font-size, рендерится в ChartHolder ДО
   загрузки plugin chunk. После того как chunk загружается и плагин
   рендерит свой собственный skeleton (aria-busy="true") — shape-skeleton
   скрывается через CSS-rule в DashboardBuilder.tsx. Геометрия совпадает
   на всём lifecycle: shape → plugin skeleton → loaded content. */

export interface ShapeSkeletonProps {
  width: number;
  height: number;
}

/* Linear-gradient shimmer (как ds2-skeleton-shimmer в head_custom_extra.html)
   вместо opacity-pulse: opacity 0.12-0.22 на dark mode даёт почти нулевой
   контраст между --g200 (#272B30) и --s (#171A1E), placeholder-блоки визуально
   неотличимы от Card background. Linear-gradient между --g100 и --g200
   создаёт чёткий визуальный pulse, видимый и в light, и в dark. */
const KEYFRAMES_CSS = `
@keyframes shape-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

const skeletonBlockBase: CSSProperties = {
  borderRadius: 6,
  background:
    'linear-gradient(110deg, var(--g100) 8%, var(--g200) 18%, var(--g100) 33%)',
  backgroundSize: '200% 100%',
  animation: 'shape-skeleton-shimmer 1.6s ease-in-out infinite',
  flexShrink: 0,
};

interface SkeletonBlockProps {
  w: string | number;
  h: string | number;
  mb?: number;
}

const SkeletonBlock: FC<SkeletonBlockProps> = ({ w, h, mb }) => (
  <div
    aria-hidden="true"
    style={{
      ...skeletonBlockBase,
      width: typeof w === 'number' ? `${w}px` : w,
      height: typeof h === 'number' ? `${h}px` : h,
      marginBottom: mb,
    }}
  />
);

/* KpiShapeSkeleton — упрощённая копия KpiCard.tsx loading state (строки
   463-512) и Card стилей (styles.ts:155-208). DOM-структура: KpiCardRoot
   → Card → CardHead + DataContainer (HeroValue + Subtitle + ComparisonRow).
   Размеры через DS 2.0 CSS-vars (--fs-hero, --fs-meta) — fluid, реагируют
   на container queries (@container kpi). */
const KpiShapeSkeleton: FC<ShapeSkeletonProps> = () => (
  <div
    aria-busy="true"
    role="figure"
    aria-label="Загрузка"
    data-shape-skeleton="true"
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 2,
      pointerEvents: 'none',
      containerType: 'inline-size',
      containerName: 'kpi',
      transition: 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)',
    }}
  >
    <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
    {/* Card: копия styles.ts:169-208 */}
    <div
      style={{
        background: 'var(--s)',
        border: '1px solid transparent',
        borderRadius: 10,
        padding: '16px 20px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* CardHead: копия styles.ts:352-366 (margin-bottom 12px, min-height 24px) */}
      <div
        style={{
          marginBottom: 12,
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <SkeletonBlock w="40%" h={16} />
      </div>
      {/* DataContainer + DataLayer: копия styles.ts:442-457 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* HeroValue: var(--fs-hero) — clamp(28px, 1.5rem + 2.4cqi, 56px) */}
        <SkeletonBlock w="60%" h="var(--fs-hero, 40px)" mb={4} />
        {/* Subtitle: var(--fs-meta) — clamp(12-14px), margin-bottom 14px */}
        <SkeletonBlock w="35%" h="var(--fs-meta, 14px)" mb={14} />
        {/* ComparisonSection: margin-top auto, padding-top 10px, gap 12px,
            ::before line через borderTop */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            paddingTop: 10,
            marginTop: 'auto',
            borderTop: '1px solid var(--g100)',
          }}
        >
          <SkeletonBlock w={120} h={32} />
          <SkeletonBlock w={120} h={32} />
        </div>
      </div>
    </div>
  </div>
);

/* Реестр viz_type → shape-skeleton component. Расширяется добавлением
   новых записей. Для viz_type без shape — fallback на generic ds2-shimmer
   в ChartHolder.tsx (zero regression). */
export const VIZ_SHAPE_SKELETONS: Record<string, ComponentType<ShapeSkeletonProps>> = {
  'ext-kpi-card': KpiShapeSkeleton,
};
