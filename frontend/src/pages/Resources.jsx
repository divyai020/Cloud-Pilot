import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  Server, 
  Database, 
  Cloud, 
  Zap, 
  X, 
  ShieldAlert, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import demoData from '../data/demoData';
import Sidebar from '../components/Sidebar';

const Resources = () => {
  const [activeFilter, setActiveFilter] = useState('All Resources');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  const filterTabs = ['All Resources', 'EC2 Instances', 'S3 Buckets', 'RDS Databases', 'Lambda'];

  const getResourceIcon = (type) => {
    switch(type) {
      case 'EC2': return <Server size={16} />;
      case 'S3': return <Cloud size={16} />;
      case 'RDS': return <Database size={16} />;
      case 'Lambda': return <Zap size={16} />;
      default: return <Server size={16} />;
    }
  };

  const getRiskBadge = (risk) => {
    let className = 'badge-risk ';
    switch(risk) {
      case 'Low': className += 'risk-low'; break;
      case 'Medium': className += 'risk-medium'; break;
      case 'High': className += 'risk-high'; break;
      case 'Critical': className += 'risk-critical'; break;
      default: className += 'risk-low';
    }
    return <span className={className}>{risk}</span>;
  };

  const getStatusBadge = (status) => {
    let className = 'badge-status ';
    if (['Running', 'Active', 'Available'].includes(status)) {
      className += 'status-good';
    } else {
      className += 'status-neutral';
    }
    return (
      <span className={className}>
        <span className="status-dot"></span>
        {status}
      </span>
    );
  };

  // Filter Logic
  const filteredResources = demoData.resources.filter(res => {
    // Tab Filter
    if (activeFilter === 'EC2 Instances' && res.type !== 'EC2') return false;
    if (activeFilter === 'S3 Buckets' && res.type !== 'S3') return false;
    if (activeFilter === 'RDS Databases' && res.type !== 'RDS') return false;
    if (activeFilter === 'Lambda' && res.type !== 'Lambda') return false;
    
    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        res.id.toLowerCase().includes(q) || 
        res.name.toLowerCase().includes(q) || 
        res.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Find recommendation for selected resource
  const getRecommendation = (resId, resName) => {
    return demoData.recommendations.find(r => r.resource === resName || r.resource === resId || r.resource.includes(resName));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main relative">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Resources View</h1>
            <p className="dashboard-subtitle">Manage, optimize, and secure your cloud infrastructure assets.</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-sm">
              <Download size={16} className="mr-2" /> Export
            </button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="tabs">
            {filterTabs.map(tab => (
              <button 
                key={tab} 
                className={`tab-btn ${activeFilter === tab ? 'active' : ''}`}
                onClick={() => { setActiveFilter(tab); setSelectedResource(null); }}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, name, or type..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="btn-icon">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Resource Table */}
        <div className="table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th>RESOURCE ID & NAME</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>UTILIZATION</th>
                <th>MONTHLY COST</th>
                <th>RISK PROFILE</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length > 0 ? (
                filteredResources.map((res) => (
                  <tr 
                    key={res.id} 
                    className={`table-row ${selectedResource?.id === res.id ? 'selected' : ''}`}
                    onClick={() => setSelectedResource(res)}
                  >
                    <td>
                      <div className="res-identity">
                        <span className="res-id">{res.id}</span>
                        <span className="res-name">{res.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="res-type">
                        {getResourceIcon(res.type)}
                        {res.type}
                      </div>
                    </td>
                    <td>{getStatusBadge(res.status)}</td>
                    <td>
                      {res.cpuUtilization !== undefined ? `${res.cpuUtilization}% CPU` : 
                       res.invocations ? `${(res.invocations/1000).toFixed(1)}k invs` : 
                       res.storageGB ? `${res.storageGB} GB` : 'N/A'}
                    </td>
                    <td className="font-semibold">₹{res.monthlyCost.toLocaleString('en-IN')}</td>
                    <td>{getRiskBadge(res.risk)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-secondary">
                    No resources found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Footer */}
          <div className="pagination-footer">
            <span className="text-secondary text-sm">Showing {filteredResources.length > 0 ? 1 : 0} to {filteredResources.length} of {filteredResources.length} entries</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled><ChevronLeft size={16} /></button>
              <button className="page-btn active">1</button>
              <button className="page-btn" disabled><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Side Panel overlay mask (optional for clicking away, but we'll stick to layout) */}
        {selectedResource && (
          <div className="side-panel">
            <div className="side-panel-header">
              <div>
                <h2 className="panel-title">{selectedResource.name}</h2>
                <span className="panel-subtitle">{selectedResource.id}</span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedResource(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="side-panel-body">
              <div className="panel-section">
                <h3>Overview</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value flex items-center gap-2">
                      {getResourceIcon(selectedResource.type)} {selectedResource.type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">{getStatusBadge(selectedResource.status)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Region</span>
                    <span className="detail-value">{selectedResource.region || 'Global'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Monthly Cost</span>
                    <span className="detail-value font-semibold">₹{selectedResource.monthlyCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Risk Profile</span>
                    <span className="detail-value">{getRiskBadge(selectedResource.risk)}</span>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <h3>Properties</h3>
                <div className="detail-grid">
                  {selectedResource.instanceType && (
                    <div className="detail-item">
                      <span className="detail-label">Instance Type</span>
                      <span className="detail-value">{selectedResource.instanceType}</span>
                    </div>
                  )}
                  {selectedResource.cpuUtilization !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">CPU Utilization</span>
                      <span className="detail-value">{selectedResource.cpuUtilization}%</span>
                    </div>
                  )}
                  {selectedResource.memoryUtilization !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Memory Utilization</span>
                      <span className="detail-value">{selectedResource.memoryUtilization}%</span>
                    </div>
                  )}
                  {selectedResource.storageGB !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Storage</span>
                      <span className="detail-value">{selectedResource.storageGB} GB</span>
                    </div>
                  )}
                  {selectedResource.invocations !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Invocations</span>
                      <span className="detail-value">{selectedResource.invocations.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedResource.publicAccess !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Public Access</span>
                      <span className="detail-value" style={{ color: selectedResource.publicAccess ? '#ef4444' : '#10b981' }}>
                        {selectedResource.publicAccess ? 'Enabled (Warning)' : 'Blocked'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Recommendation Section */}
              {(() => {
                const rec = getRecommendation(selectedResource.id, selectedResource.name);
                if (rec) {
                  return (
                    <div className="panel-section recommendation-box">
                      <div className="rec-box-header">
                        <Sparkles size={18} className="text-purple" />
                        <h4 className="m-0 text-white font-semibold">{rec.title}</h4>
                      </div>
                      <p className="text-secondary text-sm mb-4">{rec.description}</p>
                      
                      {rec.estimatedSavings && (
                        <div className="mb-4">
                          <span className="text-xs text-secondary block">Estimated Savings</span>
                          <span className="text-lg font-bold text-green">₹{rec.estimatedSavings.toLocaleString('en-IN')}/mo</span>
                        </div>
                      )}
                      
                      <button className="btn-primary w-full flex-center justify-center">
                        View Recommendation
                      </button>
                    </div>
                  );
                } else if (selectedResource.risk === 'Critical' || selectedResource.risk === 'High') {
                  // Show a generic security warning if no specific recommendation but high risk
                  return (
                    <div className="panel-section alert-box">
                      <div className="rec-box-header">
                        <ShieldAlert size={18} className="text-red" />
                        <h4 className="m-0 text-white font-semibold">Security Attention Required</h4>
                      </div>
                      <p className="text-secondary text-sm mb-4">This resource has flagged security risks that need your attention.</p>
                      <button className="btn-secondary-sm w-full flex-center justify-center">
                        View Security Analysis
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Resources;
