import React from 'react';
import { Clock, Database, RefreshCw, AlertCircle } from 'lucide-react';

const ForecastHeader = ({ 
  horizon, 
  setHorizon, 
  metadata, 
  onRefresh, 
  isRefreshing, 
  dataSource, 
  setDataSource 
}) => {
  return (
    <div className="forecast-header-container">
      <div className="forecast-header-top">
        <div>
          <div className="forecast-title-row">
            <h1 className="dashboard-title">Predictive Cost Horizon</h1>
            <div className="forecast-badges">
              <span className={`forecast-source-badge ${dataSource === 'Demo Environment' ? 'badge-demo' : 'badge-aws'}`}>
                <Database size={13} />
                <span>Data Source: {dataSource}</span>
              </span>
              <span className="forecast-time-badge">
                <Clock size={13} />
                <span>Last analyzed: {metadata?.lastAnalyzed || 'Just now'}</span>
              </span>
            </div>
          </div>
          <p className="dashboard-subtitle">
            AI-driven analysis of historical cloud spending to forecast future infrastructure costs based on current deployment trends.
          </p>
        </div>

        <div className="forecast-header-controls">
          {/* Horizon Selector */}
          <div className="horizon-selector">
            <button
              className={`horizon-btn ${horizon === '7d' ? 'active' : ''}`}
              onClick={() => setHorizon('7d')}
            >
              7 Days
            </button>
            <button
              className={`horizon-btn ${horizon === '30d' ? 'active' : ''}`}
              onClick={() => setHorizon('30d')}
            >
              30 Days
            </button>
            <button
              className={`horizon-btn ${horizon === '90d' ? 'active' : ''}`}
              onClick={() => setHorizon('90d')}
            >
              90 Days
            </button>
          </div>

          <button 
            className="btn-secondary-sm forecast-refresh-btn" 
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Forecast model calculations"
          >
            <RefreshCw size={15} className={`mr-1 ${isRefreshing ? 'spin' : ''}`} />
            {isRefreshing ? 'Analyzing...' : 'Recalculate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForecastHeader;
