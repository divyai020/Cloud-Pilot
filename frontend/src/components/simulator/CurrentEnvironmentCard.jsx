import React from 'react';
import { Server, Database, HardDrive, Zap, Layers, Activity } from 'lucide-react';

const CurrentEnvironmentCard = ({ baselineCost, resources }) => {
  const ec2Count = resources.filter(r => r.type === 'EC2').length;
  const rdsCount = resources.filter(r => r.type === 'RDS').length;
  const s3Count = resources.filter(r => r.type === 'S3').length;
  const lambdaCount = resources.filter(r => r.type === 'Lambda').length;

  return (
    <div className="current-env-card">
      <div className="card-header-row">
        <div className="env-title-group">
          <div className="chart-icon-box">
            <Layers size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 className="card-title">Current Environment Baseline</h3>
            <p className="card-subtitle">Active AWS telemetry inventory</p>
          </div>
        </div>

        <div className="baseline-cost-badge">
          <span className="cost-label">Baseline Cost:</span>
          <span className="cost-val">₹{(baselineCost || 48500).toLocaleString('en-IN')}</span>
          <span className="cost-unit">/mo</span>
        </div>
      </div>

      <div className="resource-summary-grid">
        <div className="summary-item">
          <div className="summary-icon-box ec2-bg">
            <Server size={18} color="#6366F1" />
          </div>
          <div className="summary-info">
            <span className="item-label">EC2 Compute</span>
            <span className="item-val">{ec2Count} Instances</span>
            <span className="item-sub">web-server-prod, api-server</span>
          </div>
        </div>

        <div className="summary-item">
          <div className="summary-icon-box rds-bg">
            <Database size={18} color="#10B981" />
          </div>
          <div className="summary-info">
            <span className="item-label">RDS Database</span>
            <span className="item-val">{rdsCount} Instance</span>
            <span className="item-sub">analytics-db (db.t3.large)</span>
          </div>
        </div>

        <div className="summary-item">
          <div className="summary-icon-box s3-bg">
            <HardDrive size={18} color="#3B82F6" />
          </div>
          <div className="summary-info">
            <span className="item-label">S3 Storage</span>
            <span className="item-val">4,200 GB</span>
            <span className="item-sub">customer-data-backup</span>
          </div>
        </div>

        <div className="summary-item">
          <div className="summary-icon-box lambda-bg">
            <Zap size={18} color="#F59E0B" />
          </div>
          <div className="summary-info">
            <span className="item-label">Lambda Serverless</span>
            <span className="item-val">18,200 Inv</span>
            <span className="item-sub">payment-webhook</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentEnvironmentCard;
