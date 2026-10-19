import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Leaf, AlertTriangle, ShieldCheck, MapPin, Save, PlusCircle } from 'lucide-react';

const SimulationResultCard = ({ 
  results, 
  onSaveScenario, 
  onAddToRoadmap, 
  isRoadmapAdded 
}) => {
  const {
    currentMonthlyCost = 48500,
    simulatedMonthlyCost = 48500,
    monthlyDifference = 0,
    isSavings = true,
    monthlySavings = 0,
    monthlyAdditional = 0,
    annualSavings = 0,
    annualAdditional = 0,
    percentageChange = 0,
    carbonDiffKg = 0,
    riskLevel = 'Low',
    riskRationale = 'Safe parameters'
  } = results || {};

  return (
    <div className="simulation-result-card">
      <div className="result-top-row">
        <div>
          <span className="result-tag">SIMULATION OUTCOME</span>
          <h3 className="result-main-heading">Financial & Capacity Impact</h3>
        </div>

        <div className={`risk-badge-box risk-${riskLevel.toLowerCase()}`}>
          {riskLevel === 'Low' ? (
            <ShieldCheck size={14} className="mr-1" />
          ) : (
            <AlertTriangle size={14} className="mr-1" />
          )}
          <span>{riskLevel} Risk</span>
        </div>
      </div>

      {/* Primary KPI Big Number */}
      <div className="result-kpi-block">
        <div className="kpi-current-vs-sim">
          <div className="cost-block">
            <span className="cost-label">Baseline Spend</span>
            <span className="cost-val">₹{currentMonthlyCost.toLocaleString('en-IN')}</span>
          </div>

          <div className="cost-arrow">→</div>

          <div className="cost-block highlight">
            <span className="cost-label">Simulated Spend</span>
            <span className="cost-val purple">₹{simulatedMonthlyCost.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={`impact-highlight-badge ${isSavings ? 'badge-savings' : 'badge-additional'}`}>
          {isSavings ? (
            <>
              <TrendingDown size={18} className="mr-1" />
              <span>Est. Savings: −₹{monthlySavings.toLocaleString('en-IN')}/mo ({Math.abs(percentageChange)}%)</span>
            </>
          ) : (
            <>
              <TrendingUp size={18} className="mr-1" />
              <span>Est. Increase: +₹{monthlyAdditional.toLocaleString('en-IN')}/mo (+{percentageChange}%)</span>
            </>
          )}
        </div>
      </div>

      {/* Detailed Grid Stats */}
      <div className="result-stats-grid mt-3">
        <div className="stat-card">
          <span className="stat-label">Annualized Financial Impact</span>
          <span className={`stat-val ${isSavings ? 'text-green' : 'text-orange'}`}>
            {isSavings ? `−₹${annualSavings.toLocaleString('en-IN')}/yr` : `+₹${annualAdditional.toLocaleString('en-IN')}/yr`}
          </span>
          <span className="stat-sub">12-month projection</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Sustainability Carbon Impact</span>
          <span className="stat-val text-leaf">
            <Leaf size={15} className="mr-1" />
            {carbonDiffKg <= 0 ? `−${Math.abs(carbonDiffKg)} kg CO₂/mo` : `+${carbonDiffKg} kg CO₂/mo`}
          </span>
          <span className="stat-sub">Estimated energy offset</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Operational Risk Assessment</span>
          <span className="stat-val text-primary">{riskRationale}</span>
          <span className="stat-sub">Capacity headroom status</span>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="result-actions-row mt-4">
        <button 
          className="btn-secondary-sm" 
          onClick={onSaveScenario}
        >
          <Save size={15} className="mr-1" /> Save Custom Scenario
        </button>

        <button 
          className={`btn-roadmap-action ${isRoadmapAdded ? 'added' : ''}`}
          onClick={onAddToRoadmap}
        >
          <PlusCircle size={16} className="mr-2" />
          {isRoadmapAdded ? 'Added to Optimization Roadmap ✓' : 'Add to Optimization Roadmap'}
        </button>
      </div>
    </div>
  );
};

export default SimulationResultCard;
