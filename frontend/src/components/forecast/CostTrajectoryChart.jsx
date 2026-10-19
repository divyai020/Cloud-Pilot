import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isToday = data.isToday;

    return (
      <div className="forecast-tooltip">
        <div className="tooltip-date">
          {label} {isToday && <span className="tooltip-today-badge">Today</span>}
        </div>
        
        {data.historical !== null && (
          <div className="tooltip-row">
            <span className="tooltip-dot historical-dot"></span>
            <span className="tooltip-label">Historical Cost:</span>
            <span className="tooltip-val">₹{data.historical.toLocaleString('en-IN')}</span>
          </div>
        )}

        {data.predicted !== null && !isToday && (
          <div className="tooltip-row">
            <span className="tooltip-dot predicted-dot"></span>
            <span className="tooltip-label">Predicted Cost:</span>
            <span className="tooltip-val purple">₹{data.predicted.toLocaleString('en-IN')}</span>
          </div>
        )}

        {data.lower !== null && data.upper !== null && !isToday && (
          <div className="tooltip-row confidence-range">
            <span className="tooltip-label">95% Confidence Band:</span>
            <span className="tooltip-val text-muted">
              ₹{data.lower.toLocaleString('en-IN')} – ₹{data.upper.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CostTrajectoryChart = ({ chartData }) => {
  const todayPoint = chartData.find(d => d.isToday);

  return (
    <div className="forecast-chart-card">
      <div className="forecast-chart-header">
        <div className="chart-title-container">
          <div className="chart-icon-box">
            <TrendingUp size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="chart-title">Cost Trajectory</h3>
            <p className="chart-subtitle">Observed spend vs AI predicted future trajectory</p>
          </div>
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-line historical-line"></span>
            <span>Historical</span>
          </div>
          <div className="legend-item">
            <span className="legend-line predicted-line"></span>
            <span>Predicted</span>
          </div>
          <div className="legend-item">
            <span className="legend-box confidence-box"></span>
            <span>Confidence Band</span>
          </div>
        </div>
      </div>

      <div className="forecast-chart-wrapper" style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 25, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B28DFF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#B28DFF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3143" opacity={0.5} vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748B" 
              fontSize={12} 
              tickLine={false} 
              axisLine={{ stroke: '#2A3143' }} 
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Confidence Band Area (Upper/Lower range) */}
            <Area 
              type="monotone" 
              dataKey="upper" 
              stroke="none" 
              fill="url(#confidenceGradient)" 
              name="Upper Bound" 
            />
            
            {/* Historical Spend Line */}
            <Line 
              type="monotone" 
              dataKey="historical" 
              stroke="#94A3B8" 
              strokeWidth={2.5} 
              dot={{ r: 4, fill: '#94A3B8', strokeWidth: 0 }} 
              activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#94A3B8', strokeWidth: 2 }}
              connectNulls={false}
            />

            {/* Predicted Spend Line */}
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#B28DFF" 
              strokeWidth={2.5} 
              strokeDasharray="6 6" 
              dot={{ r: 4, fill: '#B28DFF', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#B28DFF', stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls={true}
            />

            {/* Today Marker */}
            {todayPoint && (
              <ReferenceLine 
                x={todayPoint.date} 
                stroke="#B28DFF" 
                strokeDasharray="2 2"
                strokeWidth={1.5}
                label={{ 
                  value: 'Today', 
                  position: 'top', 
                  fill: '#B28DFF', 
                  fontSize: 11,
                  fontWeight: 600,
                  offset: 8
                }} 
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer-note">
        <Info size={14} className="text-muted mr-1" />
        <span className="text-xs text-muted">
          Continuous line represents verified AWS billing metrics. Dashed purple line represents ML model output with 95% confidence bounds.
        </span>
      </div>
    </div>
  );
};

export default CostTrajectoryChart;
