import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Lock, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Clock, 
  Laptop, 
  Sparkles,
  Save,
  Copy,
  Plus
} from 'lucide-react';

const UserProfile = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: 'Divya AI',
    email: 'divya.ai@cloudpilot.internal',
    jobTitle: 'Lead Cloud Architect & FinOps Admin',
    organization: 'CloudPilot Enterprise Inc.',
    timezone: 'Asia/Kolkata (IST +05:30)',
    phone: '+91 98765 43210',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast('Profile information updated successfully!');
    }, 800);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      triggerToast('Please fill in current and new password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerToast('New passwords do not match');
      return;
    }
    triggerToast('Password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const copyApiToken = () => {
    navigator.clipboard.writeText('cp_live_pk_9942a0b12e34f89d00921c');
    setCopiedToken(true);
    triggerToast('API Personal Access Token copied to clipboard!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main profile-page-container">

        {/* User Hero Card */}
        <div className="profile-hero-card">
          <div className="profile-hero-content">
            
            {/* Avatar circle */}
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-ring">
                <span className="profile-avatar-text">DA</span>
              </div>
              <span className="profile-online-dot" title="Active Admin" />
            </div>

            {/* Profile info header */}
            <div className="profile-hero-meta">
              <div className="profile-hero-top">
                <h1 className="profile-user-name">{profileForm.fullName}</h1>
                <span className="profile-role-badge">
                  <Shield size={13} style={{ marginRight: 4 }} /> Super Admin
                </span>
              </div>
              <p className="profile-user-title">{profileForm.jobTitle} • {profileForm.organization}</p>
              
              <div className="profile-quick-stats">
                <div className="quick-stat-item">
                  <Mail size={14} color="#94A3B8" />
                  <span>{profileForm.email}</span>
                </div>
                <div className="quick-stat-item">
                  <Clock size={14} color="#94A3B8" />
                  <span>Member since Oct 2024</span>
                </div>
                <div className="quick-stat-item">
                  <Award size={14} color="#10B981" />
                  <span style={{ color: '#10B981', fontWeight: 600 }}>24 Recommendations Applied</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Governance Stats Banner */}
        <div className="profile-governance-banner">
          <div className="gov-stat-box">
            <div className="gov-stat-val">₹1,45,200</div>
            <div className="gov-stat-lbl">Total Savings Unlocked</div>
          </div>
          <div className="gov-stat-box">
            <div className="gov-stat-val" style={{ color: '#F97316' }}>12</div>
            <div className="gov-stat-lbl">Security Issues Resolved</div>
          </div>
          <div className="gov-stat-box">
            <div className="gov-stat-val" style={{ color: '#A78BFA' }}>99.8%</div>
            <div className="gov-stat-lbl">Cloud Health Score</div>
          </div>
        </div>

        {/* Main 2-column grid */}
        <div className="profile-grid">
          
          {/* Column 1: Personal Details */}
          <div className="profile-card">
            <h3 className="profile-card-title"><User size={18} /> Personal Information</h3>
            <p className="profile-card-sub">Update your account details and contact information.</p>

            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label className="profile-label">Full Name</label>
                <input 
                  type="text" 
                  className="profile-input"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />
              </div>

              <div className="profile-form-group">
                <label className="profile-label">Email Address</label>
                <input 
                  type="email" 
                  className="profile-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label className="profile-label">Job Title</label>
                  <input 
                    type="text" 
                    className="profile-input"
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-label">Organization</label>
                  <input 
                    type="text" 
                    className="profile-input"
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label className="profile-label">Timezone</label>
                  <select 
                    className="profile-input"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata (IST +05:30)">Asia/Kolkata (IST +05:30)</option>
                    <option value="UTC">UTC / GMT</option>
                    <option value="America/New_York (EST)">America/New_York (EST)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                  </select>
                </div>

                <div className="profile-form-group">
                  <label className="profile-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="profile-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="profile-btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
              </button>
            </form>
          </div>

          {/* Column 2: Security & Password */}
          <div className="profile-side-column">
            
            {/* Password Change Card */}
            <div className="profile-card">
              <h3 className="profile-card-title"><Lock size={18} /> Password & Security</h3>
              <p className="profile-card-sub">Ensure your account remains secure with strong authentication.</p>

              <form onSubmit={handlePasswordChange}>
                <div className="profile-form-group">
                  <label className="profile-label">Current Password</label>
                  <input 
                    type="password" 
                    className="profile-input"
                    placeholder="••••••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-label">New Password</label>
                  <input 
                    type="password" 
                    className="profile-input"
                    placeholder="Minimum 8 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="profile-input"
                    placeholder="Repeat new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>

                <button type="submit" className="profile-btn-outline">
                  Update Password
                </button>
              </form>
            </div>

            {/* Personal Access Tokens (API) */}
            <div className="profile-card">
              <div className="profile-card-header-flex">
                <h3 className="profile-card-title" style={{ fontSize: '1rem', margin: 0 }}>
                  <Key size={16} /> Personal Access Token (CLI)
                </h3>
                <span className="token-status-pill">Active</span>
              </div>
              
              <div className="token-box" style={{ marginTop: '0.85rem' }}>
                <code>cp_live_pk_9942a0b12e34f8...</code>
                <button className="token-copy-btn" onClick={copyApiToken}>
                  {copiedToken ? <CheckCircle2 size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="profile-active-sessions">
                <div className="session-title"><Laptop size={14} /> Active Session</div>
                <div className="session-detail">Chrome on Windows • Mumbai, IN (Current)</div>
              </div>
            </div>

          </div>

        </div>

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

export default UserProfile;
