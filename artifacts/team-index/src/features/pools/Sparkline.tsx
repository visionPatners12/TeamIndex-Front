import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = "hsl(var(--primary))",
  width = 100,
  height = 30,
  className = "",
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * graphWidth;
      const y = height - padding - ((val - min) / range) * graphHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="drop-shadow-[0_0_3px_rgba(0,255,255,0.5)]"
      />
    </svg>
  );
}
