import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CloudSetup from './pages/CloudSetup';
import Scanning from './pages/Scanning';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import CostOptimization from './pages/CostOptimization';
import Security from './pages/Security';
import Forecast from './pages/Forecast';
import Simulator from './pages/Simulator';
import ResourceMap from './pages/ResourceMap';
import AIAssistant from './pages/AIAssistant';
import Roadmap from './pages/Roadmap';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/setup" element={<CloudSetup />} />
          <Route path="/scanning" element={<Scanning />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/cost-optimization" element={<CostOptimization />} />
          <Route path="/security" element={<Security />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/map" element={<ResourceMap />} />
          <Route path="/resource-map" element={<ResourceMap />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* Redirect to login by default for now */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
