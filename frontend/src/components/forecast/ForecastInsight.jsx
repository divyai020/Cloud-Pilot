import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForecastInsight = ({ insight, horizon }) => {
  return (
    <div className="forecast-insight-card">
      <div className="insight-left">
        <div className="ai-icon-badge">
          <Sparkles size={20} color="#FFFFFF" />
        </div>
        <div>
          <div className="insight-header-row">
            <span className="insight-tag">AI FORECAST INSIGHT</span>
            <span className="insight-horizon-badge">{horizon === '7d' ? '7-Day View' : horizon === '90d' ? '90-Day View' : '30-Day View'}</span>
          </div>
          <p className="insight-text">
            {insight}
          </p>
        </div>
      </div>

      <div className="insight-right">
        <Link to="/cost-optimization" className="btn-insight-action">
          <span>Explore Optimizations</span>
          <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default ForecastInsight;
