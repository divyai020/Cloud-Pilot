import api from './api';
import demoData from '../data/demoData';

/**
 * Dashboard Service — fetches real data from FastAPI backend.
 * Falls back gracefully to demoData if backend is unavailable or data is invalid.
 */

const shouldUseLocalOrUploadedData = () => {
  const source = localStorage.getItem('cloudpilot_data_source');
  if (source === 'uploaded') return true;
  return !localStorage.getItem('cloudpilot_token');
};

export const getDashboardSummary = async () => {
  if (shouldUseLocalOrUploadedData()) return demoData.summary;
  try {
    const res = await api.get('/dashboard/summary');
    const d = res.data;
    if (!d) return demoData.summary;

    return {
      cloudHealthScore: d.healthScore ?? demoData.summary.cloudHealthScore,
      monthlyCost: d.monthlyCost ?? demoData.summary.monthlyCost,
      potentialSavings: d.totalEstimatedSavings ?? demoData.summary.potentialSavings,
      securityIssues: typeof d.securityFindings === 'object' && d.securityFindings !== null
        ? Object.values(d.securityFindings).reduce((a, b) => a + Number(b), 0)
        : (d.securityIssues ?? demoData.summary.securityIssues),
      activeResources: d.totalResources ?? demoData.summary.activeResources,
      ...d
    };
  } catch (err) {
    console.warn('Dashboard summary fetch failed, using fallback:', err);
    return demoData.summary;
  }
};

export const getCostTrend = async () => {
  if (shouldUseLocalOrUploadedData()) return demoData.costTrend;
  try {
    const res = await api.get('/dashboard/cost-trend');
    const raw = res.data?.trend || res.data?.data || res.data;
    if (Array.isArray(raw) && raw.length > 0) {
      // Map period -> month for Recharts if needed
      return raw.map(item => ({
        month: item.period || item.month || 'Month',
        cost: Number(item.cost || 0),
      }));
    }
    return demoData.costTrend;
  } catch (err) {
    console.warn('Cost trend fetch failed, using fallback:', err);
    return demoData.costTrend;
  }
};

export const getSecuritySummary = async () => {
  // If backend only returns aggregate counts, fallback to demoData list for the cards
  if (shouldUseLocalOrUploadedData()) return demoData.securityFindings;
  try {
    // Keep individual finding items from demoData or uploaded data for UI list display
    return demoData.securityFindings;
  } catch (err) {
    return demoData.securityFindings;
  }
};

export const getRecommendations = async () => {
  if (shouldUseLocalOrUploadedData()) return demoData.recommendations;
  try {
    const res = await api.get('/dashboard/recommendations');
    const list = res.data?.recommendations;
    if (Array.isArray(list) && list.length > 0) {
      return list.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        estimatedSavings: item.estimatedSavings || 0,
        resource: item.resource,
        priority: item.priority,
      }));
    }
    return demoData.recommendations;
  } catch (err) {
    console.warn('Recommendations fetch failed, using fallback:', err);
    return demoData.recommendations;
  }
};

export const getCostForecast = async () => {
  if (shouldUseLocalOrUploadedData()) return null;
  try {
    const res = await api.get('/dashboard/cost-forecast');
    return res.data;
  } catch {
    return null;
  }
};

export const getCloudHealthScore = async () => {
  if (shouldUseLocalOrUploadedData()) return null;
  try {
    const res = await api.get('/dashboard/health');
    return res.data;
  } catch {
    return null;
  }
};
