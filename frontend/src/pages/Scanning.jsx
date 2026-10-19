import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2, CheckCircle, ArrowRight, FileJson, Sparkles } from 'lucide-react';
import demoData, { getCloudDataSourceInfo } from '../data/demoData';
import logo from '../assets/images/logo.png';

const Scanning = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const sourceInfo = getCloudDataSourceInfo();

  const steps = sourceInfo.isUploaded ? [
    `Parsing infrastructure resources from "${sourceInfo.fileName}"`,
    `Computing multi-service cost attribution & spend trends`,
    `Evaluating security rules against AWS CIS benchmarks`,
    `Synthesizing cost optimization & right-sizing opportunities`
  ] : [
    "Discovering cloud resources (EC2, S3, RDS, Lambda, IAM)",
    "Analyzing resource utilization",
    "Analyzing cloud costs",
    "Checking security configuration"
  ];

  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => {
        // Random increment between 1 and 3
        const increment = Math.floor(Math.random() * 3) + 1;
        const nextProgress = Math.min(progress + increment, 100);
        
        // Update steps based on progress
        if (nextProgress >= 25 && currentStep === 0) setCurrentStep(1);
        if (nextProgress >= 50 && currentStep === 1) setCurrentStep(2);
        if (nextProgress >= 75 && currentStep === 2) setCurrentStep(3);
        if (nextProgress === 100) setCurrentStep(4);

        setProgress(nextProgress);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setIsComplete(true), 500);
      return () => clearTimeout(timer);
    }
  }, [progress, currentStep]);

  // Circle properties
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (isComplete) {
    return (
      <div className="scanning-container">
        <div className="scanning-header">
          <div className="scanning-logo-wrapper">
            <img src={logo} alt="Cloud Pilot" className="scanning-logo" />
          </div>
          <h1 className="scanning-title">Analysis Complete</h1>
          <p className="scanning-subtitle">
            {sourceInfo.isUploaded 
              ? `Report "${sourceInfo.fileName}" has been successfully parsed and mapped.` 
              : "Your cloud environment has been successfully mapped."}
          </p>
        </div>

        <div className="summary-card">
          <div className="summary-success-icon">
            <div className="success-circle">
              <CheckCircle size={32} color="#10b981" />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span className={`env-indicator-pill ${sourceInfo.isUploaded ? '' : 'demo'}`}>
              <span className="env-indicator-dot"></span>
              {sourceInfo.isUploaded ? `Uploaded Report: ${sourceInfo.fileName}` : 'Preloaded AWS Demo'}
            </span>
          </div>

          <h2 className="summary-title text-center mb-6">Cloud Scan Verified</h2>
          
          <div className="summary-list">
            <div className="summary-list-item">
              <span>Resources analyzed</span>
              <span className="summary-value">{demoData.resources.length}</span>
            </div>
            <div className="summary-list-item">
              <span>Optimization opportunities</span>
              <span className="summary-value highlight-purple">{demoData.recommendations.length}</span>
            </div>
            <div className="summary-list-item">
              <span>Security findings</span>
              <span className="summary-value highlight-red">{demoData.securityFindings.length}</span>
            </div>
            <div className="summary-list-item">
              <span>Estimated monthly cost</span>
              <span className="summary-value" style={{ color: '#38bdf8' }}>
                ₹{demoData.summary.monthlyCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button className="btn-primary w-full mt-6 flex-center" style={{ justifyContent: 'center' }} onClick={() => navigate('/dashboard')}>
            View Dashboard <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>

        <div className="live-summary-bar">
          <div className="live-stat left-stat">
            <span className="stat-label">LIVE SUMMARY</span>
            <span className="stat-status text-green"><CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} /> Complete</span>
          </div>
          <div className="stat-divider"></div>
          <div className="live-stat">
            <span className="stat-value">{demoData.resources.length}</span>
            <span className="stat-label">Resources Discovered</span>
          </div>
          <div className="stat-divider"></div>
          <div className="live-stat">
            <span className="stat-value">₹{demoData.summary.monthlyCost.toLocaleString('en-IN')}</span>
            <span className="stat-label">Est. Monthly Cost</span>
          </div>
          <div className="stat-divider"></div>
          <div className="live-stat right-stat">
            <span className="stat-value highlight-purple">{demoData.recommendations.length}</span>
            <span className="stat-label">Opportunities</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scanning-container">
      <div className="scanning-header">
        <div className="scanning-logo-wrapper">
          <img src={logo} alt="Cloud Pilot" className="scanning-logo" />
        </div>
        <h1 className="scanning-title">
          {sourceInfo.isUploaded ? 'Analyzing Uploaded Infrastructure' : 'Analyzing Your Cloud'}
        </h1>
        <p className="scanning-subtitle">
          {sourceInfo.isUploaded 
            ? `Ingesting cloud report "${sourceInfo.fileName}" and evaluating telemetry...` 
            : "Cloud Pilot is discovering resources and generating insights."}
        </p>
      </div>

      <div className="progress-section">
        <div className="progress-circle-wrapper">
          <svg width="300" height="300" viewBox="0 0 300 300" className="progress-svg">
            <circle 
              cx="150" cy="150" r={radius} 
              fill="transparent" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="2" 
            />
            <circle 
              cx="150" cy="150" r={radius} 
              fill="transparent" 
              stroke="url(#gradient)" 
              strokeWidth="4" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="progress-circle-fill"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent-purple)" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="progress-text-overlay">
            <span className="progress-percentage">{progress}%</span>
            <span className="progress-label">ANALYZING<br/>ENVIRONMENT</span>
          </div>
        </div>
      </div>

      <div className="checklist-section">
        <h3 className="checklist-title">
          {sourceInfo.isUploaded ? `PIPELINE PROGRESS (${sourceInfo.fileName})` : 'ANALYSIS PROGRESS'}
        </h3>
        <div className="checklist-card">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index;
            const isActive = currentStep === index;
            const isPending = currentStep < index;

            return (
              <div key={index} className={`checklist-item ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}>
                <div className="checklist-icon">
                  {isCompleted && <CheckCircle2 size={18} color="#10b981" />}
                  {isActive && <Loader2 size={18} className="spin text-purple" />}
                  {isPending && <Circle size={18} color="rgba(255,255,255,0.2)" />}
                </div>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Scanning;
