import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  PiggyBank, 
  Shield, 
  LineChart, 
  Sliders, 
  Network, 
  Sparkles, 
  Activity, 
  Map, 
  Settings, 
  UserCircle 
} from 'lucide-react';
import logo from '../assets/images/logo.png';

const Sidebar = () => {
  const mainLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { name: 'Resources', icon: <Server size={18} />, path: '/resources' },
    { name: 'Cost Optimization', icon: <PiggyBank size={18} />, path: '/cost' },
    { name: 'Security', icon: <Shield size={18} />, path: '/security' },
    { name: 'Forecast', icon: <LineChart size={18} />, path: '/forecast' },
    { name: 'Simulator', icon: <Sliders size={18} />, path: '/simulator' },
    { name: 'Resource Map', icon: <Network size={18} />, path: '/map' },
    { name: 'AI Assistant', icon: <Sparkles size={18} />, path: '/assistant' },
    { name: 'Activity', icon: <Activity size={18} />, path: '/activity' },
    { name: 'Roadmap', icon: <Map size={18} />, path: '/roadmap' },
  ];

  const bottomLinks = [
    { name: 'Settings', icon: <Settings size={18} />, path: '/settings' },
    { name: 'User Profile', icon: <UserCircle size={18} />, path: '/profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src={logo} alt="Cloud Pilot" className="sidebar-logo" />
        </div>
      </div>
      
      <div className="sidebar-scrollable">
        <nav className="sidebar-nav">
          {mainLinks.map((link) => (
            <NavLink 
              key={link.name} 
              to={link.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <nav className="sidebar-nav">
          {bottomLinks.map((link) => (
            <NavLink 
              key={link.name} 
              to={link.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
