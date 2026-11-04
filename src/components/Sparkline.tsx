import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showTrend?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = '#0054A6', 
  width = 80, 
  height = 24,
  showTrend = true 
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const trendPercent = data[0] !== 0 ? ((trend / Math.abs(data[0])) * 100).toFixed(0) : '0';
  const trendColor = trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : '#6B7280';
  const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="flex-shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showTrend && (
        <span className="text-xs font-medium flex-shrink-0" style={{ color: trendColor }}>
          {trendIcon} {trendPercent}%
        </span>
      )}
    </div>
  );
};