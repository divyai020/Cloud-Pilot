import React from 'react';
import { Server, Database, HardDrive, Zap, Layers, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const getServiceIcon = (key) => {
  switch(key) {
    case 'EC2': return <Server size={16} color="#6366F1" />;
    case 'RDS': return <Database size={16} color="#10B981" />;
    case 'S3': return <HardDrive size={16} color="#3B82F6" />;
    case 'Lambda': return <Zap size={16} color="#F59E0B" />;
    default: return <Layers size={16} color="#94A3B8" />;
  }
};

const CostBreakdownTable = ({ serviceBreakdown }) => {
  const services = Object.keys(serviceBreakdown || {});

  return (
    <div className="cost-breakdown-card">
      <div className="card-header-row">
        <div className="env-title-group">
          <div className="chart-icon-box">
            <Layers size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="card-title">Service-Level Cost Breakdown</h3>
            <p className="card-subtitle">Comparing baseline vs simulated monthly spend across cloud services</p>
          </div>
        </div>
      </div>

      <div className="drivers-table-wrapper mt-3">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>Service Segment</th>
              <th className="text-right">Current Spend</th>
              <th className="text-right">Simulated Spend</th>
              <th className="text-right">Net Variance</th>
              <th className="text-center">Trend Indicator</th>
            </tr>
          </thead>
          <tbody>
            {services.map((key) => {
              const item = serviceBreakdown[key] || { current: 0, simulated: 0 };
              const diff = item.simulated - item.current;
              const isUp = diff > 0;
              const isDown = diff < 0;

              return (
                <tr key={key} className="driver-row">
                  <td className="service-cell">
                    <div className="service-icon-wrapper">
                      {getServiceIcon(key)}
                    </div>
                    <span className="service-name">{key === 'EC2' ? 'Compute / EC2' : key === 'RDS' ? 'Databases / RDS' : key === 'S3' ? 'Storage / S3' : key === 'Lambda' ? 'Serverless / Lambda' : 'Other Infrastructure'}</span>
                  </td>

                  <td className="text-right font-medium">
                    ₹{item.current.toLocaleString('en-IN')}
                  </td>

                  <td className="text-right font-semibold text-purple">
                    ₹{item.simulated.toLocaleString('en-IN')}
                  </td>

                  <td className={`text-right font-bold ${isDown ? 'text-green' : isUp ? 'text-orange' : 'text-muted'}`}>
                    {isDown ? `−₹${Math.abs(diff).toLocaleString('en-IN')}` : isUp ? `+₹${diff.toLocaleString('en-IN')}` : '₹0'}
                  </td>

                  <td className="text-center">
                    <span className={`variance-badge ${isUp ? 'var-up' : isDown ? 'var-down' : 'var-neutral'}`}>
                      {isUp && <TrendingUp size={13} className="mr-1" />}
                      {isDown && <TrendingDown size={13} className="mr-1" />}
                      {!isUp && !isDown && <Minus size={13} className="mr-1" />}
                      {isDown ? `Save ${Math.round((Math.abs(diff)/item.current)*100)}%` : isUp ? `+${Math.round((diff/item.current)*100)}%` : 'No Change'}
                    </span>
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

export default CostBreakdownTable;
