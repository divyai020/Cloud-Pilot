import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import demoData from '../data/demoData';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { summary, costTrend, resourceUtilization, recommendations, securityFindings } = demoData;

  const topRecommendations = recommendations.slice(0, 3);
  
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
            <button className="btn-secondary-sm">
              <Download size={16} className="mr-2" /> Export
            </button>
            <button className="btn-primary-sm">
              <RefreshCw size={16} className="mr-2" /> Sync Now
            </button>
          </div>
        </header>

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
            <div className="kpi-value">{summary.cloudHealthScore}%</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(178, 141, 255, 0.1)' }}>
                <Wallet size={20} color="var(--accent-purple)" />
              </div>
              <span className="kpi-badge text-red">+5% vs last month</span>
            </div>
            <div className="kpi-label">MONTHLY COST</div>
            <div className="kpi-value">₹{summary.monthlyCost.toLocaleString('en-IN')}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <PiggyBank size={20} color="#10b981" />
              </div>
              <span className="kpi-badge text-green">{recommendations.length} opportunities</span>
            </div>
            <div className="kpi-label">POTENTIAL SAVINGS</div>
            <div className="kpi-value">₹{summary.potentialSavings.toLocaleString('en-IN')}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <ShieldAlert size={20} color="#ef4444" />
              </div>
              <span className="kpi-badge text-warning">2 Critical / 3 Warning</span>
            </div>
            <div className="kpi-label">SECURITY ISSUES</div>
            <div className="kpi-value">{summary.securityIssues} Active</div>
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
                <button className="toggle-btn">Daily</button>
                <button className="toggle-btn">Weekly</button>
                <button className="toggle-btn active">Monthly</button>
              </div>
            </div>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            
            <Link to="/cost" className="card-footer-link">
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
                      <span className="save-amount text-green">₹{rec.estimatedSavings.toLocaleString('en-IN')}<span>/mo</span></span>
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
              {securityFindings.slice(0, 3).map((alert) => (
                <div key={alert.id} className="alert-item">
                  <div className="alert-header">
                    <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                      <ShieldAlert size={14} className="mr-1" /> {alert.severity.toUpperCase()}
                    </span>
                    <span className="alert-time">2h ago</span>
                  </div>
                  <h4 className="alert-title">{alert.title}</h4>
                  <p className="alert-desc">{alert.description}</p>
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
