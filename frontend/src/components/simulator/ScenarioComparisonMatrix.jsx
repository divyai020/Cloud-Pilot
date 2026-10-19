import React from 'react';
import { Layers, Trash2, ArrowUpRight, Check, Sparkles } from 'lucide-react';

const ScenarioComparisonMatrix = ({ 
  savedScenarios, 
  onLoadScenario, 
  onDeleteScenario 
}) => {
  if (!savedScenarios || savedScenarios.length === 0) return null;

  return (
    <div className="scenario-comparison-card">
      <div className="card-header-row">
        <div className="env-title-group">
          <div className="chart-icon-box">
            <Layers size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="card-title">Saved Scenarios Comparison Matrix</h3>
            <p className="card-subtitle">Evaluate multiple custom cloud planning scenarios side-by-side</p>
          </div>
        </div>
      </div>

      <div className="drivers-table-wrapper mt-3">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>Scenario Name</th>
              <th className="text-right">Monthly Spend</th>
              <th className="text-right">Monthly Impact</th>
              <th className="text-right">Annual Impact</th>
              <th className="text-center">Risk Tier</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedScenarios.map((sc, idx) => {
              const { name, simulatedMonthlyCost, monthlyDifference, annualSavings, riskLevel } = sc;
              const isSavings = monthlyDifference <= 0;
              const diffAbs = Math.abs(monthlyDifference);

              return (
                <tr key={idx} className="driver-row">
                  <td className="font-semibold text-primary">
                    <Sparkles size={14} className="mr-1 text-purple inline" />
                    {name}
                  </td>

                  <td className="text-right font-medium">
                    ₹{simulatedMonthlyCost.toLocaleString('en-IN')}
                  </td>

                  <td className={`text-right font-bold ${isSavings ? 'text-green' : 'text-orange'}`}>
                    {isSavings ? `−₹${diffAbs.toLocaleString('en-IN')}` : `+₹${diffAbs.toLocaleString('en-IN')}`}
                  </td>

                  <td className={`text-right font-semibold ${isSavings ? 'text-green' : 'text-orange'}`}>
                    {isSavings ? `−₹${(diffAbs * 12).toLocaleString('en-IN')}/yr` : `+₹${(diffAbs * 12).toLocaleString('en-IN')}/yr`}
                  </td>

                  <td className="text-center">
                    <span className={`risk-badge-pill risk-${(riskLevel || 'Low').toLowerCase()}`}>
                      {riskLevel || 'Low'}
                    </span>
                  </td>

                  <td className="text-right">
                    <div className="action-btn-group">
                      <button 
                        className="btn-driver-action"
                        onClick={() => onLoadScenario(sc)}
                      >
                        Load into Sandbox
                      </button>

                      <button 
                        className="btn-driver-sim"
                        onClick={() => onDeleteScenario(idx)}
                        title="Delete scenario"
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScenarioComparisonMatrix;
