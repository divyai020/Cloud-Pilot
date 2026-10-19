import React, { useState } from 'react';
import { 
  Download, 
  PiggyBank, 
  TrendingDown, 
  Activity, 
  Sparkles, 
  X,
  Server,
  Database,
  Cloud,
  CheckCircle,
  ArrowRight,
  Zap,
  ShieldAlert,
  Terminal,
  Code,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import demoData from '../data/demoData';
import Sidebar from '../components/Sidebar';
import { generateCostRemediation } from '../services/remediationService';

const CostOptimization = () => {
  const [activeFilter, setActiveFilter] = useState('All Opportunities');
  const [chartPeriod, setChartPeriod] = useState('Monthly');
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [costRemediationTab, setCostRemediationTab] = useState('cli');
  const [costCopied, setCostCopied] = useState(false);
  const [appliedFix, setAppliedFix] = useState(false);

  const { summary, costTrend, costBreakdown, recommendations } = demoData;

  const filters = ['All Opportunities', 'High Savings', 'Compute', 'Database', 'Storage'];

  const getFilteredRecommendations = () => {
    return recommendations.filter(rec => {
      const searchStr = `${rec.title} ${rec.description} ${rec.resource}`.toLowerCase();
      
      if (activeFilter === 'All Opportunities') return true;
      if (activeFilter === 'High Savings') return rec.estimatedSavings > 1000;
      if (activeFilter === 'Compute') return searchStr.includes('ec2') || searchStr.includes('compute') || searchStr.includes('instance');
      if (activeFilter === 'Database') return searchStr.includes('rds') || searchStr.includes('database');
      if (activeFilter === 'Storage') return searchStr.includes('s3') || searchStr.includes('storage') || searchStr.includes('ebs') || searchStr.includes('volume');
      return true;
    });
  };

  const getChartData = () => {
    if (chartPeriod === 'Daily') {
      return Array.from({ length: 7 }).map((_, i) => ({ month: `Day ${i+1}`, cost: 48000 + Math.floor(Math.random() * 1500) }));
    }
    if (chartPeriod === 'Weekly') {
      return Array.from({ length: 4 }).map((_, i) => ({ month: `Week ${i+1}`, cost: 45000 + i * 1000 }));
    }
    return costTrend;
  };

  const filteredRecommendations = getFilteredRecommendations();

  const pieData = [
    { name: 'EC2', value: costBreakdown?.compute || 22000, color: 'var(--accent-purple)' },
    { name: 'RDS', value: costBreakdown?.database || 14000, color: '#3b82f6' },
    { name: 'S3', value: costBreakdown?.storage || 8500, color: '#10b981' },
    { name: 'Network', value: costBreakdown?.network || 2500, color: '#f59e0b' },
    { name: 'Other', value: costBreakdown?.other || 1500, color: '#6b7280' },
  ];

  // Derive savings by service for the "Where Can You Save?" section
  const savingsByService = [
    { name: 'EC2 Compute', amount: 1600, percent: 80, icon: <Server size={14} /> },
    { name: 'RDS Database', amount: 1800, percent: 90, icon: <Database size={14} /> },
    { name: 'S3 Storage', amount: 2100, percent: 100, icon: <Cloud size={14} /> },
  ].sort((a, b) => b.amount - a.amount);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red';
      case 'medium': return 'text-warning';
      default: return 'text-green';
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main relative">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Cost Optimization</h1>
            <p className="dashboard-subtitle">Review AI-driven recommendations to reduce your monthly cloud spend.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-sm">
              <Download size={16} className="mr-2" /> Export Report
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <TrendingDown size={20} className="text-secondary" />
              </div>
            </div>
            <div className="kpi-label">CURRENT MONTHLY COST</div>
            <div className="kpi-value">₹{summary.monthlyCost.toLocaleString('en-IN')}</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <PiggyBank size={20} color="#10b981" />
              </div>
            </div>
            <div className="kpi-label">POTENTIAL SAVINGS</div>
            <div className="kpi-value text-green">₹{summary.potentialSavings.toLocaleString('en-IN')}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(178, 141, 255, 0.1)' }}>
                <Sparkles size={20} color="var(--accent-purple)" />
              </div>
            </div>
            <div className="kpi-label">OPTIMIZATION OPPORTUNITIES</div>
            <div className="kpi-value">{recommendations.length} Available</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <Activity size={20} color="#3b82f6" />
              </div>
            </div>
            <div className="kpi-label">RESOURCE EFFICIENCY</div>
            <div className="kpi-value">68% Score</div>
          </div>
        </div>

        {/* Cost Distribution Row */}
        <div className="dashboard-middle-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Monthly Cost Trend</h3>
                <p className="card-subtitle">Historical spend across your environment</p>
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
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="var(--accent-purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card util-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Cost by Service</h3>
                <p className="card-subtitle">Current month spend distribution</p>
              </div>
            </div>
            
            <div className="flex-center" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="donut-legend mt-4">
              {pieData.map((item, idx) => (
                <div key={idx} className="donut-legend-item">
                  <div className="flex items-center gap-2">
                    <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm text-secondary">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings Opportunity & Recommended Actions */}
        <div className="dashboard-middle-row" style={{ gridTemplateColumns: '1fr 2.5fr', marginTop: '1.5rem' }}>
          
          {/* Left Column: Overviews */}
          <div className="flex flex-col gap-6">
            
            <div className="dashboard-card">
              <div className="card-header border-b border-white/5 pb-3 mb-4">
                <h3 className="card-title">Optimization Potential</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary">Current Spend</span>
                  <span className="font-semibold">₹{summary.monthlyCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-green">
                  <span className="text-sm">Potential Savings</span>
                  <span className="font-semibold">-₹{summary.potentialSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-white/10 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-purple">Optimized Spend</span>
                  <span className="font-bold text-lg text-white">₹{(summary.monthlyCost - summary.potentialSavings).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header border-b border-white/5 pb-3 mb-4">
                <h3 className="card-title">Where Can You Save?</h3>
              </div>
              <div className="flex flex-col gap-4">
                {savingsByService.map((service, idx) => (
                  <div key={idx} className="util-item">
                    <div className="util-item-header mb-1">
                      <span className="util-name flex items-center gap-1 text-sm">{service.icon} {service.name}</span>
                      <span className="util-stat text-green font-semibold">₹{service.amount.toLocaleString('en-IN')}/mo</span>
                    </div>
                    <div className="progress-bg" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${service.percent}%`, backgroundColor: '#10b981' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-card recommendation-box">
              <div className="rec-box-header">
                <Sparkles size={18} className="text-purple" />
                <h4 className="m-0 text-white font-semibold">✨ AI Cost Insight</h4>
              </div>
              <p className="text-secondary text-sm mb-4">
                Your largest optimization opportunity is reducing unnecessary resource capacity. The current demo environment contains several underutilized resources that may be downsized or removed.
              </p>
            </div>

          </div>

          {/* Right Column: Recommended Actions */}
          <div className="dashboard-card">
            <div className="card-header mb-2 flex justify-between items-center">
              <div>
                <h3 className="card-title">Recommended Actions</h3>
                <p className="card-subtitle">Review and implement these steps to reduce costs.</p>
              </div>
            </div>
            
            <div className="filter-tabs mb-6 flex gap-2 overflow-x-auto pb-2">
              {filters.map(filter => (
                <button 
                  key={filter} 
                  onClick={() => setActiveFilter(filter)}
                  className={`tab-btn whitespace-nowrap ${activeFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((rec) => (
                  <div key={rec.id} className="opt-card p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${getPriorityColor(rec.priority)}`}>
                          {rec.priority} Priority
                        </span>
                        <span className="text-xs text-secondary px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {rec.resource}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-secondary block">Potential Saving</span>
                        <span className="text-green font-bold text-lg">₹{rec.estimatedSavings.toLocaleString('en-IN')}<span className="text-xs font-normal">/mo</span></span>
                      </div>
                    </div>
                    
                    <h4 className="text-base font-semibold text-white mb-1">{rec.title}</h4>
                    <p className="text-sm text-secondary mb-4">{rec.description}</p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <button 
                        className="btn-primary-sm"
                        onClick={() => setSelectedOpt(rec)}
                      >
                        View Optimization Steps
                      </button>
                      <span className="text-xs text-secondary">{rec.id}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-secondary">
                  No recommendations found for this filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sliding Drawer for Optimization Steps */}
        {selectedOpt && (
          <div className="side-panel" style={{ width: '500px' }}>
            <div className="side-panel-header">
              <div>
                <h2 className="panel-title">Optimization Details</h2>
                <span className="panel-subtitle">{selectedOpt.title}</span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedOpt(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="side-panel-body pb-20">
              
              <div className="panel-section">
                <h3>Why Cloud Pilot Flagged This</h3>
                <div className="p-3 bg-white/5 rounded-md border border-white/10">
                  <p className="text-sm text-secondary">
                    {selectedOpt.description}
                  </p>
                </div>
              </div>

              <div className="panel-section">
                <h3>Before vs After</h3>
                <div className="before-after-box bg-white/5 rounded-lg border border-white/10 p-1 flex items-stretch">
                  <div className="flex-1 p-4 bg-black/20 rounded-md">
                    <span className="text-xs text-secondary uppercase tracking-wider block mb-2 font-semibold">Current State</span>
                    <div className="text-sm mb-1"><span className="text-secondary">Resource:</span> Current Size</div>
                    <div className="text-sm mb-3"><span className="text-secondary">Utilization:</span> ~8%</div>
                    <div className="text-lg font-bold">₹4,200<span className="text-xs text-secondary font-normal">/mo</span></div>
                  </div>
                  
                  <div className="flex items-center justify-center px-3 text-secondary">
                    <ArrowRight size={20} />
                  </div>
                  
                  <div className="flex-1 p-4 bg-purple-900/20 border border-purple-500/20 rounded-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                    <span className="text-xs text-purple uppercase tracking-wider block mb-2 font-semibold">Optimized</span>
                    <div className="text-sm mb-1 text-white"><span className="text-white/60">Resource:</span> {selectedOpt.action || 'Recommended Size'}</div>
                    <div className="text-sm mb-3 text-white"><span className="text-white/60">Utilization:</span> ~25%</div>
                    <div className="text-lg font-bold text-green">₹{(4200 - selectedOpt.estimatedSavings).toLocaleString('en-IN')}<span className="text-xs text-green/60 font-normal">/mo</span></div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-green-500/10 text-green rounded-md border border-green-500/20">
                  <PiggyBank size={16} />
                  <span className="font-semibold text-sm">Save ₹{selectedOpt.estimatedSavings.toLocaleString('en-IN')}/month</span>
                </div>
              </div>

              <div className="panel-section">
                <h3>How to Optimize (Step-by-Step)</h3>
                <div className="step-list flex flex-col gap-4">
                  <div className="step-item flex gap-3">
                    <div className="step-num flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Review utilization</h4>
                      <p className="text-xs text-secondary">Check CPU and memory usage over the recent period to verify the idle state.</p>
                    </div>
                  </div>
                  <div className="step-item flex gap-3">
                    <div className="step-num flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Select appropriate sizing</h4>
                      <p className="text-xs text-secondary">Move from the current instance type to the recommended size ({selectedOpt.action || 'smaller tier'}).</p>
                    </div>
                  </div>
                  <div className="step-item flex gap-3">
                    <div className="step-num flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">3</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Validate workload</h4>
                      <p className="text-xs text-secondary">Ensure expected traffic and workload requirements remain satisfied by the new sizing.</p>
                    </div>
                  </div>
                  <div className="step-item flex gap-3">
                    <div className="step-num flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/20">4</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Apply the change</h4>
                      <p className="text-xs text-secondary">Make the approved infrastructure change in your cloud console or via IaC.</p>
                    </div>
                  </div>
                  <div className="step-item flex gap-3">
                    <div className="step-num flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple border border-purple-500/40">5</div>
                    <div>
                      <h4 className="text-sm font-semibold text-purple mb-1">Monitor after optimization</h4>
                      <p className="text-xs text-secondary">Check utilization and performance after the change to ensure stability.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 1-Click Cost Auto-Remediation */}
              <div className="panel-section" style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1rem', marginTop: '1rem' }}>
                {(() => {
                  const rem = generateCostRemediation(selectedOpt);
                  const currentCode = costRemediationTab === 'cli' ? rem.cli : costRemediationTab === 'terraform' ? rem.terraform : rem.boto3;

                  const handleCopyCode = () => {
                    navigator.clipboard.writeText(currentCode);
                    setCostCopied(true);
                    setTimeout(() => setCostCopied(false), 2000);
                  };

                  const handleApplyFix = () => {
                    setAppliedFix(true);
                    setTimeout(() => setAppliedFix(false), 3000);
                  };

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Zap size={16} color="#10B981" />
                          <h3 style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 600, margin: 0 }}>
                            ⚡ 1-Click Cost Auto-Remediation
                          </h3>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                          Saves {rem.monthlySavings}
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
                          const active = costRemediationTab === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setCostRemediationTab(t.id)}
                              style={{
                                background: active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${active ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
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
                            color: costCopied ? '#10B981' : '#FFF',
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
                          {costCopied ? <Check size={12} /> : <Copy size={12} />}
                          {costCopied ? 'Copied!' : 'Copy Script'}
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
                          <strong style={{ color: '#E2E8F0' }}>Rollback Plan: </strong>
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
                          <Copy size={13} style={{ marginRight: '4px' }} /> Copy Script
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyFix}
                          className="btn-primary-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', background: appliedFix ? '#10B981' : undefined }}
                        >
                          {appliedFix ? (
                            <>
                              <Check size={13} style={{ marginRight: '4px' }} /> Optimization Applied!
                            </>
                          ) : (
                            <>
                              <Play size={13} style={{ marginRight: '4px' }} /> Apply Optimization
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
              
            </div>
            
            {/* Action Footer */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-var(--bg-card) border-t border-white/10 bg-[#0f1219] flex gap-3">
               <button 
                 className={`btn-primary flex-1 flex-center justify-center gap-2 ${isSimulating ? 'opacity-75 cursor-not-allowed' : ''}`}
                 onClick={() => {
                   if (isSimulating) return;
                   setIsSimulating(true);
                   setTimeout(() => setIsSimulating(false), 2000);
                 }}
               >
                 {isSimulating ? 'Simulating...' : 'Simulate In Cloud'} <Activity size={16} className={isSimulating ? 'animate-spin' : ''} />
               </button>
               <button className="btn-secondary flex-1 justify-center" onClick={() => setSelectedOpt(null)}>
                 Close
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CostOptimization;
