import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CloudSetup from './pages/CloudSetup';
import Scanning from './pages/Scanning';
import Dashboard from './pages/Dashboard';

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
          {/* Redirect to login by default for now */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
