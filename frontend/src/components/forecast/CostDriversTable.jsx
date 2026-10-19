import React from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Zap, 
  Layers, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sliders
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const getServiceIcon = (key) => {
  switch(key) {
    case 'EC2': return <Server size={18} color="#6366F1" />;
    case 'RDS': return <Database size={18} color="#10B981" />;
    case 'S3': return <HardDrive size={18} color="#3B82F6" />;
    case 'Lambda': return <Zap size={18} color="#F59E0B" />;
    default: return <Layers size={18} color="#94A3B8" />;
  }
};

const CostDriversTable = ({ drivers, horizon }) => {
  const navigate = useNavigate();

  const getHorizonLabel = () => {
    if (horizon === '7d') return '7d';
    if (horizon === '90d') return '90d';
    return '30d';
  };

  return (
    <div className="cost-drivers-card">
      <div className="drivers-card-header">
        <div className="drivers-header-left">
          <div className="chart-icon-box">
            <Layers size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="drivers-title">Cost Drivers Breakdown</h3>
            <p className="drivers-subtitle">
              Service-level allocation comparing current monthly baseline to projected {getHorizonLabel()} horizon
            </p>
          </div>
        </div>

        <Link to="/cost-optimization" className="drivers-view-all">
          <span>View Full Analysis</span>
          <ArrowUpRight size={16} className="ml-1" />
        </Link>
      </div>

      <div className="drivers-table-wrapper">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>Service Segment</th>
              <th className="text-right">Current Spend</th>
              <th className="text-right">Predicted ({getHorizonLabel()})</th>
              <th className="text-center">Variance</th>
              <th className="text-center">AI Recommendation</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((row, idx) => {
              const isUp = row.change > 0;
              const isDown = row.change < 0;
              const isSignificant = Math.abs(row.change) >= 10;

              return (
                <tr key={idx} className="driver-row">
                  <td className="service-cell">
                    <div className="service-icon-wrapper">
                      {getServiceIcon(row.key)}
                    </div>
                    <span className="service-name">{row.service}</span>
                  </td>

                  <td className="text-right font-medium">
                    ₹{row.current.toLocaleString('en-IN')}
                  </td>

                  <td className="text-right font-semibold text-purple">
                    ₹{row.predicted.toLocaleString('en-IN')}
                  </td>

                  <td className="text-center">
                    <span className={`variance-badge ${
                      isUp && isSignificant ? 'var-high-up' : isUp ? 'var-up' : isDown ? 'var-down' : 'var-neutral'
                    }`}>
                      {isUp && <TrendingUp size={13} className="mr-1" />}
                      {isDown && <TrendingDown size={13} className="mr-1" />}
                      {!isUp && !isDown && <Minus size={13} className="mr-1" />}
                      {isUp ? '+' : ''}{row.change}%
                    </span>
                  </td>

                  <td className="text-center">
                    <span className="recommendation-pill">
                      {row.recommendation}
                    </span>
                  </td>

                  <td className="text-right">
                    <div className="action-btn-group">
                      <button 
                        className="btn-driver-action"
                        onClick={() => navigate(row.path || '/cost-optimization')}
                        title="View Optimization details"
                      >
                        View Optimization
                      </button>
                      <button
                        className="btn-driver-sim"
                        onClick={() => navigate('/simulator')}
                        title="Simulate impact on Simulator"
                      >
                        <Sliders size={13} />
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

export default CostDriversTable;
