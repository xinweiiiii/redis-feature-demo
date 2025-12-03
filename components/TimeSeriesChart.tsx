interface DataPoint {
  timestamp: number;
  value: number;
}

interface TimeSeriesChartProps {
  dataPoints: DataPoint[];
  color: string;
  unit: string;
}

export default function TimeSeriesChart({ dataPoints, color, unit }: TimeSeriesChartProps) {
  if (dataPoints.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data points available. Add data or generate random data to see the chart.</p>
      </div>
    );
  }

  const width = 700;
  const height = 300;
  const padding = { top: 20, right: 60, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max values for scaling
  const values = dataPoints.map(p => p.value);
  const timestamps = dataPoints.map(p => p.timestamp);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  // Add some padding to the y-axis
  const valueRange = maxValue - minValue;
  const valuePadding = valueRange * 0.1 || 1;
  const yMin = minValue - valuePadding;
  const yMax = maxValue + valuePadding;

  // Scale functions
  const scaleX = (timestamp: number) => {
    if (maxTime === minTime) return chartWidth / 2;
    return ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;
  };

  const scaleY = (value: number) => {
    if (yMax === yMin) return chartHeight / 2;
    return chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Generate path for the line
  const pathData = dataPoints
    .map((point, index) => {
      const x = scaleX(point.timestamp);
      const y = scaleY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return yMin + (yMax - yMin) * (i / (yTicks - 1));
  });

  // Generate X-axis ticks (show up to 6 time labels)
  const maxXTicks = Math.min(6, dataPoints.length);
  const xTickIndices = Array.from({ length: maxXTicks }, (_, i) => {
    return Math.floor(i * (dataPoints.length - 1) / (maxXTicks - 1));
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-SG', {
      timeZone: 'Asia/Singapore',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="timeseries-chart">
      <svg width={width} height={height} className="chart-svg">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {yTickValues.map((value, i) => (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={scaleY(value)}
              x2={chartWidth}
              y2={scaleY(value)}
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Y-axis */}
          <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#666" strokeWidth="2" />

          {/* X-axis */}
          <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#666" strokeWidth="2" />

          {/* Y-axis labels */}
          {yTickValues.map((value, i) => (
            <text
              key={`y-label-${i}`}
              x={-10}
              y={scaleY(value)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill="#666"
            >
              {value.toFixed(1)}
            </text>
          ))}

          {/* X-axis labels */}
          {xTickIndices.map((index) => {
            const point = dataPoints[index];
            const x = scaleX(point.timestamp);
            return (
              <g key={`x-label-${index}`}>
                <line x1={x} y1={chartHeight} x2={x} y2={chartHeight + 5} stroke="#666" strokeWidth="1" />
                <text
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                >
                  {formatTime(point.timestamp)}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path
            d={`${pathData} L ${scaleX(dataPoints[dataPoints.length - 1].timestamp)} ${chartHeight} L ${scaleX(dataPoints[0].timestamp)} ${chartHeight} Z`}
            fill={`url(#gradient-${color})`}
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {dataPoints.map((point, index) => {
            const x = scaleX(point.timestamp);
            const y = scaleY(point.value);
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" />
                <title>{`${formatTime(point.timestamp)}: ${point.value.toFixed(2)} ${unit}`}</title>
              </g>
            );
          })}

          {/* Y-axis label */}
          <text
            x={-chartHeight / 2}
            y={-45}
            textAnchor="middle"
            fontSize="13"
            fill="#666"
            fontWeight="600"
            transform={`rotate(-90, -${chartHeight / 2}, -45)`}
          >
            Value ({unit})
          </text>

          {/* X-axis label */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 50}
            textAnchor="middle"
            fontSize="13"
            fill="#666"
            fontWeight="600"
          >
            Time (SGT)
          </text>
        </g>
      </svg>

      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Min:</span>
          <span className="stat-value" style={{ color }}>{minValue.toFixed(2)} {unit}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max:</span>
          <span className="stat-value" style={{ color }}>{maxValue.toFixed(2)} {unit}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg:</span>
          <span className="stat-value" style={{ color }}>
            {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)} {unit}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Points:</span>
          <span className="stat-value">{dataPoints.length}</span>
        </div>
      </div>
    </div>
  );
}
