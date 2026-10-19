import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

const CostComparisonBars = ({ currentCost, simulatedCost }) => {
  const maxCost = Math.max(currentCost, simulatedCost, 60000);
  const currentPct = Math.min(100, Math.round((currentCost / maxCost) * 100));
  const simulatedPct = Math.min(100, Math.round((simulatedCost / maxCost) * 100));

  const isSavings = simulatedCost <= currentCost;
  const diff = Math.abs(simulatedCost - currentCost);
  const pct = Math.abs(Number(((diff / currentCost) * 100).toFixed(1)));

  return (
    <div className="cost-comparison-bars-card">
      <div className="card-header-row">
        <div className="env-title-group">
          <div className="chart-icon-box">
            <Layers size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="card-title">Before vs After Spend Visualizer</h3>
            <p className="card-subtitle">Side-by-side total monthly expenditure comparison</p>
          </div>
        </div>

        <div className="diff-badge">
          {isSavings ? `−₹${diff.toLocaleString('en-IN')}/mo (−${pct}%)` : `+₹${diff.toLocaleString('en-IN')}/mo (+${pct}%)`}
        </div>
      </div>

      <div className="bars-container mt-3">
        {/* Baseline Bar */}
        <div className="bar-row">
          <div className="bar-label-group">
            <span className="bar-label">Current Baseline</span>
            <span className="bar-val">₹{currentCost.toLocaleString('en-IN')}/mo</span>
          </div>
          <div className="bar-bg">
            <div className="bar-fill baseline-fill" style={{ width: `${currentPct}%` }}></div>
          </div>
        </div>

        {/* Simulated Bar */}
        <div className="bar-row mt-3">
          <div className="bar-label-group">
            <span className="bar-label">Simulated Scenario</span>
            <span className="bar-val purple">₹{simulatedCost.toLocaleString('en-IN')}/mo</span>
          </div>
          <div className="bar-bg">
            <div 
              className={`bar-fill ${isSavings ? 'simulated-savings-fill' : 'simulated-additional-fill'}`} 
              style={{ width: `${simulatedPct}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostComparisonBars;
