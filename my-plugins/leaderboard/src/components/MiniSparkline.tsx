import { memo, useMemo } from 'react';
import { catmullRomSmoothPath } from '../utils/catmullRom';

interface Props {
  data: number[];
  color: string;
  background?: string;
  width?: number;
  height?: number;
}

function MiniSparklineInner({
  data,
  color,
  background,
  width = 80,
  height = 22,
}: Props) {
  const { path, last } = useMemo(() => {
    if (data.length === 0) return { path: '', last: null as null | { x: number; y: number } };
    const padL = 2;
    const padR = 2;
    const padT = 3;
    const padB = 3;
    const min = Math.min(...data) * 0.95;
    const max = Math.max(...data) * 1.05;
    const range = max - min || 1;
    const sx = (i: number) =>
      padL + (i / Math.max(1, data.length - 1)) * (width - padL - padR);
    const sy = (v: number) =>
      height - padB - ((v - min) / range) * (height - padT - padB);
    const pts = data.map((v, i) => ({ x: sx(i), y: sy(v) }));
    return {
      path: catmullRomSmoothPath(pts),
      last: pts[pts.length - 1],
    };
  }, [data, width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle
          cx={last.x.toFixed(1)}
          cy={last.y.toFixed(1)}
          r={2}
          fill={color}
          stroke={background ?? 'var(--g100)'}
          strokeWidth={1}
        />
      )}
    </svg>
  );
}

export default memo(MiniSparklineInner);
