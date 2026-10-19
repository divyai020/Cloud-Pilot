import React from 'react';
import { AlertOctagon, RefreshCw, ServerCrash } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForecastErrorState = ({ errorMsg, onRetry }) => {
  return (
    <div className="forecast-state-card">
      <div className="state-icon-wrapper red">
        <ServerCrash size={32} color="#EF4444" />
      </div>
      <h3 className="state-title">Forecast Generation Unavailable</h3>
      <p className="state-description">
        {errorMsg || "We couldn't compute the predictive cost horizon right now. Please verify your connection to the cloud telemetry data."}
      </p>

      <div className="state-actions">
        <button className="btn-primary-sm" onClick={onRetry}>
          <RefreshCw size={16} className="mr-2" /> Retry Forecast Model
        </button>
        <Link to="/cost-optimization" className="btn-secondary-sm">
          View Current Cost Optimization Data
        </Link>
      </div>
    </div>
  );
};

export default ForecastErrorState;
