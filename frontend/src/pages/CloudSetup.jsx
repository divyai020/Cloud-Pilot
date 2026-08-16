import React from 'react';
import { Cloud, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CloudSetup = () => {
  const navigate = useNavigate();

  const handleSelection = (type) => {
    console.log(`Selected setup type: ${type}`);
    navigate('/scanning');
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
            <Cloud size={24} color="var(--text-primary)" />
          </div>
          <h2 className="card-title">Connect AWS</h2>
          <p className="card-desc">
            Analyze your live AWS environment.
          </p>
          <div className="card-spacer"></div>
          <button className="btn-primary w-full" onClick={() => handleSelection('aws')}>
            Connect AWS
          </button>
        </div>

        {/* Card 2: Upload Cloud Data */}
        <div className="setup-card">
          <div className="card-icon-wrapper">
            <FileText size={24} color="var(--text-primary)" />
          </div>
          <h2 className="card-title">Upload Cloud Data</h2>
          <p className="card-desc">
            Upload JSON, CSV, or supported cloud cost/resource reports.
          </p>
          <div className="card-spacer"></div>
          <button className="btn-primary w-full" onClick={() => handleSelection('upload')}>
            Upload Data
          </button>
        </div>

        {/* Card 3: Try Demo Data */}
        <div className="setup-card">
          <div className="card-icon-wrapper">
            <Sparkles size={24} color="var(--text-primary)" />
          </div>
          <h2 className="card-title">Try Demo Data</h2>
          <p className="card-desc">
            Explore Cloud Pilot instantly using a preloaded sample environment.
          </p>
          <div className="card-spacer"></div>
          <button className="btn-primary w-full" onClick={() => handleSelection('demo')}>
            Try Demo
          </button>
        </div>
      </div>
      
      <div className="setup-footer">
        By connecting your cloud, you agree to Cloud Pilot's <a href="#" className="text-purple">Terms of Service</a> and <a href="#" className="text-purple">Privacy Policy</a>.
      </div>
    </div>
  );
};

export default CloudSetup;
