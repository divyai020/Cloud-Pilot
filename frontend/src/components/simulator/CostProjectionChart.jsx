import React, { useState } from 'react';

const CostProjectionChart = ({ currentCost, simulatedCost }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Interactive state for hovering/clicking on data points
  const [activeMonthIdx, setActiveMonthIdx] = useState(9); // Default to Oct (Today)
  const [hoveredLine, setHoveredLine] = useState(null);

  const baseScale = currentCost / 48500;
  const currentTrend = [
    Math.round(20000 * baseScale),
    Math.round(24000 * baseScale),
    Math.round(28000 * baseScale),
    Math.round(33000 * baseScale),
    Math.round(37000 * baseScale),
    Math.round(41000 * baseScale),
    Math.round(44000 * baseScale),
    Math.round(46500 * baseScale),
    Math.round(47800 * baseScale),
    Math.round(currentCost), // Oct (Today)
    Math.round(currentCost * 1.08), // Nov
    Math.round(currentCost * 1.18)  // Dec
  ];

  const simScale = simulatedCost / 48500;
  const simulatedTrend = [
    Math.round(12000 * simScale),
    Math.round(15000 * simScale),
    Math.round(19000 * simScale),
    Math.round(23000 * simScale),
    Math.round(26000 * simScale),
    Math.round(29000 * simScale),
    Math.round(31500 * simScale),
    Math.round(33000 * simScale),
    Math.round(34000 * simScale),
    Math.round(simulatedCost), // Oct (Today)
    Math.round(simulatedCost * 1.04), // Nov
    Math.round(simulatedCost * 1.09)  // Dec
  ];

  // SVG coordinate dimensions
  const width = 640;
  const height = 300;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 45;
  const padBottom = 40;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const maxVal = 85000;

  const getX = (idx) => padLeft + (idx / (months.length - 1)) * plotWidth;
  const getY = (val) => padTop + plotHeight - (Math.min(val, maxVal) / maxVal) * plotHeight;

  // Path coordinates
  const currentPoints = currentTrend.map((v, i) => `${getX(i)},${getY(v)}`);
  const simulatedPoints = simulatedTrend.map((v, i) => `${getX(i)},${getY(v)}`);

  const currentPathD = `M ${currentPoints.join(' L ')}`;
  const simPathD = `M ${simulatedPoints.join(' L ')}`;

  // Confidence Range polygon starting from October (idx 9) through December (idx 11)
  const confUpper = [
    { x: getX(9), y: getY(currentTrend[9]) },
    { x: getX(10), y: getY(currentTrend[10] * 1.12) },
    { x: getX(11), y: getY(currentTrend[11] * 1.20) }
  ];
  const confLower = [
    { x: getX(11), y: getY(simulatedTrend[11] * 0.88) },
    { x: getX(10), y: getY(simulatedTrend[10] * 0.92) },
    { x: getX(9), y: getY(simulatedTrend[9]) }
  ];
  const confAreaD = `M ${confUpper.map(p => `${p.x},${p.y}`).join(' L ')} L ${confLower.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  const selCurVal = currentTrend[activeMonthIdx];
  const selSimVal = simulatedTrend[activeMonthIdx];
  const selSaved = selCurVal - selSimVal;

  return (
    <div className="sim-chart-card interactive-chart">
      <div className="sim-chart-header">
        <div>
          <h4 className="sim-chart-title">Cost Projection</h4>
          <span className="sim-interactive-hint">Click any month to inspect projected spend</span>
        </div>
        <div className="sim-chart-legend">
          <button 
            className={`legend-btn ${hoveredLine === 'current' ? 'active' : ''}`}
            onClick={() => setHoveredLine(prev => prev === 'current' ? null : 'current')}
          >
            <span className="legend-dot purple" /> Current Trend
          </button>
          <button 
            className={`legend-btn ${hoveredLine === 'simulated' ? 'active' : ''}`}
            onClick={() => setHoveredLine(prev => prev === 'simulated' ? null : 'simulated')}
          >
            <span className="legend-dot green" /> Simulated Trend
          </button>
          <span className="legend-item">
            <span className="legend-box blue" /> Confidence Range
          </span>
        </div>
      </div>

      {/* Dynamic Popover / Info Badge */}
      <div className="sim-active-month-pill">
        <span className="active-pill-month">{months[activeMonthIdx]}:</span>
        <span className="active-pill-item cur">Current: <strong>₹{selCurVal.toLocaleString('en-IN')}</strong></span>
        <span className="active-pill-item sim">Simulated: <strong>₹{selSimVal.toLocaleString('en-IN')}</strong></span>
        <span className="active-pill-diff">
          {selSaved >= 0 ? `Savings: ₹${selSaved.toLocaleString('en-IN')}` : `Extra: +₹${Math.abs(selSaved).toLocaleString('en-IN')}`}
        </span>
      </div>

      <div className="sim-chart-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="sim-projection-svg">
          <defs>
            <linearGradient id="confGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.08" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Y Axis Gridlines */}
          {[0, 20000, 40000, 60000, 80000].map((v) => {
            const y = getY(v);
            return (
              <g key={v}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="11" fontWeight="600" fontFamily="sans-serif">
                  {v === 0 ? '₹0' : `₹${v / 1000}k`}
                </text>
              </g>
            );
          })}

          {/* Confidence Area */}
          <path d={confAreaD} fill="url(#confGradient)" />

          {/* Selected month vertical guide line */}
          <line
            x1={getX(activeMonthIdx)}
            y1={padTop - 10}
            x2={getX(activeMonthIdx)}
            y2={padTop + plotHeight}
            stroke={activeMonthIdx === 9 ? "#B28DFF" : "rgba(255,255,255,0.25)"}
            strokeDasharray={activeMonthIdx === 9 ? "4 4" : "2 2"}
            strokeWidth={activeMonthIdx === 9 ? "2" : "1"}
          />

          {/* Current line */}
          <path 
            d={currentPathD} 
            fill="none" 
            stroke="#B28DFF" 
            strokeWidth={hoveredLine === 'current' ? "4.5" : "3"} 
            style={{ filter: "url(#lineGlow)", transition: "stroke-width 0.25s" }}
          />
          {/* Simulated line */}
          <path 
            d={simPathD} 
            fill="none" 
            stroke="#10B981" 
            strokeWidth={hoveredLine === 'simulated' ? "4.5" : "3"} 
            style={{ filter: "url(#lineGlow)", transition: "stroke-width 0.25s" }}
          />

          {/* Interactive Clickable Nodes */}
          {months.map((m, i) => {
            const x = getX(i);
            const curY = getY(currentTrend[i]);
            const simY = getY(simulatedTrend[i]);
            const isSelected = activeMonthIdx === i;

            return (
              <g 
                key={m} 
                onClick={() => setActiveMonthIdx(i)} 
                className="interactive-node-group" 
                style={{ cursor: "pointer" }}
              >
                {/* Invisible wide click target */}
                <rect x={x - 20} y={padTop} width={40} height={plotHeight} fill="transparent" />

                {/* Current node dot */}
                <circle
                  cx={x}
                  cy={curY}
                  r={isSelected ? "7" : "4.5"}
                  fill="#B28DFF"
                  stroke="#0D1220"
                  strokeWidth="2"
                  style={{ filter: isSelected ? "drop-shadow(0 0 8px #B28DFF)" : "none", transition: "all 0.2s" }}
                />

                {/* Simulated node dot */}
                <circle
                  cx={x}
                  cy={simY}
                  r={isSelected ? "7" : "4.5"}
                  fill="#10B981"
                  stroke="#0D1220"
                  strokeWidth="2"
                  style={{ filter: isSelected ? "drop-shadow(0 0 8px #10B981)" : "none", transition: "all 0.2s" }}
                />
              </g>
            );
          })}

          {/* Today Indicator Flag at Month 9 (Oct) */}
          <g transform={`translate(${getX(9) - 24}, ${padTop - 30})`}>
            <rect width="48" height="22" rx="7" fill="#2E3756" stroke="rgba(178,141,255,0.6)" />
            <text x="24" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="sans-serif">
              Today
            </text>
          </g>

          {/* X Axis Month Labels */}
          {months.map((m, i) => {
            const isSelected = activeMonthIdx === i;
            return (
              <text
                key={m}
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                fill={isSelected ? "#FFFFFF" : "#94A3B8"}
                fontSize={isSelected ? "12" : "11"}
                fontWeight={isSelected ? "800" : "500"}
                fontFamily="sans-serif"
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => setActiveMonthIdx(i)}
              >
                {m}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default CostProjectionChart;
