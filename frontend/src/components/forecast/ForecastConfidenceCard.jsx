import React from 'react';
import { Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

const ForecastConfidenceCard = ({ confidence }) => {
  const { score = 85, level = 'High Confidence', badgeColor = 'green', description } = confidence || {};

  return (
    <div className="forecast-confidence-card">
      <div className="confidence-header">
        <div className="chart-icon-box">
          <Sparkles size={18} color="var(--accent-purple)" />
        </div>
        <div>
          <h4 className="confidence-title">AI Forecast Confidence</h4>
          <span className="text-xs text-muted">Model certainty metric</span>
        </div>
      </div>

      <div className="confidence-score-row">
        <div className="score-number">{score}%</div>
        <div className={`confidence-badge badge-${badgeColor}`}>
          {score >= 85 ? (
            <ShieldCheck size={14} className="mr-1" />
          ) : (
            <AlertTriangle size={14} className="mr-1" />
          )}
          <span>{level}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="confidence-meter-bg">
        <div 
          className="confidence-meter-fill" 
          style={{ width: `${score}%` }}
        ></div>
      </div>

      <p className="confidence-description text-xs text-secondary mt-3">
        {description || 'Based on consistent historical spending patterns and low architectural volatility.'}
      </p>

      <div className="confidence-footer text-xs text-muted mt-2">
        <span className="dot-indicator"></span>
        Forecast confidence reflects data consistency, distinct from model accuracy.
      </div>
    </div>
  );
};

export default ForecastConfidenceCard;
