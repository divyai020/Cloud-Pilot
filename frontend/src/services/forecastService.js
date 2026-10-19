import demoData from '../data/demoData';

/**
 * Forecast Service Layer
 * Computes dynamic recent dates relative to today's date so data is always current.
 * Designed to consume local demoData now, and seamlessly connect
 * to FastAPI backend (`GET /api/forecast`) in Phase 9.
 */

// Helper to format date offset by N days relative to today
const formatDateRel = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
};

export const getForecastData = async (horizon = '30d') => {
  const baseMonthlyCost = demoData.summary.monthlyCost || 48500;
  
  // Format current timestamp
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Build Horizon-Specific Datasets with Dynamic Current Dates
  let chartData = [];
  let summaryMetrics = {};
  let drivers = [];
  let insight = "";
  let confidence = {};

  if (horizon === '7d') {
    // 7-Day Horizon Data (Recent Daily Telemetry)
    chartData = [
      { date: formatDateRel(-6), historical: 1450, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-5), historical: 1520, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-4), historical: 1480, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-3), historical: 1610, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-2), historical: 1590, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-1), historical: 1640, predicted: null, lower: null, upper: null },
      { date: `${formatDateRel(0)} (Today)`, historical: 1660, predicted: 1660, lower: 1660, upper: 1660, isToday: true },
      { date: formatDateRel(1), historical: null, predicted: 1690, lower: 1640, upper: 1740 },
      { date: formatDateRel(2), historical: null, predicted: 1720, lower: 1660, upper: 1780 },
      { date: formatDateRel(3), historical: null, predicted: 1750, lower: 1680, upper: 1820 },
      { date: formatDateRel(4), historical: null, predicted: 1780, lower: 1700, upper: 1860 },
      { date: formatDateRel(5), historical: null, predicted: 1810, lower: 1720, upper: 1900 },
      { date: formatDateRel(6), historical: null, predicted: 1840, lower: 1740, upper: 1940 },
      { date: formatDateRel(7), historical: null, predicted: 1870, lower: 1760, upper: 1980 }
    ];

    summaryMetrics = {
      label: 'Expected 7-Day Cost',
      amount: 12460,
      changePercent: 4.8,
      changeDirection: 'up',
      periodComparison: 'vs last 7 days'
    };

    confidence = {
      score: 92,
      level: 'Very High Confidence',
      badgeColor: 'green',
      description: 'Short-term forecast exhibits minimal variance based on consistent recent daily workload patterns.'
    };

    insight = 'Short-term spending shows a steady 4.8% increase over the next 7 days, primarily driven by temporary EC2 compute scaling during peak processing windows.';

    drivers = [
      { service: 'EC2 Compute', key: 'EC2', current: 7200, predicted: 7650, change: 6.25, recommendation: 'Review Capacity', path: '/cost-optimization?service=EC2' },
      { service: 'RDS Databases', key: 'RDS', current: 3400, predicted: 3490, change: 2.65, recommendation: 'Monitor DB Growth', path: '/cost-optimization?service=RDS' },
      { service: 'S3 Storage', key: 'S3', current: 1100, predicted: 1140, change: 3.64, recommendation: 'Optimize Storage', path: '/cost-optimization?service=S3' },
      { service: 'Lambda Functions', key: 'Lambda', current: 760, predicted: 780, change: 2.63, recommendation: 'Monitor Invocations', path: '/cost-optimization?service=Lambda' }
    ];

  } else if (horizon === '90d') {
    // 90-Day Horizon Data (Long-Term Dynamic Horizon)
    chartData = [
      { date: formatDateRel(-90), historical: 33000, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-60), historical: 37000, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-30), historical: 41000, predicted: null, lower: null, upper: null },
      { date: `${formatDateRel(0)} (Today)`, historical: 48500, predicted: 48500, lower: 48500, upper: 48500, isToday: true },
      { date: formatDateRel(30), historical: null, predicted: 52800, lower: 49500, upper: 56100 },
      { date: formatDateRel(60), historical: null, predicted: 58200, lower: 53500, upper: 62900 },
      { date: formatDateRel(90), historical: null, predicted: 64500, lower: 58000, upper: 71000 }
    ];

    summaryMetrics = {
      label: 'Expected 90-Day Horizon Cost',
      amount: 175500,
      changePercent: 18.2,
      changeDirection: 'up',
      periodComparison: 'vs previous 90 days'
    };

    confidence = {
      score: 78,
      level: 'Moderate Confidence',
      badgeColor: 'orange',
      description: 'Longer time horizons introduce uncertainty from planned seasonal expansion and storage accumulation.'
    };

    insight = 'Quarterly trajectory projects an 18.2% cost growth if current scaling rates persist. Database storage and unoptimized S3 backups are the largest compounding cost drivers.';

    drivers = [
      { service: 'EC2 Compute', key: 'EC2', current: 22000, predicted: 28500, change: 29.5, recommendation: 'Review Capacity', path: '/cost-optimization?service=EC2' },
      { service: 'RDS Databases', key: 'RDS', current: 14500, predicted: 18900, change: 30.3, recommendation: 'Optimize DB Tier', path: '/cost-optimization?service=RDS' },
      { service: 'S3 Storage', key: 'S3', current: 6000, predicted: 8200, change: 36.7, recommendation: 'Lifecycle Rules', path: '/cost-optimization?service=S3' },
      { service: 'Lambda Functions', key: 'Lambda', current: 3000, predicted: 3900, change: 30.0, recommendation: 'Concurrency Limits', path: '/cost-optimization?service=Lambda' },
      { service: 'Other Infrastructure', key: 'Other', current: 3000, predicted: 3400, change: 13.3, recommendation: 'View Cost Analysis', path: '/cost-optimization' }
    ];

  } else {
    // 30-Day Horizon Data (Default - Dynamic Recent Dates)
    chartData = [
      { date: formatDateRel(-60), historical: 31000, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-45), historical: 34000, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-30), historical: 37000, predicted: null, lower: null, upper: null },
      { date: formatDateRel(-15), historical: 41000, predicted: null, lower: null, upper: null },
      { date: `${formatDateRel(0)} (Today)`, historical: 48500, predicted: 48500, lower: 48500, upper: 48500, isToday: true },
      { date: formatDateRel(10), historical: null, predicted: 50800, lower: 48900, upper: 52700 },
      { date: formatDateRel(20), historical: null, predicted: 52850, lower: 50200, upper: 55500 },
      { date: formatDateRel(30), historical: null, predicted: 54500, lower: 51200, upper: 57800 }
    ];

    summaryMetrics = {
      label: 'Expected 30-Day Cost',
      amount: 52850,
      changePercent: 12.4,
      changeDirection: 'up',
      periodComparison: 'vs last 30 days'
    };

    confidence = {
      score: 87,
      level: 'High Confidence',
      badgeColor: 'green',
      description: 'Based on consistent historical spending patterns and relatively stable recent resource behavior.'
    };

    insight = 'Cloud spending shows an upward trend (+12.4%) primarily driven by compute and database usage. Reviewing underutilized EC2 instances and setting lifecycle policies on S3 buckets can mitigate projected cost increases.';

    drivers = [
      { service: 'Compute / EC2', key: 'EC2', current: 22000, predicted: 26400, change: 20.0, recommendation: 'Review Capacity', path: '/cost-optimization?service=EC2' },
      { service: 'Databases / RDS', key: 'RDS', current: 14500, predicted: 15200, change: 4.8, recommendation: 'Monitor DB Growth', path: '/cost-optimization?service=RDS' },
      { service: 'Object Storage / S3', key: 'S3', current: 6000, predicted: 6500, change: 8.3, recommendation: 'Optimize Storage', path: '/cost-optimization?service=S3' },
      { service: 'Serverless / Lambda', key: 'Lambda', current: 3000, predicted: 3150, change: 5.0, recommendation: 'Monitor Execution', path: '/cost-optimization?service=Lambda' },
      { service: 'Other Infrastructure', key: 'Other', current: 3000, predicted: 3050, change: 1.7, recommendation: 'View Cost Analysis', path: '/cost-optimization' }
    ];
  }

  return {
    horizon,
    summaryMetrics,
    confidence,
    insight,
    chartData,
    drivers,
    metadata: {
      dataSource: 'Demo Environment',
      lastAnalyzed: `Today at ${timeString}`,
      modelName: 'Scikit-learn (Ridge Regression + Exponential Smoothing)',
      historicalWindow: '90 Days',
      predictionHorizon: horizon
    }
  };
};
