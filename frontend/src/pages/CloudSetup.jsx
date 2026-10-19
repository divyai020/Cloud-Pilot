import React, { useState, useRef } from 'react';
import { 
  Cloud, 
  FileText, 
  Sparkles, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  X, 
  FileJson, 
  Zap, 
  ShieldAlert, 
  Wallet, 
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setUploadedCloudData, resetToDemoData } from '../data/demoData';
import sampleUploadData from '../data/sampleUploadData';

const CloudSetup = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAwsModal, setShowAwsModal] = useState(false);

  // Upload handling state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);

  // AWS form state
  const [awsRoleArn, setAwsRoleArn] = useState('');
  const [awsRegion, setAwsRegion] = useState('ap-south-1');
  const [awsAccountName, setAwsAccountName] = useState('Production AWS Infrastructure');
  const [isConnectingAws, setIsConnectingAws] = useState(false);
  const [awsSuccessMsg, setAwsSuccessMsg] = useState('');

  // 1. Download Sample JSON Template to user's computer
  const handleDownloadSample = (e) => {
    if (e) e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleUploadData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "cloud_pilot_infrastructure.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Parse & Validate JSON
  const processJsonText = (jsonString, fileName, fileSize = 0) => {
    try {
      setUploadError('');
      const data = JSON.parse(jsonString);

      // Basic structure validation
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format: root must be an object.');
      }

      const resourceCount = Array.isArray(data.resources) ? data.resources.length : 0;
      if (resourceCount === 0 && !data.summary && !data.costBreakdown) {
        throw new Error('JSON file is missing "resources" or "summary" sections. Please verify structure.');
      }

      setParsedData(data);
      setUploadedFileName(fileName);
      setFileSizeBytes(fileSize);
    } catch (err) {
      console.error('JSON parsing error:', err);
      setUploadError(err.message || 'Failed to parse JSON file. Please ensure it is valid JSON.');
      setParsedData(null);
    }
  };

  // 3. File Input Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setUploadError('Please select a valid .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      processJsonText(event.target.result, file.name, file.size);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  // 4. Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        setUploadError('Please drop a valid .json file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        processJsonText(event.target.result, file.name, file.size);
      };
      reader.readAsText(file);
    }
  };

  // 5. Quick-load preset
  const handleLoadSamplePreset = (e) => {
    if (e) e.stopPropagation();
    processJsonText(JSON.stringify(sampleUploadData), 'cloud_pilot_infrastructure.json', 3840);
  };

  // 6. Confirm Upload & Proceed to Scanning
  const handleProceedWithUpload = () => {
    if (!parsedData) return;
    setUploadedCloudData(parsedData, uploadedFileName || 'uploaded_cloud_data.json');
    setShowUploadModal(false);
    navigate('/scanning');
  };

  // 7. Option 3: Demo Data
  const handleDemoSelection = () => {
    resetToDemoData();
    navigate('/scanning');
  };

  // 8. Option 1: Live AWS simulated or connected
  const handleAwsConnectSubmit = (e) => {
    e.preventDefault();
    if (!awsRoleArn.trim()) {
      setUploadError('Please provide an AWS IAM Role ARN.');
      return;
    }
    setIsConnectingAws(true);
    setTimeout(() => {
      setIsConnectingAws(false);
      setAwsSuccessMsg('AWS STS connection authorized! Initializing telemetry ingestion...');
      setTimeout(() => {
        resetToDemoData();
        navigate('/scanning');
      }, 900);
    }, 1200);
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1 className="setup-title">Connect your Cloud</h1>
        <p className="setup-subtitle">
          Choose how you want to provide your cloud data to Cloud Pilot.
        </p>
      </div>

      <div className="setup-cards-grid">
        {/* Card 1: Connect AWS */}
        <div className="setup-card">
          <div className="card-icon-wrapper">
            <Cloud size={24} color="var(--accent-purple)" />
          </div>
          <h2 className="card-title">Connect AWS</h2>
          <p className="card-desc">
            Analyze your live AWS environment using Cross-Account IAM Role & STS read-only policy.
          </p>
          <div className="card-spacer"></div>
          <button className="btn-secondary w-full" onClick={() => setShowAwsModal(true)}>
            Connect AWS
          </button>
        </div>

        {/* Card 2: Upload Cloud Data */}
        <div className="setup-card" style={{ border: '1px solid rgba(178, 141, 255, 0.4)', position: 'relative' }}>
          <span className="setup-tag-badge" style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            No Credentials Needed
          </span>
          <div className="card-icon-wrapper" style={{ backgroundColor: 'rgba(178, 141, 255, 0.1)', borderColor: 'rgba(178, 141, 255, 0.3)' }}>
            <FileText size={24} color="var(--accent-purple)" />
          </div>
          <h2 className="card-title">Upload Cloud Data</h2>
          <p className="card-desc">
            Upload JSON format of your cloud resources & costs directly from your computer.
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginBottom: '0.75rem' }}>
            <button 
              type="button"
              className="btn-secondary-sm" 
              style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem 0.5rem', justifyContent: 'center' }}
              onClick={handleDownloadSample}
              title="Download pre-formatted JSON template file to your PC"
            >
              <Download size={14} className="mr-1" /> Get Sample JSON
            </button>
          </div>

          <div className="card-spacer"></div>
          <button className="btn-primary w-full" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} className="mr-2" /> Upload JSON File
          </button>
        </div>

        {/* Card 3: Try Demo Data */}
        <div className="setup-card">
          <div className="card-icon-wrapper">
            <Sparkles size={24} color="#10b981" />
          </div>
          <h2 className="card-title">Try Demo Data</h2>
          <p className="card-desc">
            Explore Cloud Pilot instantly using a preloaded sample environment (5 resources, ₹48.5k/mo).
          </p>
          <div className="card-spacer"></div>
          <button className="btn-secondary w-full" onClick={handleDemoSelection}>
            Try Demo
          </button>
        </div>
      </div>
      
      <div className="setup-footer">
        By connecting your cloud, you agree to Cloud Pilot's <a href="#" className="text-purple">Terms of Service</a> and <a href="#" className="text-purple">Privacy Policy</a>.
      </div>

      {/* ─── MODAL 1: Upload JSON Modal ─── */}
      {showUploadModal && (
        <div className="setup-modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="setup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-header">
              <div className="setup-modal-title">
                <FileJson size={24} color="var(--accent-purple)" />
                <span>Upload Cloud Infrastructure JSON</span>
              </div>
              <button 
                className="setup-modal-close-btn"
                onClick={() => setShowUploadModal(false)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Upload your cloud infrastructure & cost report file in JSON format. All metrics, resources, security findings, and charts will adapt dynamically.
            </p>

            {/* Quick action bar */}
            <div className="setup-quick-actions">
              <button 
                type="button" 
                className="setup-chip-btn" 
                onClick={handleDownloadSample}
              >
                <Download size={14} /> Download Sample JSON to PC
              </button>
              <button 
                type="button" 
                className="setup-chip-btn" 
                onClick={handleLoadSamplePreset}
              >
                <Zap size={14} color="#10b981" /> Quick-Load 10-Resource Profile
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div 
              className={`setup-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".json,application/json" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <div className="setup-dropzone-icon">
                <Upload size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                {isDragging ? 'Drop your JSON file here...' : 'Choose a JSON file or drag it here'}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Accepts <code style={{ color: 'var(--accent-purple)' }}>.json</code> files (e.g. AWS inventory exports, CloudPilot schema)
              </p>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="auth-api-error mb-4" style={{ marginTop: 0 }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Verified File Preview Card */}
            {parsedData && (
              <div className="setup-upload-preview">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CheckCircle size={20} color="#10b981" />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{uploadedFileName}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                        ({formatBytes(fileSizeBytes || 3800)})
                      </span>
                    </div>
                  </div>
                  <span className="env-indicator-pill">
                    <span className="env-indicator-dot"></span> Ready to Scan
                  </span>
                </div>

                <div className="setup-preview-grid">
                  <div className="setup-preview-stat">
                    <span className="setup-preview-stat-label">Discovered Resources</span>
                    <span className="setup-preview-stat-val text-green">
                      {parsedData.resources?.length || parsedData.summary?.activeResources || 10} Resources
                    </span>
                  </div>
                  <div className="setup-preview-stat">
                    <span className="setup-preview-stat-label">Monthly Cloud Spend</span>
                    <span className="setup-preview-stat-val highlight-purple">
                      ₹{(parsedData.summary?.monthlyCost || 115400).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="setup-preview-stat">
                    <span className="setup-preview-stat-label">Security Findings</span>
                    <span className="setup-preview-stat-val text-red">
                      {parsedData.securityFindings?.length || parsedData.summary?.securityIssues || 7} Issues
                    </span>
                  </div>
                  <div className="setup-preview-stat">
                    <span className="setup-preview-stat-label">Potential Savings</span>
                    <span className="setup-preview-stat-val" style={{ color: '#38bdf8' }}>
                      ₹{(parsedData.summary?.potentialSavings || 32800).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn-secondary-sm" 
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary-sm" 
                disabled={!parsedData}
                onClick={handleProceedWithUpload}
                style={{ opacity: parsedData ? 1 : 0.5, cursor: parsedData ? 'pointer' : 'not-allowed' }}
              >
                Proceed to Cloud Scan <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Connect AWS Modal ─── */}
      {showAwsModal && (
        <div className="setup-modal-backdrop" onClick={() => setShowAwsModal(false)}>
          <div className="setup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-header">
              <div className="setup-modal-title">
                <Cloud size={24} color="var(--accent-purple)" />
                <span>Connect Live AWS Account</span>
              </div>
              <button 
                className="setup-modal-close-btn"
                onClick={() => setShowAwsModal(false)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Provide your AWS IAM Role ARN configured with <code style={{ color: 'var(--accent-purple)' }}>SecurityAudit</code> and <code style={{ color: 'var(--accent-purple)' }}>CostAndUsage</code> read-only policies.
            </p>

            <form onSubmit={handleAwsConnectSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  ACCOUNT DISPLAY NAME
                </label>
                <input 
                  type="text"
                  className="auth-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  value={awsAccountName}
                  onChange={(e) => setAwsAccountName(e.target.value)}
                  placeholder="e.g. Production AWS Cloud"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  AWS IAM ROLE ARN
                </label>
                <input 
                  type="text"
                  className="auth-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  value={awsRoleArn}
                  onChange={(e) => setAwsRoleArn(e.target.value)}
                  placeholder="arn:aws:iam::123456789012:role/CloudPilotAuditRole"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  PRIMARY REGION
                </label>
                <select 
                  className="auth-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                >
                  <option value="ap-south-1">ap-south-1 (Asia Pacific - Mumbai)</option>
                  <option value="us-east-1">us-east-1 (US East - N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (US West - Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Europe - Ireland)</option>
                </select>
              </div>

              {awsSuccessMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} />
                  <span>{awsSuccessMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary-sm" 
                  onClick={() => setShowAwsModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-sm"
                  disabled={isConnectingAws}
                >
                  {isConnectingAws ? 'Testing STS AssumeRole...' : 'Validate & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudSetup;
