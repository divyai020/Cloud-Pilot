import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ForecastHeader from '../components/forecast/ForecastHeader';
import CostTrajectoryChart from '../components/forecast/CostTrajectoryChart';
import ForecastSummaryCard from '../components/forecast/ForecastSummaryCard';
import ForecastConfidenceCard from '../components/forecast/ForecastConfidenceCard';
import ForecastInsight from '../components/forecast/ForecastInsight';
import CostDriversTable from '../components/forecast/CostDriversTable';
import ForecastMethodology from '../components/forecast/ForecastMethodology';
import ForecastSkeleton from '../components/forecast/ForecastSkeleton';
import ForecastEmptyState from '../components/forecast/ForecastEmptyState';
import ForecastErrorState from '../components/forecast/ForecastErrorState';
import { getForecastData } from '../services/forecastService';

const Forecast = () => {
  const [horizon, setHorizon] = useState('30d'); // '7d' | '30d' | '90d'
  const [dataSource, setDataSource] = useState('Demo Environment'); // 'Demo Environment' | 'AWS Account' | 'Uploaded Cloud Data'
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [forecastData, setForecastData] = useState(null);

  // Load forecast data when horizon changes
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getForecastData(horizon);
        if (isMounted) {
          setForecastData(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to calculate cost trajectory forecast.');
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [horizon]);

  // Handle recalculate / refresh trigger
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getForecastData(horizon);
      setForecastData(data);
    } catch (err) {
      setError('Could not refresh ML model calculations.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main forecast-page-main">
        <ForecastHeader 
          horizon={horizon}
          setHorizon={setHorizon}
          metadata={forecastData?.metadata}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          dataSource={dataSource}
          setDataSource={setDataSource}
        />

        {/* Dynamic State Rendering */}
        {isLoading ? (
          <ForecastSkeleton />
        ) : error ? (
          <ForecastErrorState errorMsg={error} onRetry={handleRefresh} />
        ) : isEmpty ? (
          <ForecastEmptyState onTryDemo={() => { setIsEmpty(false); setDataSource('Demo Environment'); }} />
        ) : (
          <div className="forecast-content-body">
            {/* Top Grid: Chart on Left, KPIs on Right */}
            <div className="forecast-main-grid">
              <div className="chart-column">
                <CostTrajectoryChart chartData={forecastData?.chartData || []} />
              </div>

              <div className="kpi-column">
                <ForecastSummaryCard summaryMetrics={forecastData?.summaryMetrics} />
                <ForecastConfidenceCard confidence={forecastData?.confidence} />
              </div>
            </div>

            {/* AI Forecast Insight */}
            <div className="forecast-section mt-4">
              <ForecastInsight 
                insight={forecastData?.insight} 
                horizon={horizon} 
              />
            </div>

            {/* Cost Drivers Breakdown Table */}
            <div className="forecast-section mt-4">
              <CostDriversTable 
                drivers={forecastData?.drivers || []} 
                horizon={horizon} 
              />
            </div>

            {/* Methodology & Explainability */}
            <div className="forecast-section mt-4 mb-6">
              <ForecastMethodology metadata={forecastData?.metadata} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forecast;
