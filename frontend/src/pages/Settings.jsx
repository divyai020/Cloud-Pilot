import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Sliders, 
  Cloud, 
  Bell, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Save, 
  Key, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  Lock,
  Sparkles,
  Zap,
  Globe,
  Mail,
  MessageSquare
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    scanFrequency: 'hourly',
    currency: 'INR',
    autoRemediation: true,
    dataRetentionDays: '90',
    environment: 'production',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    slackWebhook: 'https://hooks.slack.com/services/T00/B00/XXXXXX',
    slackEnabled: true,
    criticalOnly: false,
    weeklyReport: true,
    budgetAlertThreshold: '80',
  });

  const [cloudAccounts, setCloudAccounts] = useState([
    { id: 1, provider: 'AWS', name: 'Production Infrastructure', accountId: '9842-1029-4481', region: 'ap-south-1 (Mumbai)', status: 'Active', lastSync: '2 minutes ago' },
    { id: 2, provider: 'AWS', name: 'Staging & Sandbox', accountId: '4412-8890-1123', region: 'us-east-1 (N. Virginia)', status: 'Active', lastSync: '15 minutes ago' },
    { id: 3, provider: 'GCP', name: 'BigData Analytics Cluster', accountId: 'cp-prod-analytics-01', region: 'asia-south1', status: 'Paused', lastSync: '2 hours ago' },
  ]);

  const [securityRules, setSecurityRules] = useState({
    cisBenchmark: true,
    soc2Rules: true,
    pciDssRules: false,
    autoBlockPublicS3: true,
    enforceMfaAllUsers: true,
    flagUnusedKeyAgeDays: '90',
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast('Settings updated successfully!');
    }, 800);
  };

  const toggleAccountStatus = (id) => {
    setCloudAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const nextStatus = acc.status === 'Active' ? 'Paused' : 'Active';
        triggerToast(`${acc.name} status updated to ${nextStatus}`);
        return { ...acc, status: nextStatus };
      }
      return acc;
    }));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main settings-page-container">

        {/* Page Header */}
        <div className="settings-header">
          <div>
            <h1 className="settings-title">System & Cloud Settings</h1>
            <p className="settings-subtitle">Manage cloud integrations, scanning frequency, notification webhooks, and security policies.</p>
          </div>
          <button 
            className="settings-save-btn" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="settings-tabs-row">
          <button 
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Sliders size={16} /> General & Scanning
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <Cloud size={16} /> Cloud Accounts ({cloudAccounts.length})
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} /> Alerts & Webhooks
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <ShieldCheck size={16} /> Compliance & Security
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <CreditCard size={16} /> Plan & Billing
          </button>
        </div>

        {/* TAB 1: GENERAL & SCANNING */}
        {activeTab === 'general' && (
          <div className="settings-section-grid">
            <div className="settings-card">
              <h3 className="settings-card-title">Infrastructure Scanning Config</h3>
              <p className="settings-card-desc">Control how often CloudPilot queries your cloud providers for resource state and metrics.</p>

              <div className="settings-field-group">
                <label className="settings-label">Automated Scan Frequency</label>
                <select 
                  className="settings-input"
                  value={generalForm.scanFrequency}
                  onChange={(e) => setGeneralForm({ ...generalForm, scanFrequency: e.target.value })}
                >
                  <option value="realtime">Real-time Stream (CloudWatch Event Bridge)</option>
                  <option value="hourly">Hourly Deep Scan (Recommended)</option>
                  <option value="daily">Daily Scheduled Scan (00:00 UTC)</option>
                  <option value="manual">Manual Trigger Only</option>
                </select>
              </div>

              <div className="settings-field-group">
                <label className="settings-label">Primary Display Currency</label>
                <select 
                  className="settings-input"
                  value={generalForm.currency}
                  onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })}
                >
                  <option value="INR">₹ INR - Indian Rupee</option>
                  <option value="USD">$ USD - US Dollar</option>
                  <option value="EUR">€ EUR - Euro</option>
                  <option value="GBP">£ GBP - British Pound</option>
                </select>
              </div>

              <div className="settings-field-group">
                <label className="settings-label">Log & Metrics Retention Period</label>
                <select 
                  className="settings-input"
                  value={generalForm.dataRetentionDays}
                  onChange={(e) => setGeneralForm({ ...generalForm, dataRetentionDays: e.target.value })}
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days (Standard Audit Trail)</option>
                  <option value="180">180 Days</option>
                  <option value="365">365 Days (1 Year Compliance)</option>
                </select>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="toggle-title">Appearance & Theme</div>
                  <div className="toggle-sub">Switch between Dark Mode and Light Mode interface.</div>
                </div>
                <ThemeToggle showLabel={true} />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="toggle-title">AI Auto-Remediation Engine</div>
                  <div className="toggle-sub">Allow AI Assistant to execute approved low-risk quick-fix actions directly.</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={generalForm.autoRemediation}
                    onChange={(e) => setGeneralForm({ ...generalForm, autoRemediation: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title">Default Environment Scope</h3>
              <p className="settings-card-desc">Set default scope for cost calculation models and risk analysis heuristics.</p>

              <div className="settings-field-group">
                <label className="settings-label">Primary Cloud Environment</label>
                <select 
                  className="settings-input"
                  value={generalForm.environment}
                  onChange={(e) => setGeneralForm({ ...generalForm, environment: e.target.value })}
                >
                  <option value="production">Production & Critical Services</option>
                  <option value="staging">Staging & QA</option>
                  <option value="development">Dev & Experimental</option>
                  <option value="all">All Combined Infrastructure</option>
                </select>
              </div>

              <div className="settings-info-box">
                <Zap size={18} color="#A78BFA" />
                <div>
                  <strong>AI Copilot Active:</strong> Scanning is utilizing CloudPilot Model v2.4 with instant heuristic risk evaluation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLOUD ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="settings-card">
            <div className="settings-card-header-flex">
              <div>
                <h3 className="settings-card-title">Connected Cloud Accounts</h3>
                <p className="settings-card-desc">AWS, Azure, and GCP credentials configured via cross-account IAM roles or service accounts.</p>
              </div>
              <button className="settings-btn-primary" onClick={() => triggerToast('Opening Cloud Account Connector wizard...')}>
                <Plus size={16} /> Connect New Account
              </button>
            </div>

            <div className="settings-accounts-list">
              {cloudAccounts.map(acc => (
                <div key={acc.id} className="settings-account-item">
                  <div className="account-provider-badge">
                    <Cloud size={20} color={acc.provider === 'AWS' ? '#FF9900' : '#4285F4'} />
                    <span>{acc.provider}</span>
                  </div>

                  <div className="account-info">
                    <div className="account-name">{acc.name}</div>
                    <div className="account-id">ID: <code>{acc.accountId}</code> • Region: {acc.region}</div>
                  </div>

                  <div className="account-sync-meta">
                    <span className={`status-pill status-${acc.status.toLowerCase()}`}>
                      <CheckCircle2 size={12} /> {acc.status}
                    </span>
                    <span className="sync-time">Last sync: {acc.lastSync}</span>
                  </div>

                  <div className="account-actions">
                    <button 
                      className="settings-btn-outline"
                      onClick={() => toggleAccountStatus(acc.id)}
                    >
                      {acc.status === 'Active' ? 'Pause Sync' : 'Resume Sync'}
                    </button>
                    <button 
                      className="settings-btn-icon" 
                      title="Test Connection"
                      onClick={() => triggerToast(`Connection test passed for ${acc.name}!`)}
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="settings-section-grid">
            <div className="settings-card">
              <h3 className="settings-card-title">Email & Digest Alerts</h3>
              <p className="settings-card-desc">Configure email alert frequency for anomaly spikes and security breaches.</p>

              <div className="settings-toggle-row">
                <div>
                  <div className="toggle-title"><Mail size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Email Notifications</div>
                  <div className="toggle-sub">Receive instant alerts for Critical security vulnerabilities and budget spikes.</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <div className="toggle-title">Weekly Cloud Summary Digest</div>
                  <div className="toggle-sub">Receive a consolidated PDF report every Monday at 09:00 AM IST.</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.weeklyReport}
                    onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="settings-field-group" style={{ marginTop: '1.5rem' }}>
                <label className="settings-label">Budget Overrun Alert Threshold (% of budget)</label>
                <input 
                  type="number" 
                  className="settings-input"
                  value={notifications.budgetAlertThreshold}
                  onChange={(e) => setNotifications({ ...notifications, budgetAlertThreshold: e.target.value })}
                />
              </div>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title"><MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Slack Integration</h3>
              <p className="settings-card-desc">Send real-time alerts directly into your DevOps Slack channels.</p>

              <div className="settings-toggle-row">
                <div>
                  <div className="toggle-title">Slack Webhook Notifications</div>
                  <div className="toggle-sub">Post cloud event cards to designated channel.</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={notifications.slackEnabled}
                    onChange={(e) => setNotifications({ ...notifications, slackEnabled: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="settings-field-group">
                <label className="settings-label">Incoming Webhook URL</label>
                <input 
                  type="text" 
                  className="settings-input"
                  value={notifications.slackWebhook}
                  onChange={(e) => setNotifications({ ...notifications, slackWebhook: e.target.value })}
                />
              </div>

              <button 
                className="settings-btn-outline" 
                style={{ marginTop: '0.5rem' }}
                onClick={() => triggerToast('Slack test alert sent to #cloud-alerts channel!')}
              >
                Send Test Slack Message
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: COMPLIANCE & SECURITY */}
        {activeTab === 'security' && (
          <div className="settings-card">
            <h3 className="settings-card-title">Compliance Frameworks & Automated Enforcements</h3>
            <p className="settings-card-desc">Enable standard security benchmarks to automatically audit your cloud resources daily.</p>

            <div className="settings-toggle-row">
              <div>
                <div className="toggle-title">CIS Amazon Web Services Foundations Benchmark v1.4.0</div>
                <div className="toggle-sub">Audit root account MFA, IAM policies, CloudTrail logging, and S3 bucket encryption.</div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={securityRules.cisBenchmark}
                  onChange={(e) => setSecurityRules({ ...securityRules, cisBenchmark: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="toggle-title">SOC 2 Type II Compliance Scanning</div>
                <div className="toggle-sub">Ensure continuous access controls, data encryption at rest, and audit trail preservation.</div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={securityRules.soc2Rules}
                  onChange={(e) => setSecurityRules({ ...securityRules, soc2Rules: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="toggle-title">Auto-Block Public S3 Buckets</div>
                <div className="toggle-sub">Automatically apply 'Block Public Access' configuration if a new bucket is created without encryption.</div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={securityRules.autoBlockPublicS3}
                  onChange={(e) => setSecurityRules({ ...securityRules, autoBlockPublicS3: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: BILLING & SUBSCRIPTION */}
        {activeTab === 'billing' && (
          <div className="settings-section-grid">
            <div className="settings-card">
              <div className="plan-badge-row">
                <span className="plan-pill">PRO PLAN</span>
                <span className="plan-status">Active Subscription</span>
              </div>
              <h3 className="settings-card-title" style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>
                CloudPilot Enterprise Suite
              </h3>
              <p className="settings-card-desc">Monitoring up to 100 cloud resources with real-time AI optimization.</p>

              <div className="plan-usage-meter">
                <div className="meter-labels">
                  <span>Monitored Resources</span>
                  <strong>38 / 100 Used</strong>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: '38%' }} />
                </div>
              </div>

              <button className="settings-btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => triggerToast('Subscription plan details loaded.')}>
                Manage Subscription & Billing Info
              </button>
            </div>

            <div className="settings-card">
              <h3 className="settings-card-title">Recent Invoices</h3>
              <div className="invoice-list">
                <div className="invoice-item">
                  <div>
                    <div className="invoice-date">Oct 1, 2026</div>
                    <div className="invoice-num">INV-2026-1001</div>
                  </div>
                  <div className="invoice-right">
                    <span className="invoice-amount">₹14,999</span>
                    <span className="invoice-paid">Paid</span>
                  </div>
                </div>

                <div className="invoice-item">
                  <div>
                    <div className="invoice-date">Sep 1, 2026</div>
                    <div className="invoice-num">INV-2026-0901</div>
                  </div>
                  <div className="invoice-right">
                    <span className="invoice-amount">₹14,999</span>
                    <span className="invoice-paid">Paid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="roadmap-toast">
            <Sparkles size={16} color="#A78BFA" />
            <span>{toastMessage}</span>
          </div>
        )}

      </main>
    </div>
  );
};

export default Settings;
