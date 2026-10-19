import React, { useState } from 'react';
import { Cpu, ArrowRight, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const ForecastMethodology = ({ metadata }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      step: '01',
      title: 'Historical Cloud Data',
      desc: 'Ingests 90-day telemetry, AWS Cost Explorer APIs, and CloudWatch metrics.'
    },
    {
      step: '02',
      title: 'Data Preparation',
      desc: 'Cleans outliers, normalizes currency, and groups costs by service tags.'
    },
    {
      step: '03',
      title: 'Trend Analysis',
      desc: 'Decomposes base instance costs vs dynamic scaling growth vectors.'
    },
    {
      step: '04',
      title: 'ML Forecast Model',
      desc: 'Applies Scikit-learn Ridge Regression & Exponential Smoothing.'
    },
    {
      step: '05',
      title: 'Cost Horizon Output',
      desc: 'Generates predicted totals, confidence bounds, and optimization links.'
    }
  ];

  return (
    <div className="forecast-methodology-card">
      <div className="methodology-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="methodology-title-group">
          <div className="chart-icon-box">
            <Cpu size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h4 className="methodology-title">How is this forecast generated?</h4>
            <p className="methodology-subtitle">
              Explainable AI forecasting pipeline powered by Scikit-learn ML algorithms
            </p>
          </div>
        </div>

        <button className="btn-toggle-methodology">
          <span>{isExpanded ? 'Hide Pipeline Details' : 'View Pipeline Details'}</span>
          {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
        </button>
      </div>

      {/* Pipeline Flowchart Visual */}
      <div className="pipeline-flow-container">
        {steps.map((s, idx) => (
          <React.Fragment key={idx}>
            <div className="pipeline-step">
              <div className="step-num">{s.step}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className="pipeline-arrow">
                <ArrowRight size={16} color="var(--border-color)" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Expanded Technical Details */}
      {isExpanded && (
        <div className="methodology-details-drawer">
          <div className="drawer-grid">
            <div className="drawer-col">
              <h5><Sparkles size={14} className="mr-1 text-purple" /> ML Algorithm Stack</h5>
              <ul>
                <li><CheckCircle2 size={13} className="text-green mr-1" /> Scikit-learn Ridge Regression for linear trend projection</li>
                <li><CheckCircle2 size={13} className="text-green mr-1" /> Holt-Winters Exponential Smoothing for seasonal variance</li>
                <li><CheckCircle2 size={13} className="text-green mr-1" /> StandardScaling for resource utilization normalizations</li>
              </ul>
            </div>

            <div className="drawer-col">
              <h5><ShieldCheck size={14} className="mr-1 text-purple" /> Model Metadata</h5>
              <div className="metadata-list">
                <div className="meta-row">
                  <span className="meta-key">Training Window:</span>
                  <span className="meta-val">{metadata?.historicalWindow || '90 Days'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Prediction Model:</span>
                  <span className="meta-val">{metadata?.modelName || 'Scikit-learn Regressor'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">FastAPI Integration:</span>
                  <span className="meta-val badge-phase">Phase 9 Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastMethodology;
