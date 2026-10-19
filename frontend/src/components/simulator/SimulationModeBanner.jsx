import React from 'react';
import { Sliders, Info, RotateCcw, Save, ShieldAlert, Sparkles } from 'lucide-react';

const SimulationModeBanner = ({ 
  dataSource = 'Demo Environment', 
  isModified, 
  onReset, 
  onSaveScenario,
  activeScenarioName
}) => {
  return (
    <div className="simulator-banner-card">
      <div className="banner-left">
        <div className="banner-icon-box">
          <Sliders size={20} color="var(--accent-purple)" />
        </div>
        <div>
          <div className="banner-title-row">
            <h2 className="banner-title">Simulation Sandbox Mode</h2>
            <span className="badge-virtual-mode">
              <ShieldAlert size={12} className="mr-1" />
              Virtual Analysis • No AWS Changes
            </span>
            <span className="badge-source">Data Source: {dataSource}</span>
            {activeScenarioName && (
              <span className="badge-active-scenario">
                <Sparkles size={12} className="mr-1 text-purple" />
                Scenario: {activeScenarioName}
              </span>
            )}
          </div>
          <p className="banner-subtitle text-xs text-muted mt-1">
            Experiment with cloud configurations, instance sizing, storage tiers, and pricing models without modifying infrastructure or incurring charges.
          </p>
        </div>
      </div>

      <div className="banner-actions">
        {isModified && (
          <span className="unsaved-badge">
            <span className="dot-unsaved"></span> Unsaved Sandbox Changes
          </span>
        )}
        <button 
          className="btn-secondary-sm" 
          onClick={onReset}
          disabled={!isModified && !activeScenarioName}
          title="Restore baseline environment configuration"
        >
          <RotateCcw size={14} className="mr-1" /> Reset Sandbox
        </button>

        <button 
          className="btn-primary-sm" 
          onClick={onSaveScenario}
        >
          <Save size={14} className="mr-1" /> Save Scenario
        </button>
      </div>
    </div>
  );
};

export default SimulationModeBanner;
