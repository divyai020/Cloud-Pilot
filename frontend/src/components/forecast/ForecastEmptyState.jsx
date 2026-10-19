import React from 'react';
import { Database, AlertCircle, Upload, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForecastEmptyState = ({ onTryDemo }) => {
  return (
    <div className="forecast-state-card">
      <div className="state-icon-wrapper yellow">
        <AlertCircle size={32} color="#F59E0B" />
      </div>
      <h3 className="state-title">Not Enough Historical Data</h3>
      <p className="state-description">
        Cloud Pilot requires at least 7 to 30 days of historical spending telemetry to compute a predictive ML cost horizon with statistical confidence.
      </p>

      <div className="state-requirements-box">
        <h5 className="req-title">Required telemetry criteria:</h5>
        <ul>
          <li>• Continuous AWS Cost Explorer billing metrics</li>
          <li>• Active EC2 & RDS resource utilization history</li>
          <li>• Minimum of 7 observations across major services</li>
        </ul>
      </div>

      <div className="state-actions">
        <Link to="/setup" className="btn-primary-sm">
          <Upload size={16} className="mr-2" /> Connect AWS / Upload CSV
        </Link>
        {onTryDemo && (
          <button className="btn-secondary-sm" onClick={onTryDemo}>
            <PlayCircle size={16} className="mr-2" /> Load Demo Data Environment
          </button>
        )}
      </div>
    </div>
  );
};

export default ForecastEmptyState;
