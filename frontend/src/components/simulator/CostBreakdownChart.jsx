import React, { useState } from 'react';

const CostBreakdownChart = ({ currentCost, simulatedCost }) => {
  const [selectedService, setSelectedService] = useState('EC2');

  const ratio = simulatedCost / (currentCost || 48500);

  const services = [
    { 
      name: 'EC2', 
      current: 22000, 
      simulated: Math.round(22000 * Math.min(1.2, Math.max(0.55, ratio * 0.82))),
      desc: 'Compute instances right-sizing & reservations'
    },
    { 
      name: 'RDS', 
      current: 14500, 
      simulated: Math.round(14500 * Math.min(1.15, Math.max(0.7, ratio * 0.95))),
      desc: 'Multi-AZ Database serverless scaling'
    },
    { 
      name: 'S3', 
      current: 6000, 
      simulated: Math.round(6000 * Math.min(1.3, Math.max(0.45, ratio * 0.85))),
      desc: 'Standard-IA & Glacier lifecycle tiering'
    },
    { 
      name: 'Lambda', 
      current: 3000, 
      simulated: Math.round(3000 * ratio),
      desc: 'Serverless invocation duration & memory limits'
    },
    { 
      name: 'Other', 
      current: 3000, 
      simulated: Math.round(1800 * ratio),
      desc: 'NAT Gateways, CloudWatch & Route 53'
    },
  ];

  // Large chart scaling: max bar height 240px
  const maxVal = 26000;
  const barMaxHeight = 220;

  const formatK = (val) => {
    if (val >= 1000) {
      const k = val / 1000;
      return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
    }
    return `₹${val}`;
  };

  const activeServiceData = services.find(s => s.name === selectedService) || services[0];
  const serviceDiff = activeServiceData.current - activeServiceData.simulated;

  return (
    <div className="sim-chart-card interactive-chart">
      <div className="sim-chart-header">
        <div>
          <h4 className="sim-chart-title">Cost Breakdown <span className="sim-chart-sub">(Monthly)</span></h4>
          <span className="sim-interactive-hint">Click any service bar to inspect service-level savings</span>
        </div>
        <div className="sim-chart-legend">
          <span className="legend-item">
            <span className="legend-box purple" /> Current
          </span>
          <span className="legend-item">
            <span className="legend-box green" /> Simulated
          </span>
        </div>
      </div>

      {/* Interactive Service Detail Banner */}
      <div className="sim-active-month-pill">
        <span className="active-pill-month">{activeServiceData.name}:</span>
        <span className="active-pill-item cur">Current: <strong>₹{activeServiceData.current.toLocaleString('en-IN')}</strong></span>
        <span className="active-pill-item sim">Simulated: <strong>₹{activeServiceData.simulated.toLocaleString('en-IN')}</strong></span>
        <span className="active-pill-diff">
          {serviceDiff >= 0 ? `Save ₹${serviceDiff.toLocaleString('en-IN')}/mo` : `+₹${Math.abs(serviceDiff).toLocaleString('en-IN')}/mo`}
        </span>
      </div>

      {/* Much Larger Bar Area with Interactive Hover & Clicks */}
      <div className="sim-breakdown-bars-area large-bars-area">
        {services.map((s) => {
          const curHeight = Math.max(16, (s.current / maxVal) * barMaxHeight);
          const simHeight = Math.max(16, (s.simulated / maxVal) * barMaxHeight);
          const isSelected = selectedService === s.name;

          return (
            <div 
              key={s.name} 
              className={`sim-bar-group-col clickable-bar-group ${isSelected ? 'active-group' : ''}`}
              onClick={() => setSelectedService(s.name)}
            >
              <div className="sim-bar-pair-wrapper large-wrapper">
                {/* Current Bar */}
                <div className="sim-single-bar-col">
                  <span className={`sim-bar-val-label ${isSelected ? 'highlight' : ''}`}>
                    {formatK(s.current)}
                  </span>
                  <div
                    className="sim-bar-pill current-pill large-pill"
                    style={{ height: `${curHeight}px` }}
                  />
                </div>

                {/* Simulated Bar */}
                <div className="sim-single-bar-col">
                  <span className={`sim-bar-val-label ${isSelected ? 'highlight green' : ''}`}>
                    {formatK(s.simulated)}
                  </span>
                  <div
                    className="sim-bar-pill simulated-pill large-pill"
                    style={{ height: `${simHeight}px` }}
                  />
                </div>
              </div>

              {/* Service Label */}
              <span className={`sim-bar-category-name ${isSelected ? 'selected-name' : ''}`}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CostBreakdownChart;
