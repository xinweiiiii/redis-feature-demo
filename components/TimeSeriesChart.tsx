import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

  // Calculate statistics
  const values = dataPoints.map(p => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Format data for Recharts
  const chartData = dataPoints.map(point => ({
    ...point,
    time: new Date(point.timestamp).toLocaleTimeString('en-SG', {
      timeZone: 'Asia/Singapore',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    fullTime: new Date(point.timestamp).toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore'
    })
  }));

  return (
    <div className="timeseries-chart">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="time"
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
            label={{
              value: 'Time (SGT)',
              position: 'insideBottom',
              offset: -5,
              style: { fill: 'var(--text-secondary)' }
            }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
            label={{
              value: `Value (${unit})`,
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--text-secondary)' }
            }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullTime;
              }
              return label;
            }}
            formatter={(value: any) => [`${value.toFixed(2)} ${unit}`, 'Value']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fill="url(#colorValue)"
            dot={{ fill: 'white', stroke: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="chart-stats" style={{ marginTop: '1rem' }}>
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
            {avgValue.toFixed(2)} {unit}
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
