import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  PiggyBank, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  ArrowRight,
  Server,
  Bell,
  Sparkles,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import demoData from '../data/demoData';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';
import { 
  getDashboardSummary, 
  getCostTrend, 
  getRecommendations, 
  getSecuritySummary 
} from '../services/dashboardService';
import { exportExecutiveReportPDF } from '../services/pdfExportService';
import { sendDiscordAlert } from '../services/alertService';
import { CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const [chartPeriod, setChartPeriod] = useState('Monthly');
  const [summary, setSummary] = useState(demoData.summary);
  const [costTrend, setCostTrend] = useState(demoData.costTrend);
  const [recommendations, setRecommendations] = useState(demoData.recommendations);
  const [securityFindings, setSecurityFindings] = useState(demoData.securityFindings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null);
  const resourceUtilization = demoData.resourceUtilization;

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportExecutiveReportPDF({
        summary,
        costTrend,
        recommendations,
        securityFindings,
        accountName: 'Production AWS (ap-south-1)',
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const handleSendDiscordAlert = async () => {
    setIsSendingAlert(true);
    setAlertStatus(null);
    try {
      await sendDiscordAlert({
        accountName: 'FinTech Enterprise Production Cloud',
        cloudProvider: 'AWS (ap-south-1 Mumbai)',
        healthScore: summary?.cloudHealthScore ?? 61,
        monthlyCost: Number(summary?.monthlyCost) || 115400,
        potentialSavings: Number(summary?.potentialSavings) || 32800,
        securityIssues: summary?.securityIssues ?? 7,
      });
      setAlertStatus({ type: 'success', message: 'Live incident alert delivered to your Discord channel!' });
      setTimeout(() => setAlertStatus(null), 4500);
    } catch (err) {
      console.error('Discord dispatch failed:', err);
      setAlertStatus({ type: 'error', message: err.message || 'Failed to dispatch alert to Discord' });
      setTimeout(() => setAlertStatus(null), 4500);
    } finally {
      setIsSendingAlert(false);
    }
  };

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const [sum, trend, recs, sec] = await Promise.all([
        getDashboardSummary(),
        getCostTrend(),
        getRecommendations(),
        getSecuritySummary()
      ]);
      if (sum) setSummary(sum);
      if (trend && Array.isArray(trend)) setCostTrend(trend);
      if (recs && Array.isArray(recs)) setRecommendations(recs);
      if (sec && Array.isArray(sec)) setSecurityFindings(sec);
    } catch (err) {
      console.warn('Dashboard sync fallback to local demo data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getChartData = () => {
    if (chartPeriod === 'Daily') {
      return Array.from({ length: 7 }).map((_, i) => ({ month: `Day ${i+1}`, cost: 48000 + Math.floor(Math.random() * 1500) }));
    }
    if (chartPeriod === 'Weekly') {
      return Array.from({ length: 4 }).map((_, i) => ({ month: `Week ${i+1}`, cost: 45000 + i * 1000 }));
    }
    return costTrend;
  };

  const safeRecommendations = Array.isArray(recommendations) && recommendations.length > 0 
    ? recommendations 
    : demoData.recommendations;

  const safeSecurityFindings = Array.isArray(securityFindings) && securityFindings.length > 0 
    ? securityFindings 
    : demoData.securityFindings;

  const topRecommendations = safeRecommendations.slice(0, 3);
  
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'var(--danger-color, #ef4444)';
      case 'High': return 'var(--warning-color, #f59e0b)';
      case 'Medium': return 'var(--info-color, #eab308)';
      default: return 'var(--text-secondary)';
    }
  };

  const getSeverityBg = (severity) => {
    switch(severity) {
      case 'Critical': return 'rgba(239, 68, 68, 0.1)';
      case 'High': return 'rgba(245, 158, 11, 0.1)';
      case 'Medium': return 'rgba(234, 179, 8, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">An intelligent overview of your cloud environment.</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary-sm" 
              onClick={handleSendDiscordAlert} 
              disabled={isSendingAlert}
              title="Dispatch live incident notification to Discord channel"
              style={{ 
                borderColor: 'rgba(88, 101, 242, 0.4)', 
                background: 'rgba(88, 101, 242, 0.08)',
                color: '#c7d2fe'
              }}
            >
              {isSendingAlert ? (
                <><Loader2 size={16} className="mr-2 spin-icon" /> Sending to Discord...</>
              ) : (
                <><Bell size={16} className="mr-2" color="#5865F2" /> Dispatch Discord Alert</>
              )}
            </button>
            <button className="btn-secondary-sm" onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? (
                <><Loader2 size={16} className="mr-2 spin-icon" /> Generating PDF...</>
              ) : (
                <><Download size={16} className="mr-2" /> Export Report</>
              )}
            </button>
            <button className="btn-primary-sm" onClick={loadData} disabled={isSyncing}>
              {isSyncing ? (
                <><Loader2 size={16} className="mr-2 spin-icon" /> Syncing...</>
              ) : (
                <><RefreshCw size={16} className="mr-2" /> Sync Now</>
              )}
            </button>
          </div>
        </header>

        {alertStatus && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              background: alertStatus.type === 'success' ? 'rgba(88, 101, 242, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${alertStatus.type === 'success' ? 'rgba(88, 101, 242, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: alertStatus.type === 'success' ? '#a5b4fc' : '#f87171',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <CheckCircle2 size={16} color={alertStatus.type === 'success' ? '#818cf8' : '#ef4444'} />
            <span style={{ fontWeight: 500 }}>{alertStatus.message}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <span className="kpi-badge text-green">+2% from last week</span>
            </div>
            <div className="kpi-label">CLOUD HEALTH SCORE</div>
            <div className="kpi-value">{summary?.cloudHealthScore ?? 94}%</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(178, 141, 255, 0.1)' }}>
                <Wallet size={20} color="var(--accent-purple)" />
              </div>
              <span className="kpi-badge text-red">+5% vs last month</span>
            </div>
            <div className="kpi-label">MONTHLY COST</div>
            <div className="kpi-value">₹{(Number(summary?.monthlyCost) || 48500).toLocaleString('en-IN')}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <PiggyBank size={20} color="#10b981" />
              </div>
              <span className="kpi-badge text-green">{(recommendations?.length || 3)} opportunities</span>
            </div>
            <div className="kpi-label">POTENTIAL SAVINGS</div>
            <div className="kpi-value">₹{(Number(summary?.potentialSavings) || 13100).toLocaleString('en-IN')}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <ShieldAlert size={20} color="#ef4444" />
              </div>
              <span className="kpi-badge text-warning">2 Critical / 3 Warning</span>
            </div>
            <div className="kpi-label">SECURITY ISSUES</div>
            <div className="kpi-value">{summary?.securityIssues ?? 5} Active</div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="dashboard-middle-row">
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Cost Overview</h3>
                <p className="card-subtitle">Cloud spending across services</p>
              </div>
              <div className="chart-toggles">
                <button className={`toggle-btn ${chartPeriod === 'Daily' ? 'active' : ''}`} onClick={() => setChartPeriod('Daily')}>Daily</button>
                <button className={`toggle-btn ${chartPeriod === 'Weekly' ? 'active' : ''}`} onClick={() => setChartPeriod('Weekly')}>Weekly</button>
                <button className={`toggle-btn ${chartPeriod === 'Monthly' ? 'active' : ''}`} onClick={() => setChartPeriod('Monthly')}>Monthly</button>
              </div>
            </div>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="var(--accent-purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot bg-purple"></span>EC2 Instances</span>
              <span className="legend-item"><span className="legend-dot bg-blue"></span>RDS Databases</span>
              <span className="legend-item"><span className="legend-dot bg-green"></span>S3 Storage</span>
              <span className="legend-item"><span className="legend-dot bg-gray"></span>Other</span>
            </div>
            
            <Link to="/cost-optimization" className="card-footer-link">
              View Cost Analysis <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          <div className="dashboard-card util-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Resource Utilization</h3>
                <p className="card-subtitle">Identifying underutilized assets</p>
              </div>
            </div>
            
            <div className="utilization-list">
              {resourceUtilization.map((item, idx) => (
                <div key={idx} className="util-item">
                  <div className="util-item-header">
                    <span className="util-name">{item.resource}</span>
                    <span className="util-stat">
                      {item.utilization}% {item.utilization < 50 ? 'Underutilized' : 'Optimal'}
                    </span>
                  </div>
                  <div className="progress-bg">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${item.utilization}%`,
                        backgroundColor: item.utilization < 50 ? '#ef4444' : '#10b981'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/resources" className="btn-secondary-sm w-full flex-center mt-4" style={{ justifyContent: 'center' }}>
              View Resources <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="dashboard-bottom-row">
          <div className="dashboard-card rec-card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <Sparkles size={18} className="mr-2 text-purple" /> Top AI Recommendations
              </h3>
              <span className="badge-outline">3 High Priority</span>
            </div>
            
            <div className="recommendations-list">
              {topRecommendations.map((rec) => (
                <div key={rec.id} className="rec-item">
                  <div className="rec-icon">
                    <Server size={18} />
                  </div>
                  <div className="rec-content">
                    <h4 className="rec-title">{rec.title}</h4>
                    <p className="rec-desc">{rec.description}</p>
                  </div>
                  <div className="rec-actions">
                    <div className="rec-savings">
                      <span className="save-label">Save</span>
                      <span className="save-amount text-green">₹{(Number(rec.estimatedSavings) || 2400).toLocaleString('en-IN')}<span>/mo</span></span>
                    </div>
                    <button className="btn-primary-sm rec-btn">Review</button>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/assistant" className="card-footer-link">
              View All Recommendations <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          <div className="dashboard-card alerts-card">
            <div className="card-header">
              <h3 className="card-title">Active Alerts</h3>
              <Bell size={18} className="text-secondary" />
            </div>
            
            <div className="alerts-list">
              {safeSecurityFindings.slice(0, 3).map((alert) => (
                <div key={alert.id || alert.title} className="alert-item">
                  <div className="alert-header">
                    <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                      <ShieldAlert size={14} className="mr-1" /> {(alert.severity || 'Medium').toUpperCase()}
                    </span>
                    <span className="alert-time">2h ago</span>
                  </div>
                  <h4 className="alert-title">{alert.title}</h4>
                  <p className="alert-desc">{alert.description || alert.impact}</p>
                </div>
              ))}
            </div>
            
            <Link to="/security" className="card-footer-link" style={{ marginTop: 'auto' }}>
              View Security Analysis <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
