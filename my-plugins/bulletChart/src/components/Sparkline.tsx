import * as React from 'react';

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  color: string;
  /** Если точек < 2, рисуется точка-кружок по центру. */
  strokeWidth?: number;
}

/**
 * Лёгкий SVG sparkline (polyline) без внешних библиотек.
 * Порт buildSparkline() из bullet-formats-prototype.html:650.
 */
const Sparkline: React.FC<SparklineProps> = ({
  points,
  width = 70,
  height = 18,
  color,
  strokeWidth = 1.5,
}) => {
  if (!points.length) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      />
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  if (points.length === 1) {
    const cx = width / 2;
    const cy = height / 2;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <circle cx={cx} cy={cy} r={1.5} fill={color} />
      </svg>
    );
  }

  const coords = points
    .map((v, i) => {
      const x = padding + (i / (points.length - 1)) * w;
      const y = padding + h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  // Последняя точка — акцент
  const lastIdx = points.length - 1;
  const lastX = padding + w;
  const lastY = padding + h - ((points[lastIdx] - min) / range) * h;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.95}
      />
      {/* Последняя точка — акцент с обводкой цветом surface (ref:661) */}
      <circle
        cx={lastX}
        cy={lastY}
        r={2}
        fill={color}
        stroke="var(--s)"
        strokeWidth={1}
      />
    </svg>
  );
};

export default React.memo(Sparkline);
