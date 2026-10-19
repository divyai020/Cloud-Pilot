import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Tag, HardDrive, Zap } from 'lucide-react';

const ScenarioPresets = ({ onApplyPreset, activePresetKey }) => {
  const presets = [
    {
      key: 'ai-recommended',
      title: 'AI Recommended Optimization',
      badge: 'Recommended',
      badgeClass: 'badge-purple',
      icon: <Sparkles size={16} color="var(--accent-purple)" />,
      desc: 'Downsize idle EC2 instance (t3.large → t3.medium) & apply S3 Infrequent Access storage tier.',
      impact: '−₹5,600/mo (−11.5%)'
    },
    {
      key: 'scale-growth',
      title: 'Scale for Growth (+50% Traffic)',
      badge: 'Growth Plan',
      badgeClass: 'badge-orange',
      icon: <TrendingUp size={16} color="#F59E0B" />,
      desc: 'Increase EC2 instance count from 2 to 4 and expand RDS storage capacity to handle peak load.',
      impact: '+₹11,400/mo (+23.5%)'
    },
    {
      key: 'aggressive-cut',
      title: 'Aggressive Waste Reduction',
      badge: 'Max Savings',
      badgeClass: 'badge-green',
      icon: <TrendingDown size={16} color="#10B981" />,
      desc: 'Downsize EC2 to t3.small, move S3 to Glacier Deep Archive, and remove redundant secondary server.',
      impact: '−₹8,900/mo (−18.3%)'
    },
    {
      key: 'reserved-model',
      title: '1-Year Reserved Instance Commit',
      badge: '30% Off',
      badgeClass: 'badge-blue',
      icon: <Tag size={16} color="#3B82F6" />,
      desc: 'Lock in 1-Year Reserved Instance pricing model across all EC2 and RDS instances.',
      impact: '−₹6,400/mo (−13.2%)'
    }
  ];

  return (
    <div className="scenario-presets-card">
      <div className="presets-header">
        <div className="env-title-group">
          <div className="chart-icon-box">
            <Sparkles size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="card-title">One-Click Scenario Presets</h3>
            <p className="card-subtitle">Load pre-configured cloud governance architectures</p>
          </div>
        </div>
      </div>

      <div className="presets-grid">
        {presets.map((p) => {
          const isActive = activePresetKey === p.key;

          return (
            <div 
              key={p.key} 
              className={`preset-card ${isActive ? 'active-preset' : ''}`}
              onClick={() => onApplyPreset(p.key)}
            >
              <div className="preset-top-row">
                <div className="preset-title-group">
                  <div className="preset-icon">{p.icon}</div>
                  <h4 className="preset-title">{p.title}</h4>
                </div>
                <span className={`preset-badge ${p.badgeClass}`}>{p.badge}</span>
              </div>

              <p className="preset-desc">{p.desc}</p>

              <div className="preset-footer">
                <span className="impact-label">Estimated Impact:</span>
                <span className="impact-val">{p.impact}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioPresets;
