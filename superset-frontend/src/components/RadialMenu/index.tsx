/**
 * RadialMenu — кольцевое (donut-style) контекстное меню действий чарта.
 *
 * Каждый item — это **arc-сегмент** SVG-кольца с равной угловой долей
 * (360°/N для root, 360°/M для submenu). Внутри hole кольца — кнопка
 * с × (закрыть) или ← (back в submenu). Hover на сегменте — fill →
 * acent цвет, tooltip с подписью появляется снаружи окружности по
 * радиальной нормали сегмента.
 *
 * Submenu: item с children → state переключается на children, центр
 * становится ← back. Click outside (по полупрозрачному overlay) или
 * Escape — закрывает меню полностью.
 *
 * Mobile-first: фиксированный SVG-размер 280×280 — touch friendly даже
 * на iPhone SE (375×667). На мелком viewport может выйти за edges —
 * это OK, верхний z-index выше всего.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { styled } from '@superset-ui/core';

export interface RadialMenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  children?: RadialMenuItem[];
}

interface Props {
  items: RadialMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

/* Геометрия. CX/CY — центр SVG viewbox. OUTER_R/INNER_R — внешний и
   внутренний радиус кольца. ICON_R — радиус на котором рендерятся
   иконки (середина «толщины» кольца). GAP_DEG — small angular gap
   между сегментами для visual separation. */
const SIZE = 280;
const CX = 140;
const CY = 140;
const OUTER_R = 112;
const INNER_R = 52;
const ICON_R = (OUTER_R + INNER_R) / 2;
const GAP_DEG = 2;

function polar(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const startOuter = polar(cx, cy, outerR, startDeg);
  const endOuter = polar(cx, cy, outerR, endDeg);
  const endInner = polar(cx, cy, innerR, endDeg);
  const startInner = polar(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${startInner.x} ${startInner.y}`,
    `Z`,
  ].join(' ');
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: transparent;
`;

const Root = styled.div<{ x: number; y: number }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  width: ${SIZE}px;
  height: ${SIZE}px;
  margin-left: -${SIZE / 2}px;
  margin-top: -${SIZE / 2}px;
  pointer-events: none;

  & > svg {
    width: 100%;
    height: 100%;
    display: block;
    filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.2));
  }

  & path.radial-arc {
    pointer-events: auto;
    cursor: pointer;
    transition:
      fill 0.15s ease,
      opacity 0.15s ease,
      stroke 0.15s ease;
    /* 0.3s — быстрая, snappy animation. Stagger 40ms counterclockwise. */
    animation: arc-pop 0.18s cubic-bezier(0.4, 0, 0.2, 1) both;
    transform-origin: ${CX}px ${CY}px;
    transform-box: view-box;
    /* Браузерный focus-outline на SVG path рисует bounding-box rectangle
       — для pie-сегмента это выглядит как квадрат вокруг арки. Убираем
       и даём custom focus state через stroke. */
    outline: none;
    &:focus-visible {
      stroke: #3b8bd9;
      stroke-width: 2;
    }
  }

  @keyframes arc-pop {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

`;

const IconLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const IconWrap = styled.div<{
  x: number;
  y: number;
  hovered: boolean;
  delay: number;
}>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  width: 32px;
  height: 32px;
  margin-left: -16px;
  margin-top: -16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: ${({ hovered }) => (hovered ? '#ffffff' : '#0a0a0a')};
  pointer-events: none;
  transition: color 0.15s ease;
  /* Иконки появляются ОДНОВРЕМЕННО с arc'ами (тот же delay, та же
     длительность) — visual: каждый item появляется как единое целое
     (arc + icon), не двумя фазами. */
  animation: icon-fade 0.18s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: ${({ delay }) => delay}ms;

  @keyframes icon-fade {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

`;

const CenterButton = styled.button`
  position: absolute;
  left: 50%;
  top: 50%;
  width: ${INNER_R * 2 - 14}px;
  height: ${INNER_R * 2 - 14}px;
  margin-left: -${INNER_R - 7}px;
  margin-top: -${INNER_R - 7}px;
  border-radius: 50%;
  background: #0a0a0a;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  font-size: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.15s ease,
    background 0.15s ease;
  z-index: 3;
  &:hover {
    transform: scale(1.06);
    background: #1f2328;
  }
  &:focus-visible {
    outline: 2px solid #3b8bd9;
    outline-offset: 2px;
  }
`;

const Tooltip = styled.div<{ x: number; y: number }>`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  transform: translate(-50%, -50%);
  background: #0a0a0a;
  color: #ffffff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  /* Compact width + wrap — длинные labels («Перейти к детализации») не
     вылазят за viewport и не пересекаются с соседними сегментами.
     Symmetric: tooltip всегда одинакового макс-размера, позиция
     полностью predictable = центр на нормали от сегмента. */
  width: max-content;
  max-width: 120px;
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 4;
  animation: tip-in 0.12s ease both;
  @keyframes tip-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export function RadialMenu({ items, x, y, onClose }: Props): JSX.Element {
  const [submenu, setSubmenu] = useState<RadialMenuItem[] | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const activeItems = submenu ?? items;
  const inSubmenu = submenu !== null;
  const N = activeItems.length;
  const share = N > 0 ? 360 / N : 0;

  /* Escape: на root закрывает меню, в submenu — возврат к root. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (inSubmenu) {
        setSubmenu(null);
        setHovered(null);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inSubmenu, onClose]);

  const handleItemClick = (item: RadialMenuItem): void => {
    if (item.children && item.children.length > 0) {
      setSubmenu(item.children);
      setHovered(null);
      return;
    }
    item.onClick?.();
    onClose();
  };

  const handleCenter = (): void => {
    if (inSubmenu) {
      setSubmenu(null);
      setHovered(null);
    } else {
      onClose();
    }
  };

  /* Tooltip position: радиальная нормаль от центра наружу на расстоянии
     OUTER_R + 32, направление = midAngle того сегмента, который hovered. */
  let tooltipPos: { x: number; y: number } | null = null;
  if (hovered !== null && hovered < activeItems.length) {
    const midAngle = -90 + hovered * share + share / 2;
    tooltipPos = polar(CX, CY, OUTER_R + 32, midAngle);
  }

  return createPortal(
    <Overlay
      onClick={onClose}
      onContextMenu={(e: React.MouseEvent) => {
        e.preventDefault();
        onClose();
      }}
      role="dialog"
      aria-label="Контекстное меню чарта"
    >
      <Root
        x={x}
        y={y}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          aria-hidden="true"
        >
          {activeItems.map((item, i) => {
            const startDeg = -90 + i * share + GAP_DEG / 2;
            const endDeg = -90 + (i + 1) * share - GAP_DEG / 2;
            const d = arcPath(CX, CY, INNER_R, OUTER_R, startDeg, endDeg);
            const isHovered = hovered === i;
            return (
              <path
                key={item.key}
                className="radial-arc"
                d={d}
                fill={isHovered ? '#3b8bd9' : '#ffffff'}
                stroke="#dcdcdc"
                strokeWidth="1"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() =>
                  setHovered(cur => (cur === i ? null : cur))
                }
                onClick={() => handleItemClick(item)}
                style={{
                  /* Reverse stagger 40ms — counterclockwise appearance:
                     последний item появляется первым, items раскрываются
                     от item N-1 к item 0 (visually против часовой). */
                  animationDelay: `${(N - 1 - i) * 22}ms`,
                }}
                aria-label={item.label}
                role="button"
                tabIndex={0}
              />
            );
          })}
        </svg>
        <IconLayer>
          {activeItems.map((item, i) => {
            const midAngle = -90 + i * share + share / 2;
            const pos = polar(CX, CY, ICON_R, midAngle);
            return (
              <IconWrap
                key={item.key}
                x={pos.x}
                y={pos.y}
                hovered={hovered === i}
                /* Тот же delay что у arc — icon и arc появляются вместе.
                   Counterclockwise stagger 40ms между items. */
                delay={(N - 1 - i) * 22}
              >
                {item.icon}
              </IconWrap>
            );
          })}
        </IconLayer>
        <CenterButton
          type="button"
          onClick={handleCenter}
          aria-label={inSubmenu ? 'Назад' : 'Закрыть меню'}
        >
          {inSubmenu ? <ArrowLeftOutlined /> : <CloseOutlined />}
        </CenterButton>
        {tooltipPos && (
          <Tooltip x={tooltipPos.x} y={tooltipPos.y}>
            {activeItems[hovered as number].label}
          </Tooltip>
        )}
      </Root>
    </Overlay>,
    document.body,
  );
}

export default RadialMenu;
