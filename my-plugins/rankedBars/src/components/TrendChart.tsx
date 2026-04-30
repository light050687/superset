import React, { memo, useMemo } from 'react';

interface TrendChartProps {
  data: number[];
  color: string;
  height?: number;
  /** Short label under the last point (e.g. "сейчас", "−1н"). */
  labelBuilder?: (weeksAgo: number) => string;
}

const DEFAULT_LABEL = (weeksAgo: number): string =>
  weeksAgo === 0 ? 'сейчас' : `−${weeksAgo}н`;

/**
 * Area + line chart for the 12-week trend shown inside DetailModal.
 * Renders responsive (`preserveAspectRatio="none"`), matching the ref prototype.
 */
const TrendChart: React.FC<TrendChartProps> = ({
  data,
  color,
  height = 90,
  labelBuilder = DEFAULT_LABEL,
}) => {
  const paths = useMemo(() => {
    if (!data || data.length < 2) return null;
    const w = 700;
    const h = height;
    const padL = 8;
    const padR = 8;
    const padT = 10;
    const padB = 18;
    const min = Math.min(...data) * 0.9;
    const max = Math.max(...data) * 1.05;
    const range = max - min || 1;
    const sx = (i: number): number =>
      padL + (i / (data.length - 1)) * (w - padL - padR);
    const sy = (v: number): number =>
      h - padB - ((v - min) / range) * (h - padT - padB);

    const linePath = data
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`)
      .join(' ');
    const areaPath =
      linePath +
      ` L${sx(data.length - 1).toFixed(1)} ${h - padB} L${sx(0).toFixed(1)} ${h - padB} Z`;

    const labels: Array<{ x: number; label: string }> = [];
    const step = Math.max(1, Math.floor(data.length / 5));
    for (let i = 0; i < data.length; i += step) {
      const weeksAgo = data.length - 1 - i;
      labels.push({ x: sx(i), label: labelBuilder(weeksAgo) });
    }
    if (labels[labels.length - 1].x < sx(data.length - 1) - 10) {
      labels.push({ x: sx(data.length - 1), label: labelBuilder(0) });
    }

    return {
      w,
      h,
      padB,
      linePath,
      areaPath,
      points: data.map((v, i) => ({
        x: sx(i).toFixed(1),
        y: sy(v).toFixed(1),
        last: i === data.length - 1,
      })),
      labels,
    };
  }, [data, height, labelBuilder]);

  if (!paths) return null;

  // Use a unique gradient id so two charts on the page don't clash.
  const gradId = React.useId();

  return (
    <svg
      width="100%"
      height={paths.h}
      viewBox={`0 0 ${paths.w} ${paths.h}`}
      preserveAspectRatio="none"
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <line
        x1={8}
        y1={paths.h - paths.padB}
        x2={paths.w - 8}
        y2={paths.h - paths.padB}
        stroke="var(--g200)"
        strokeWidth={1}
      />
      <path d={paths.areaPath} fill={`url(#${gradId})`} />
      <path
        d={paths.linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {paths.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.last ? 3.5 : 1.8}
          fill={color}
          stroke="var(--s)"
          strokeWidth={p.last ? 1.5 : 1}
        />
      ))}
      {paths.labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={paths.h - 4}
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fontWeight="500"
          fill="var(--g500)"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
};

export default memo(TrendChart);
