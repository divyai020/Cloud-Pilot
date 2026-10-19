import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  AlertTriangle, 
  Wallet, 
  AlertCircle, 
  Bell, 
  Calendar, 
  UserCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const ROADMAP_STEPS = [
  {
    id: 1,
    stepNum: '01',
    title: 'Fix Critical Issues',
    badge: 'Critical',
    badgeType: 'critical',
    titleColor: '#FF6B6B',
    subtitle: 'Public S3 bucket',
    detail: 'Security risk: High',
    action: 'Block public access',
    impact: 'High',
    btnText: 'Resolve Now',
    btnVariant: 'critical',
    alignment: 'right'
  },
  {
    id: 2,
    stepNum: '02',
    title: 'Reduce Cloud Waste',
    badge: 'High',
    badgeType: 'high',
    titleColor: '#F97316',
    subtitle: '2 underutilized EC2 instances',
    action: 'Downsize instances',
    saving: '₹4,200/month',
    btnText: 'Review Instances',
    btnVariant: 'outline',
    alignment: 'left'
  },
  {
    id: 3,
    stepNum: '03',
    title: 'Optimize Storage',
    badge: 'Medium',
    badgeType: 'medium',
    titleColor: '#EAB308',
    subtitle: 'Unused EBS volumes',
    action: 'Remove or archive',
    saving: '₹2,100/month',
    btnText: 'Review Volumes',
    btnVariant: 'outline',
    alignment: 'right'
  },
  {
    id: 4,
    stepNum: '04',
    title: 'Reserved Instance Commit',
    badge: 'Medium',
    badgeType: 'medium',
    titleColor: '#3B82F6',
    subtitle: 'RDS db.t3.large database',
    action: 'Purchase 1-yr Reserved Instance',
    saving: '₹6,500/month',
    btnText: 'Apply Recommendation',
    btnVariant: 'outline',
    alignment: 'left'
  },
  {
    id: 5,
    stepNum: '05',
    title: 'Achieve Optimal Posture',
    badge: 'Goal',
    badgeType: 'goal',
    titleColor: '#10B981',
    subtitle: 'Optimized Cloud Infrastructure',
    action: 'Maintain automated security & cost policies',
    impact: '₹12,800 total monthly savings',
    btnText: 'View Summary',
    btnVariant: 'success',
    alignment: 'right'
  }
];

const ACTION_DETAIL = {
  1: "✅ Public S3 bucket access has been blocked. Your data is now private.",
  2: "✅ Instance review scheduled — downsize recommendations queued for your approval.",
  3: "✅ EBS volume audit initiated — unused volumes flagged for deletion/archiving.",
  4: "✅ Reserved Instance purchase workflow triggered — 1-yr RDS RI order staged.",
  5: "🎉 All optimizations applied! Your cloud is now cost-efficient and secure."
};

const Roadmap = () => {
  const [resolvedSteps, setResolvedSteps] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const resolvedCount = Object.keys(resolvedSteps).length;
  const totalSteps = 5;
  const progressPct = Math.round((resolvedCount / totalSteps) * 100);
  const allDone = resolvedCount === totalSteps;

  const handleAction = (step) => {
    setResolvedSteps(prev => ({ ...prev, [step.id]: true }));
    setToastMessage(ACTION_DETAIL[step.id] || `✅ Action completed for: ${step.title}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main roadmap-page-container">
        
        {/* Top Navbar Header */}
        <div className="roadmap-top-bar">
          <div>
            <h1 className="roadmap-main-title">Your AI Optimization Roadmap</h1>
            <p className="roadmap-subtitle">Here's what Cloud Pilot recommends you improve first. Click each action button to apply the recommendation.</p>
          </div>
          <div className="roadmap-top-actions">
            <button className="roadmap-icon-btn" title="Notifications">
              <Bell size={18} />
            </button>
            <button className="roadmap-icon-btn" title="Calendar">
              <Calendar size={18} />
            </button>
            <div className="roadmap-user-avatar" title="User Profile">
              <UserCircle size={24} color="#A78BFA" />
            </div>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="roadmap-stats-grid">
          
          {/* Card 1 */}
          <div className="roadmap-stat-card">
            <div className="roadmap-stat-icon-wrap icon-warning">
              <AlertTriangle size={20} className="stat-icon-danger" />
            </div>
            <div className="roadmap-stat-content">
              <div className="roadmap-stat-value">5</div>
              <div className="roadmap-stat-label">Issues Found</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="roadmap-stat-card">
            <div className="roadmap-stat-icon-wrap icon-savings">
              <Wallet size={20} className="stat-icon-savings" />
            </div>
            <div className="roadmap-stat-content">
              <div className="roadmap-stat-value">₹12,800</div>
              <div className="roadmap-stat-label">Potential Savings</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="roadmap-stat-card">
            <div className="roadmap-stat-icon-wrap icon-priority">
              <AlertCircle size={20} className="stat-icon-priority" />
            </div>
            <div className="roadmap-stat-content">
              <div className="roadmap-stat-value">3</div>
              <div className="roadmap-stat-label">High-Priority Actions</div>
            </div>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="roadmap-progress-bar-wrap">
          <div className="roadmap-progress-bar-header">
            <span className="roadmap-progress-label">Optimization Progress</span>
            <span className="roadmap-progress-count">{resolvedCount} / {totalSteps} actions completed</span>
          </div>
          <div className="roadmap-progress-track">
            <div
              className="roadmap-progress-fill"
              style={{ width: `${progressPct}%`, background: allDone ? '#10B981' : 'linear-gradient(90deg, #A78BFA, #38BDF8)' }}
            />
          </div>
          {allDone && (
            <div className="roadmap-all-done-banner">
              <Sparkles size={16} color="#A78BFA" />
              <span>🎉 All optimizations applied! You're saving <strong>₹12,800/month</strong> and your security posture is now optimized.</span>
            </div>
          )}
        </div>

        {/* Interactive Roadmap Timeline */}
        <div className="roadmap-timeline-section">
          {/* Central Vertical Line */}
          <div className="roadmap-vertical-line" />

          {/* Roadmap Steps */}
          <div className="roadmap-steps-list">
            {ROADMAP_STEPS.map((step) => {
              const isResolved = !!resolvedSteps[step.id];

              return (
                <div 
                  key={step.id} 
                  className={`roadmap-step-row ${step.alignment}-align`}
                >
                  
                  {/* Step Marker Pin (Center) */}
                  <div className={`roadmap-step-pin pin-${step.badgeType} ${isResolved ? 'pin-resolved' : ''}`}>
                    {isResolved ? <CheckCircle2 size={18} color="#FFFFFF" /> : step.stepNum}
                  </div>

                  {/* Content Card */}
                  <div className={`roadmap-step-card card-${step.badgeType} ${isResolved ? 'card-completed' : ''}`}>
                    
                    {/* Card Header */}
                    <div className="roadmap-card-header">
                      <h3 className="roadmap-card-title" style={{ color: isResolved ? '#10B981' : step.titleColor }}>
                        {step.title}
                      </h3>
                      <span className={`roadmap-badge badge-${step.badgeType}`}>
                        {isResolved ? 'Resolved' : step.badge}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="roadmap-card-body">
                      <p className="roadmap-card-subtitle">{step.subtitle}</p>
                      
                      {step.detail && (
                        <div className="roadmap-card-meta">
                          <span className="meta-label">Detail:</span> {step.detail}
                        </div>
                      )}
                      
                      {step.action && (
                        <div className="roadmap-card-meta">
                          <span className="meta-label">Action:</span> {step.action}
                        </div>
                      )}

                      {step.impact && (
                        <div className="roadmap-card-meta">
                          <span className="meta-label">Impact:</span> {step.impact}
                        </div>
                      )}

                      {step.saving && (
                        <div className="roadmap-card-meta">
                          <span className="meta-label">Est. Saving:</span> <strong className="saving-highlight">{step.saving}</strong>
                        </div>
                      )}
                    </div>

                    {/* Card Action Button */}
                    <div className="roadmap-card-footer">
                      <button 
                        className={`roadmap-action-btn btn-${isResolved ? 'done' : step.btnVariant}`}
                        onClick={() => handleAction(step)}
                        disabled={isResolved}
                      >
                        {isResolved ? (
                          <>
                            <CheckCircle2 size={16} /> Completed
                          </>
                        ) : (
                          step.btnText
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Toast feedback */}
        {toastMessage && (
          <div className="roadmap-toast">
            <Sparkles size={16} color="#A78BFA" />
            <div>
              <div className="roadmap-toast-title">Action Applied</div>
              <div className="roadmap-toast-body">{toastMessage}</div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Roadmap;
