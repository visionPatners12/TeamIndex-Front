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
  className = ""
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const clean = data.map((v) => (Number.isFinite(v) ? v : 0));
  if (clean.length === 0) return null;

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1; // Prevent division by zero
  
  const padding = 2;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  const xDenom = Math.max(1, clean.length - 1);

  const points = clean.map((val, i) => {
    const x = padding + (i / xDenom) * graphWidth;
    const y = height - padding - ((val - min) / range) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

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
