import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Zap, 
  Plus, 
  Trash2, 
  Sliders, 
  RotateCcw,
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';

const ResourceConfigurator = ({ 
  resources, 
  scenarioMods, 
  onUpdateMod, 
  addedResources, 
  onAddResource, 
  onRemoveAddedResource,
  globalOpts,
  onUpdateGlobalOpts
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState(resources[0]?.id || 'i-001');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResType, setNewResType] = useState('EC2');
  const [newResName, setNewResName] = useState('new-web-instance');
  const [newResTypeVal, setNewResTypeVal] = useState('t3.medium');

  const selectedResource = resources.find(r => r.id === selectedResourceId);
  const currentMod = scenarioMods[selectedResourceId] || {};

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddResource({
      id: `virtual-${Date.now()}`,
      name: newResName || 'virtual-resource',
      type: newResType,
      instanceType: newResTypeVal,
      quantity: 1,
      storageGB: 500,
      monthlyCost: 0
    });
    setShowAddModal(false);
    setNewResName('');
  };

  return (
    <div className="resource-configurator-card">
      <div className="configurator-header">
        <div className="env-title-group">
          <div className="chart-icon-box">
            <Sliders size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="card-title">Interactive Resource Sandbox</h3>
            <p className="card-subtitle">Modify parameters, counts, and tiers to simulate changes</p>
          </div>
        </div>

        <button 
          className="btn-primary-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={15} className="mr-1" /> Add Virtual Resource
        </button>
      </div>

      {/* Resource Tabs Selector */}
      <div className="resource-tabs-list">
        {resources.map((res) => {
          const mod = scenarioMods[res.id] || {};
          const isSelected = selectedResourceId === res.id;
          const isModified = Object.keys(mod).length > 0;

          return (
            <button
              key={res.id}
              className={`resource-tab ${isSelected ? 'active' : ''} ${mod.isDeleted ? 'tab-deleted' : ''}`}
              onClick={() => setSelectedResourceId(res.id)}
            >
              <span className="tab-type">{res.type}</span>
              <span className="tab-name">{res.name}</span>
              {isModified && !mod.isDeleted && <span className="mod-dot"></span>}
              {mod.isDeleted && <span className="del-tag">Removed</span>}
            </button>
          );
        })}

        {addedResources.map((res) => (
          <button
            key={res.id}
            className="resource-tab added-tab active"
            onClick={() => {}}
          >
            <span className="tab-type">{res.type}</span>
            <span className="tab-name">{res.name} (Virtual)</span>
            <X 
              size={14} 
              className="ml-1 cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); onRemoveAddedResource(res.id); }} 
            />
          </button>
        ))}
      </div>

      {/* Selected Resource Controls Panel */}
      {selectedResource && (
        <div className="config-controls-panel">
          <div className="panel-title-row">
            <div>
              <h4 className="res-name">{selectedResource.name}</h4>
              <span className="res-details">
                Current: {selectedResource.type} • {selectedResource.instanceType || selectedResource.storageGB + 'GB'} • Baseline ₹{selectedResource.monthlyCost.toLocaleString('en-IN')}/mo
              </span>
            </div>

            <button
              className={`btn-delete-toggle ${currentMod.isDeleted ? 'btn-restore' : 'btn-remove'}`}
              onClick={() => onUpdateMod(selectedResource.id, { isDeleted: !currentMod.isDeleted })}
            >
              {currentMod.isDeleted ? (
                <> <RotateCcw size={13} className="mr-1" /> Restore Resource </>
              ) : (
                <> <Trash2 size={13} className="mr-1" /> Simulate Removal </>
              )}
            </button>
          </div>

          {!currentMod.isDeleted ? (
            <div className="controls-form-grid">
              {/* Global Pricing Model Selector */}
              <div className="control-group full-width">
                <label className="control-label">Pricing Commit Model:</label>
                <div className="pricing-options">
                  <button
                    className={`pricing-btn ${globalOpts.pricingModel === 'On-Demand' ? 'active' : ''}`}
                    onClick={() => onUpdateGlobalOpts({ pricingModel: 'On-Demand' })}
                  >
                    On-Demand (Standard Rate)
                  </button>
                  <button
                    className={`pricing-btn ${globalOpts.pricingModel === '1-Yr Reserved' ? 'active' : ''}`}
                    onClick={() => onUpdateGlobalOpts({ pricingModel: '1-Yr Reserved' })}
                  >
                    1-Yr Reserved (30% Discount)
                  </button>
                  <button
                    className={`pricing-btn ${globalOpts.pricingModel === '3-Yr Reserved' ? 'active' : ''}`}
                    onClick={() => onUpdateGlobalOpts({ pricingModel: '3-Yr Reserved' })}
                  >
                    3-Yr Reserved (50% Discount)
                  </button>
                </div>
              </div>

              {/* EC2 Controls */}
              {selectedResource.type === 'EC2' && (
                <>
                  <div className="control-group">
                    <label className="control-label">Instance Sizing Class:</label>
                    <select
                      className="control-select"
                      value={currentMod.instanceType || selectedResource.instanceType}
                      onChange={(e) => onUpdateMod(selectedResource.id, { instanceType: e.target.value })}
                    >
                      <option value="t3.micro">t3.micro (1 vCPU, 1 GB) — ₹750/mo</option>
                      <option value="t3.small">t3.small (2 vCPU, 2 GB) — ₹1,480/mo</option>
                      <option value="t3.medium">t3.medium (2 vCPU, 4 GB) — ₹2,800/mo</option>
                      <option value="t3.large">t3.large (2 vCPU, 8 GB) — ₹4,200/mo</option>
                      <option value="t3.xlarge">t3.xlarge (4 vCPU, 16 GB) — ₹8,400/mo</option>
                      <option value="c5.large">c5.large Compute-Optimized — ₹5,200/mo</option>
                      <option value="r5.large">r5.large Memory-Optimized — ₹6,800/mo</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      Instance Quantity: <strong>{currentMod.quantity !== undefined ? currentMod.quantity : 1}</strong>
                    </label>
                    <div className="quantity-counter">
                      <button 
                        className="counter-btn"
                        onClick={() => onUpdateMod(selectedResource.id, { quantity: Math.max(1, (currentMod.quantity !== undefined ? currentMod.quantity : 1) - 1) })}
                      >
                        -
                      </button>
                      <span className="count-display">{currentMod.quantity !== undefined ? currentMod.quantity : 1}</span>
                      <button 
                        className="counter-btn"
                        onClick={() => onUpdateMod(selectedResource.id, { quantity: (currentMod.quantity !== undefined ? currentMod.quantity : 1) + 1 })}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="control-group full-width">
                    <label className="control-label">
                      Target Workload Utilization: <strong>{currentMod.utilization !== undefined ? currentMod.utilization : (selectedResource.cpuUtilization || 50)}%</strong>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      className="control-range"
                      value={currentMod.utilization !== undefined ? currentMod.utilization : (selectedResource.cpuUtilization || 50)}
                      onChange={(e) => onUpdateMod(selectedResource.id, { utilization: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {/* RDS Controls */}
              {selectedResource.type === 'RDS' && (
                <>
                  <div className="control-group">
                    <label className="control-label">Database Instance Class:</label>
                    <select
                      className="control-select"
                      value={currentMod.instanceType || selectedResource.instanceType}
                      onChange={(e) => onUpdateMod(selectedResource.id, { instanceType: e.target.value })}
                    >
                      <option value="db.t3.small">db.t3.small — ₹2,400/mo</option>
                      <option value="db.t3.medium">db.t3.medium — ₹4,800/mo</option>
                      <option value="db.t3.large">db.t3.large — ₹18,900/mo</option>
                      <option value="db.r5.large">db.r5.large High Mem — ₹28,000/mo</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label className="control-label">Storage Volume (gp2 vs gp3):</label>
                    <select
                      className="control-select"
                      value={currentMod.storageType || 'gp2'}
                      onChange={(e) => onUpdateMod(selectedResource.id, { storageType: e.target.value })}
                    >
                      <option value="gp2">General Purpose SSD (gp2)</option>
                      <option value="gp3">Next-Gen SSD (gp3 — 15% cheaper)</option>
                    </select>
                  </div>

                  <div className="control-group full-width">
                    <label className="control-label">
                      Storage Size (GB): <strong>{currentMod.storageGB !== undefined ? currentMod.storageGB : selectedResource.storageGB} GB</strong>
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="3000"
                      step="100"
                      className="control-range"
                      value={currentMod.storageGB !== undefined ? currentMod.storageGB : selectedResource.storageGB}
                      onChange={(e) => onUpdateMod(selectedResource.id, { storageGB: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {/* S3 Controls */}
              {selectedResource.type === 'S3' && (
                <>
                  <div className="control-group">
                    <label className="control-label">Storage Class Tier:</label>
                    <select
                      className="control-select"
                      value={currentMod.storageClass || 'Standard'}
                      onChange={(e) => onUpdateMod(selectedResource.id, { storageClass: e.target.value })}
                    >
                      <option value="Standard">S3 Standard (₹0.76/GB)</option>
                      <option value="Infrequent Access">S3 Infrequent Access (-45% cost)</option>
                      <option value="Glacier Deep Archive">S3 Glacier Deep Archive (-85% cost)</option>
                    </select>
                  </div>

                  <div className="control-group full-width">
                    <label className="control-label">
                      Simulated Storage Volume: <strong>{(currentMod.storageGB !== undefined ? currentMod.storageGB : selectedResource.storageGB)} GB</strong> ({( (currentMod.storageGB !== undefined ? currentMod.storageGB : selectedResource.storageGB) / 1000 ).toFixed(1)} TB)
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="500"
                      className="control-range"
                      value={currentMod.storageGB !== undefined ? currentMod.storageGB : selectedResource.storageGB}
                      onChange={(e) => onUpdateMod(selectedResource.id, { storageGB: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {/* Lambda Controls */}
              {selectedResource.type === 'Lambda' && (
                <div className="control-group full-width">
                  <label className="control-label">
                    Monthly Execution Volume: <strong>{(currentMod.invocations !== undefined ? currentMod.invocations : selectedResource.invocations).toLocaleString('en-IN')}</strong> invocations/mo
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    className="control-range"
                    value={currentMod.invocations !== undefined ? currentMod.invocations : selectedResource.invocations}
                    onChange={(e) => onUpdateMod(selectedResource.id, { invocations: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="removed-notice-box">
              This resource is marked as <strong>Simulated Removed</strong>. It will be excluded from the new monthly spend calculation.
            </div>
          )}
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Virtual Cloud Resource</h3>
              <X size={18} className="cursor-pointer" onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Resource Name:</label>
                <input 
                  type="text" 
                  className="control-input" 
                  value={newResName} 
                  onChange={(e) => setNewResName(e.target.value)} 
                  placeholder="e.g., worker-cluster"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Resource Type:</label>
                <select 
                  className="control-select" 
                  value={newResType} 
                  onChange={(e) => setNewResType(e.target.value)}
                >
                  <option value="EC2">EC2 Instance</option>
                  <option value="RDS">RDS Database</option>
                  <option value="S3">S3 Storage Bucket</option>
                </select>
              </div>

              <div className="form-group">
                <label>Instance / Size Class:</label>
                <select 
                  className="control-select" 
                  value={newResTypeVal} 
                  onChange={(e) => setNewResTypeVal(e.target.value)}
                >
                  <option value="t3.medium">t3.medium — ₹2,800/mo</option>
                  <option value="t3.large">t3.large — ₹4,200/mo</option>
                  <option value="c5.large">c5.large — ₹5,200/mo</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-sm">Add Virtual Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceConfigurator;
