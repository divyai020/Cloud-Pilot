import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Activity, 
  Sparkles, 
  X,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Eye,
  Key,
  Globe,
  Database,
  Settings,
  Server,
  Code,
  Copy,
  Check,
  Terminal,
  Play,
  Undo2,
  Zap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import demoData from '../data/demoData';
import Sidebar from '../components/Sidebar';
import { generateSecurityRemediation } from '../services/remediationService';

const Security = () => {
  const [activeSevFilter, setActiveSevFilter] = useState('All');
  const [activeCatFilter, setActiveCatFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [remediationTab, setRemediationTab] = useState('cli');
  const [copiedScript, setCopiedScript] = useState(false);
  const [executedRemediation, setExecutedRemediation] = useState(false);

  const { securityFindings } = demoData;

  const sevFilters = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const catFilters = ['All', 'IAM', 'Public Resources', 'Network', 'Data Protection'];

  const criticalCount = securityFindings.filter(f => f.severity === 'Critical').length;
  const highCount = securityFindings.filter(f => f.severity === 'High').length;

  const getFilteredFindings = () => {
    return securityFindings.filter(f => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === '' || 
        f.title.toLowerCase().includes(q) || 
        f.resource.toLowerCase().includes(q) || 
        (f.category && f.category.toLowerCase().includes(q)) ||
        f.severity.toLowerCase().includes(q);
      const matchesSev = activeSevFilter === 'All' || f.severity === activeSevFilter;
      const matchesCat = activeCatFilter === 'All' || f.category === activeCatFilter;
      return matchesSearch && matchesSev && matchesCat;
    });
  };

  const filteredFindings = getFilteredFindings();

  const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Critical', leftBorder: '#ef4444' };
      case 'high':     return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', label: 'High', leftBorder: '#f97316' };
      case 'medium':   return { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', label: 'Medium', leftBorder: '#eab308' };
      default:         return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', label: 'Low', leftBorder: '#3b82f6' };
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'IAM': return <Key size={13} />;
      case 'Public Resources': return <Globe size={13} />;
      case 'Network': return <Activity size={13} />;
      case 'Data Protection': return <Database size={13} />;
      case 'Configuration': return <Settings size={13} />;
      default: return <Shield size={13} />;
    }
  };

  const catCounts = securityFindings.reduce((acc, curr) => {
    acc[curr.category || 'Other'] = (acc[curr.category || 'Other'] || 0) + 1;
    return acc;
  }, {});

  const pieColors = ['#b28dff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const pieData = Object.keys(catCounts).map((key, index) => ({
    name: key, value: catCounts[key], color: pieColors[index % pieColors.length]
  }));

  const getWhyItMatters = (cat) => {
    const map = {
      'Public Resources': 'Unauthorized users may access or exfiltrate sensitive data stored in this resource.',
      'IAM': 'Compromised or abandoned credentials can be used by attackers to breach your entire environment.',
      'Network': 'A broad network exposure drastically increases the attack surface for malicious actors.',
      'Data Protection': 'Lack of encryption violates compliance standards and exposes raw data if underlying storage is compromised.',
    };
    return map[cat] || 'This finding poses a risk to the security and integrity of your cloud environment.';
  };

  const renderRemediationSteps = (finding) => {
    if (finding.category === 'IAM') {
      return [
        { title: 'Identify unused credentials', desc: 'Review the IAM console for users with credentials unused for 90+ days.' },
        { title: 'Deactivate keys', desc: 'Mark the access keys as Inactive rather than deleting immediately.' },
        { title: 'Verify application impact', desc: 'Confirm no critical systems break after deactivation.' },
        { title: 'Delete or rotate', desc: 'Permanently delete keys after a safe observation period, or rotate them.' },
        { title: 'Set rotation policy', desc: 'Enable automatic credential rotation to prevent this recurring.' },
      ];
    }
    if (finding.category === 'Public Resources') {
      return [
        { title: 'Review bucket access', desc: `Check whether public access is actually required for ${finding.resource}.` },
        { title: 'Block public access', desc: 'Enable S3 Block Public Access at both bucket and account level.' },
        { title: 'Review bucket policy', desc: 'Remove unnecessary `Principal: "*"` permissions from the JSON policy.' },
        { title: 'Verify access', desc: 'Confirm only intended roles and users can access the bucket.' },
        { title: 'Re-scan', desc: 'Run another security scan to confirm the issue is fully resolved.' },
      ];
    }
    if (finding.category === 'Network') {
      return [
        { title: 'Identify exposed port', desc: `Check the inbound rules for ${finding.resource}.` },
        { title: 'Restrict CIDR range', desc: 'Remove the 0.0.0.0/0 source from sensitive ports like 22 or 3389.' },
        { title: 'Allow trusted sources only', desc: 'Add specific IP ranges for your VPN or office network.' },
        { title: 'Verify connectivity', desc: 'Ensure legitimate services still connect correctly after the change.' },
      ];
    }
    return [
      { title: 'Investigate resource', desc: `Review the current configuration of ${finding.resource}.` },
      { title: 'Apply recommendation', desc: finding.recommendation },
      { title: 'Verify change', desc: 'Confirm the configuration change has taken effect.' },
      { title: 'Re-scan', desc: 'Run another security scan to confirm the issue is resolved.' },
    ];
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main relative">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Security Analysis</h1>
            <p className="dashboard-subtitle">Identify cloud security risks, understand their impact, and prioritize remediation.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-sm">
              <Download size={16} style={{ marginRight: '0.5rem' }} /> Export Report
            </button>
            <button 
              className="btn-primary-sm"
              style={{ opacity: isScanning ? 0.75 : 1 }}
              onClick={() => {
                if (isScanning) return;
                setIsScanning(true);
                setTimeout(() => setIsScanning(false), 3000);
              }}
            >
              <ShieldCheck size={16} style={{ marginRight: '0.5rem' }} /> 
              {isScanning ? 'Scanning...' : 'Run Security Scan'}
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card" style={{ borderLeft: '3px solid #10b981' }}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>Good</span>
            </div>
            <div className="kpi-label">SECURITY SCORE</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>82 <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ 100</span></div>
          </div>
          
          <div className="kpi-card" style={{ borderLeft: '3px solid #ef4444' }}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <ShieldAlert size={20} color="#ef4444" />
              </div>
            </div>
            <div className="kpi-label">CRITICAL ISSUES</div>
            <div className="kpi-value" style={{ color: '#ef4444' }}>{criticalCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Requires immediate attention</div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '3px solid #f97316' }}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                <AlertCircle size={20} color="#f97316" />
              </div>
            </div>
            <div className="kpi-label">HIGH RISK</div>
            <div className="kpi-value" style={{ color: '#f97316' }}>{highCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Review soon</div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '3px solid #6b7280' }}>
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(107,114,128,0.1)' }}>
                <CheckCircle size={20} color="#9ca3af" />
              </div>
            </div>
            <div className="kpi-label">RESOLVED</div>
            <div className="kpi-value" style={{ color: 'var(--text-secondary)' }}>—</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Resolution history unavailable</div>
          </div>
        </div>

        {/* Security Score Breakdown */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Why is my security score 82?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
            {[
              { label: 'Identity & Access', pct: 70, color: '#eab308' },
              { label: 'Public Exposure', pct: 40, color: '#ef4444' },
              { label: 'Network Security', pct: 95, color: '#10b981' },
              { label: 'Data Protection', pct: 85, color: '#10b981' },
              { label: 'Configuration', pct: 100, color: '#10b981' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* LEFT: Filters + Findings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Filters Card */}
            <div className="dashboard-card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                {/* Severity filters */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {sevFilters.map(f => {
                    const cfg = getSeverityConfig(f === 'All' ? null : f);
                    const isActive = activeSevFilter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setActiveSevFilter(f)}
                        style={{
                          padding: '0.3rem 0.85rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: `1px solid ${isActive ? (f === 'All' ? 'var(--accent-purple)' : cfg.border) : 'rgba(255,255,255,0.08)'}`,
                          background: isActive ? (f === 'All' ? 'rgba(178,141,255,0.15)' : cfg.bg) : 'transparent',
                          color: isActive ? (f === 'All' ? 'var(--accent-purple)' : cfg.color) : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.4rem 0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Search size={14} color="var(--text-secondary)" />
                  <input
                    type="text"
                    placeholder="Search findings..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.825rem', color: 'white', width: '180px' }}
                  />
                </div>
              </div>

              {/* Category filters */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {catFilters.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveCatFilter(f)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.775rem',
                      fontWeight: 500,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: activeCatFilter === f ? 'rgba(178,141,255,0.1)' : 'rgba(255,255,255,0.03)',
                      color: activeCatFilter === f ? 'var(--accent-purple)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings heading */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Active Findings</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                {filteredFindings.length} findings
              </span>
            </div>

            {/* Findings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {filteredFindings.length > 0 ? filteredFindings.map((finding) => {
                const cfg = getSeverityConfig(finding.severity);
                return (
                  <div
                    key={finding.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${cfg.leftBorder}`,
                      borderRadius: '10px',
                      padding: '1.25rem 1.5rem',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = cfg.border; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.borderLeftColor = cfg.leftBorder; }}
                  >
                    {/* Top row: severity badge + category */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                          padding: '0.2rem 0.6rem', borderRadius: '4px',
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
                        }}>
                          {finding.severity}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          {getCategoryIcon(finding.category)} {finding.category || 'Other'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{finding.id}</span>
                    </div>

                    {/* Title */}
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{finding.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>{finding.description}</p>

                    {/* Bottom row: resource + action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.875rem' }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.8rem', color: 'var(--text-secondary)',
                        background: 'rgba(0,0,0,0.25)', borderRadius: '6px',
                        padding: '0.3rem 0.7rem', border: '1px solid rgba(255,255,255,0.06)',
                        fontFamily: 'monospace'
                      }}>
                        <Server size={12} /> {finding.resource}
                      </span>
                      <button
                        onClick={() => setSelectedFinding(finding)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          background: 'rgba(178,141,255,0.1)', color: 'var(--accent-purple)',
                          border: '1px solid rgba(178,141,255,0.25)', borderRadius: '8px',
                          padding: '0.35rem 0.9rem', fontSize: '0.825rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(178,141,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(178,141,255,0.1)'}
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  No findings match your filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar Widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
            
            {/* Priority Guide */}
            <div className="dashboard-card" style={{ borderColor: 'rgba(178,141,255,0.2)', background: 'rgba(178,141,255,0.05)' }}>
              <h3 className="card-title" style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }}>Where to start?</h3>
              {[
                { num: '1', label: 'Critical issues', note: 'Resolve immediately to prevent breach.', color: '#ef4444' },
                { num: '2', label: 'High-risk issues', note: 'Review within the recommended window.', color: '#f97316' },
                { num: '3', label: 'Medium issues', note: 'Address in the next optimization cycle.', color: '#eab308' },
              ].map(item => (
                <div key={item.num} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${item.color}20`, border: `1px solid ${item.color}50`, color: item.color, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{item.num}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.15rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resource Health */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Resource Health</h3>
              <div style={{ height: '10px', width: '100%', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginBottom: '0.875rem' }}>
                <div style={{ width: '85%', background: '#10b981' }} title="Healthy"></div>
                <div style={{ width: '10%', background: '#eab308', margin: '0 2px' }} title="Warning"></div>
                <div style={{ width: '5%', background: '#ef4444' }} title="Critical"></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[{ label: '85 Healthy', color: '#10b981' }, { label: '10 Warning', color: '#eab308' }, { label: '5 Critical', color: '#ef4444' }].map(item => (
                  <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, display: 'inline-block' }}></span> {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>By Category</h3>
              <div style={{ height: '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }} itemStyle={{ color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pieData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, display: 'inline-block' }}></span> {item.name}
                    </span>
                    <span style={{ fontWeight: 700, color: 'white' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1rem', marginLeft: '0.25rem' }}>
                {[
                  { dot: '#b28dff', title: 'Security scan completed', time: '2 hours ago' },
                  { dot: '#ef4444', title: 'Critical finding detected', time: '2 hours ago' },
                  { dot: '#3b82f6', title: 'Recommendation generated', time: '2 hours ago' },
                  { dot: '#10b981', title: 'Issue reviewed (IAM)', time: 'Yesterday', faded: true },
                ].map((item, i) => (
                  <div key={i} style={{ position: 'relative', opacity: item.faded ? 0.5 : 1 }}>
                    <span style={{ position: 'absolute', left: '-1.3rem', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: item.dot, display: 'inline-block' }}></span>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', marginBottom: '0.1rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{item.time}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Details Drawer */}
        {selectedFinding && (() => {
          const cfg = getSeverityConfig(selectedFinding.severity);
          const steps = renderRemediationSteps(selectedFinding);
          return (
            <div className="side-panel" style={{ width: '520px' }}>
              <div className="side-panel-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {selectedFinding.severity}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security Issue</span>
                  </div>
                  <h2 className="panel-title">{selectedFinding.title}</h2>
                </div>
                <button className="btn-icon" onClick={() => setSelectedFinding(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="side-panel-body" style={{ paddingBottom: '5.5rem' }}>
                
                {/* Affected Resource */}
                <div className="panel-section">
                  <h3>Affected Resource</h3>
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Server size={14} color="var(--text-secondary)" /> {selectedFinding.resource}
                  </div>
                </div>

                {/* What & Why */}
                <div className="panel-section">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>What happened?</div>
                      <p style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.5' }}>{selectedFinding.description}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Why it matters</div>
                      <p style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.5' }}>{getWhyItMatters(selectedFinding.category)}</p>
                    </div>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="panel-section recommendation-box" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(178,141,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
                  <div className="rec-box-header">
                    <Sparkles size={18} color="var(--accent-purple)" />
                    <h4 style={{ color: 'white', fontWeight: 600 }}>✨ AI Security Insight</h4>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                    Resource <strong style={{ color: 'white' }}>{selectedFinding.resource}</strong> is flagged as <strong style={{ color: cfg.color }}>{selectedFinding.severity}</strong> priority under <strong style={{ color: 'white' }}>{selectedFinding.category}</strong>. Cloud Pilot recommends addressing this promptly to prevent exploitation.
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Recommended Action</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{selectedFinding.recommendation}</div>
                  </div>
                </div>

                {/* 1-Click Auto-Remediation Console */}
                <div className="panel-section" style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', border: '1px solid rgba(178, 141, 255, 0.25)', padding: '1rem', marginTop: '1rem' }}>
                  {(() => {
                    const rem = generateSecurityRemediation(selectedFinding);
                    const currentCode = remediationTab === 'cli' ? rem.cli : remediationTab === 'terraform' ? rem.terraform : rem.boto3;

                    const handleCopyCode = () => {
                      navigator.clipboard.writeText(currentCode);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2000);
                    };

                    const handleSimulateExecution = () => {
                      setExecutedRemediation(true);
                      setTimeout(() => setExecutedRemediation(false), 3000);
                    };

                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={16} color="#B28DFF" />
                            <h3 style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 600, margin: 0 }}>
                              ⚡ 1-Click AI Auto-Remediation
                            </h3>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                            Safe Dry-Run Verified
                          </span>
                        </div>

                        {/* Format Tabs */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
                          {[
                            { id: 'cli', label: 'AWS CLI', icon: Terminal },
                            { id: 'terraform', label: 'Terraform (HCL)', icon: Code },
                            { id: 'boto3', label: 'Python (Boto3)', icon: Play }
                          ].map(t => {
                            const TabIcon = t.icon;
                            const active = remediationTab === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setRemediationTab(t.id)}
                                style={{
                                  background: active ? 'rgba(178, 141, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                  border: `1px solid ${active ? '#B28DFF' : 'rgba(255, 255, 255, 0.1)'}`,
                                  color: active ? '#FFF' : '#94A3B8',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <TabIcon size={12} />
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Code Block */}
                        <div style={{ position: 'relative', background: '#090d16', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: copiedScript ? '#10B981' : '#FFF',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              zIndex: 2
                            }}
                          >
                            {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                            {copiedScript ? 'Copied!' : 'Copy Script'}
                          </button>

                          <pre style={{ margin: 0, padding: '12px 14px', fontSize: '0.75rem', color: '#38BDF8', fontFamily: 'Consolas, monospace', lineHeight: '1.5', overflowX: 'auto', maxHeight: '180px' }}>
                            {currentCode}
                          </pre>
                        </div>

                        {/* Safety & Rollback */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: '#94A3B8' }}>
                          <div>
                            <strong style={{ color: '#E2E8F0' }}>Blast Radius: </strong> {rem.blastRadius}
                          </div>
                          <div>
                            <strong style={{ color: '#E2E8F0' }}>Rollback command: </strong>
                            <code style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 4px', borderRadius: '3px' }}>
                              {rem.rollbackPlan}
                            </code>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="btn-secondary-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
                          >
                            <Copy size={13} style={{ marginRight: '4px' }} /> Copy to Clipboard
                          </button>
                          <button
                            type="button"
                            onClick={handleSimulateExecution}
                            className="btn-primary-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', background: executedRemediation ? '#10B981' : undefined }}
                          >
                            {executedRemediation ? (
                              <>
                                <Check size={13} style={{ marginRight: '4px' }} /> Fix Applied in Cloud!
                              </>
                            ) : (
                              <>
                                <Play size={13} style={{ marginRight: '4px' }} /> Apply Remediation
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>

              {/* Footer */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '1rem', background: '#0f1219', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary-sm" onClick={() => setSelectedFinding(null)} style={{ flex: 1, justifyContent: 'center' }}>Close Inspector</button>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
};

export default Security;
