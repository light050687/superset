import { memo, useId, useMemo, useRef, useState } from 'react';
import { catmullRomSmoothPath } from '../utils/catmullRom';
import { nf2 } from '../utils/formatRussian';
import type { DsTokens } from '../themeTokens';
import { MTrendCard } from '../styles';

interface Props {
  data: number[];
  tokens: DsTokens;
}

interface HoverState {
  idx: number;
  x: number;
  y: number;
  val: number;
}

/** Большой SVG-график тренда с Catmull-Rom smooth + hover-overlay с tooltip. */
function TrendChartInner({ data, tokens }: Props) {
  const gradId = `rs-trend-grad-${useId()}`;
  const overlayRef = useRef<SVGRectElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const { path, areaPath, pts, labels } = useMemo(() => {
    const w = 860;
    const h = 140;
    const padL = 10;
    const padR = 10;
    const padT = 14;
    const padB = 26;
    const min = Math.min(...data) * 0.9;
    const max = Math.max(...data) * 1.08;
    const range = max - min || 1;
    const sx = (i: number) =>
      padL + (i / Math.max(1, data.length - 1)) * (w - padL - padR);
    const sy = (v: number) =>
      h - padB - ((v - min) / range) * (h - padT - padB);
    const ptsArr = data.map((v, i) => ({ x: sx(i), y: sy(v), val: v, idx: i }));
    const p = catmullRomSmoothPath(ptsArr);
    const firstX = ptsArr[0]?.x.toFixed(1) ?? '0';
    const lastX = ptsArr[ptsArr.length - 1]?.x.toFixed(1) ?? '0';
    const area = `${p} L${lastX} ${(h - padB).toFixed(1)} L${firstX} ${(
      h - padB
    ).toFixed(1)} Z`;
    const lbls: { x: number; label: string }[] = [];
    for (let i = 0; i < data.length; i += 2) {
      const weeksAgo = data.length - 1 - i;
      lbls.push({
        x: sx(i),
        label: weeksAgo === 0 ? 'сейчас' : `−${weeksAgo}н`,
      });
    }
    return { path: p, areaPath: area, pts: ptsArr, labels: lbls };
  }, [data]);

  const w = 860;
  const h = 140;
  const padT = 14;
  const padB = 26;

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xInSvg = ((e.clientX - rect.left) / rect.width) * w;
    let near = pts[0];
    let minDist = Math.abs(pts[0].x - xInSvg);
    for (let i = 1; i < pts.length; i += 1) {
      const d = Math.abs(pts[i].x - xInSvg);
      if (d < minDist) {
        minDist = d;
        near = pts[i];
      }
    }
    setHover({ idx: near.idx, x: near.x, y: near.y, val: near.val });
  };

  const hoverLabel =
    hover && (data.length - 1 - hover.idx === 0
      ? 'сейчас'
      : `${data.length - 1 - hover.idx} нед. назад`);

  return (
    <MTrendCard>
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        overflow="visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tokens.tangerine} stopOpacity={0.35} />
            <stop offset="100%" stopColor={tokens.tangerine} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <line
          x1={10}
          y1={h - padB}
          x2={w - 10}
          y2={h - padB}
          stroke={tokens.g200}
          strokeWidth={1}
        />
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={path}
          fill="none"
          stroke={tokens.tangerine}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => {
          const isLast = i === pts.length - 1;
          return (
            <circle
              key={i}
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r={isLast ? 3.5 : 2}
              fill={tokens.tangerine}
              stroke={tokens.g50}
              strokeWidth={isLast ? 2 : 1}
            />
          );
        })}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={h - 7}
            fontFamily={tokens.fontMono}
            fontSize="10"
            fontWeight="500"
            fill={tokens.g500}
            textAnchor="middle"
          >
            {l.label}
          </text>
        ))}
        {hover && (
          <>
            <line
              x1={hover.x}
              y1={padT}
              x2={hover.x}
              y2={h - padB}
              stroke={tokens.g300}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.8}
              pointerEvents="none"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r={5.5}
              fill={tokens.tangerine}
              stroke={tokens.ink}
              strokeWidth={1.5}
              pointerEvents="none"
            />
          </>
        )}
        <rect
          ref={overlayRef}
          x={0}
          y={0}
          width={w}
          height={h}
          fill="white"
          fillOpacity={0.001}
          className="trend-overlay"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hover && (
        <div
          style={{
            position: 'absolute',
            left: `calc(${(hover.x / w) * 100}% + 8px)`,
            top: 6,
            background: tokens.g100,
            border: `1px solid ${tokens.g300}`,
            borderRadius: 8,
            padding: '6px 10px',
            fontFamily: tokens.fontMono,
            pointerEvents: 'none',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: tokens.g500,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {hoverLabel}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: tokens.tangerine,
              letterSpacing: '-.01em',
            }}
          >
            {nf2(hover.val)} %
          </div>
        </div>
      )}
    </MTrendCard>
  );
}

export default memo(TrendChartInner);
