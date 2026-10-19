import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIScenarioInsightCard = ({ aiInsight, riskRationale, riskLevel }) => {
  return (
    <div className="forecast-insight-card">
      <div className="insight-left">
        <div className="ai-icon-badge">
          <Sparkles size={20} color="#FFFFFF" />
        </div>
        <div>
          <div className="insight-header-row">
            <span className="insight-tag">AI SIMULATION INSIGHT</span>
            <span className={`risk-badge-pill risk-${(riskLevel || 'Low').toLowerCase()}`}>
              {riskLevel === 'Low' ? <ShieldCheck size={11} className="mr-1" /> : <AlertTriangle size={11} className="mr-1" />}
              {riskLevel || 'Low'} Operational Risk
            </span>
          </div>
          <p className="insight-text">
            {aiInsight || 'Modify parameters above to compute instant financial and workload simulation insights.'}
          </p>
          <div className="text-xs text-muted mt-1">
            <strong>Capacity Rationale:</strong> {riskRationale}
          </div>
        </div>
      </div>

      <div className="insight-right">
        <Link to="/roadmap" className="btn-insight-action">
          <span>View Optimization Roadmap</span>
          <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default AIScenarioInsightCard;
