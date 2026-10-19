import React from 'react';

const ForecastSkeleton = () => {
  return (
    <div className="forecast-skeleton-container">
      {/* Header skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="forecast-main-grid mt-4">
        <div className="skeleton-card chart-skeleton-card">
          <div className="skeleton-line skeleton-chart-header"></div>
          <div className="skeleton-box skeleton-chart-area"></div>
        </div>

        <div className="forecast-side-cards">
          <div className="skeleton-card kpi-skeleton-card">
            <div className="skeleton-line w-40"></div>
            <div className="skeleton-line w-60 h-8 mt-2"></div>
            <div className="skeleton-line w-30 mt-2"></div>
          </div>
          <div className="skeleton-card kpi-skeleton-card mt-3">
            <div className="skeleton-line w-40"></div>
            <div className="skeleton-line w-50 h-8 mt-2"></div>
            <div className="skeleton-line w-80 mt-2"></div>
          </div>
        </div>
      </div>

      {/* Insight skeleton */}
      <div className="skeleton-card skeleton-insight-card mt-4">
        <div className="skeleton-line w-full"></div>
      </div>

      {/* Table skeleton */}
      <div className="skeleton-card skeleton-table-card mt-4">
        <div className="skeleton-line w-40 mb-3"></div>
        <div className="skeleton-box h-40"></div>
      </div>
    </div>
  );
};

export default ForecastSkeleton;
