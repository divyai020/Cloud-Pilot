import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ForecastSummaryCard = ({ summaryMetrics }) => {
  const { label, amount, changePercent, changeDirection, periodComparison } = summaryMetrics || {};

  const isUp = changeDirection === 'up';
  const isDown = changeDirection === 'down';

  return (
    <div className="forecast-summary-card">
      <div className="card-top-icon">
        <div className="kpi-icon-wrapper purple-glow">
          <Wallet size={20} color="var(--accent-purple)" />
        </div>
        <span className="card-badge-tag">HORIZON TARGET</span>
      </div>

      <div className="kpi-label mt-2">{label || 'EXPECTED COST'}</div>
      
      <div className="kpi-main-val">
        ₹{(amount || 0).toLocaleString('en-IN')}
        <span className="val-unit"> / period</span>
      </div>

      <div className={`forecast-change-indicator ${isUp ? 'change-warning' : isDown ? 'change-success' : 'change-neutral'}`}>
        {isUp && <TrendingUp size={16} className="mr-1" />}
        {isDown && <TrendingDown size={16} className="mr-1" />}
        {!isUp && !isDown && <Minus size={16} className="mr-1" />}
        <span>
          {isUp ? '+' : ''}{changePercent}% {periodComparison}
        </span>
      </div>

      <div className="summary-card-footer text-xs text-muted mt-3">
        Calculated from historical AWS billing trends and active scaling parameters.
      </div>
    </div>
  );
};

export default ForecastSummaryCard;
