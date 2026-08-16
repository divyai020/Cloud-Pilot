import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const validate = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (validate()) {
      const storedEmail = localStorage.getItem('mockUserEmail');
      const storedPassword = localStorage.getItem('mockUserPassword');

      if (email === storedEmail && password === storedPassword) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/setup');
      } else if (email === 'demo@cloudpilot.ai' && password === 'demo123') {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/setup');
      } else {
        setErrors({ ...errors, password: 'Invalid email or password' });
      }
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login attempted');
  };

  return (
    <div className="login-container">
      {/* Left Side - Brand Introduction */}
      <div className="login-left">
        <div className="brand-header">
          <img src={logo} alt="Cloud Pilot" className="brand-logo" />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            Understand your cloud.<br />
            <span className="text-purple">Optimize every resource.</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered insights for smarter cloud cost, security, and infrastructure decisions.
          </p>

          <div className="user-avatars">
            <div className="avatar-group">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=1)', backgroundSize: 'cover' }}></div>
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=2)', backgroundSize: 'cover' }}></div>
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=3)', backgroundSize: 'cover' }}></div>
              <div className="avatar">+2k</div>
            </div>
            <span className="text-secondary text-sm">Joined by top engineering teams.</span>
          </div>
        </div>

        {/* Abstract Cloud Visual */}
        <div className="abstract-visual">
          <svg className="connections-svg" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Lines connecting to center */}
            <line x1="40%" y1="45%" x2="60%" y2="63%" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" />
            <line x1="80%" y1="55%" x2="60%" y2="63%" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" />
            <line x1="59.9%" y1="75%" x2="60%" y2="63%" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" />
            
            {/* Central intersection glowing point */}
            <circle cx="60%" cy="63%" r="5" fill="#f59e0b" filter="url(#glow)" />
            
            {/* Node attachment glowing points */}
            <circle cx="40%" cy="45%" r="3" fill="#f59e0b" filter="url(#glow)" />
            <circle cx="80%" cy="55%" r="3" fill="#f59e0b" filter="url(#glow)" />
            <circle cx="60%" cy="75%" r="3" fill="#f59e0b" filter="url(#glow)" />
          </svg>

          <div className="node ec2" style={{ top: '45%', left: '40%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
            <span>EC2</span>
          </div>
          <div className="node s3" style={{ top: '55%', left: '80%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
            <span>S3</span>
          </div>
          <div className="node rds" style={{ top: '75%', left: '60%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
            <span>RDS</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Welcome back</h2>
            <p className="text-secondary text-sm">Please enter your details to sign in.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Remember Me */}
            <div className="checkbox-group">
              <input type="checkbox" id="remember" className="checkbox-input" />
              <label htmlFor="remember" className="checkbox-label">Remember me for 30 days</label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-primary">
              Sign in to Mission Control
            </button>
          </form>

          <div className="divider">Or continue with</div>

          <button type="button" className="btn-secondary" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.81 15.73 17.58V20.35H19.29C21.38 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.29 20.35L15.73 17.58C14.74 18.24 13.48 18.65 12 18.65C9.13 18.65 6.7 16.71 5.82 14.12H2.17V16.95C3.98 20.55 7.69 23 12 23Z" fill="#34A853"/>
              <path d="M5.82 14.12C5.59 13.46 5.46 12.75 5.46 12C5.46 11.25 5.59 10.54 5.82 9.88V7.05H2.17C1.43 8.52 1 10.2 1 12C1 13.8 1.43 15.48 2.17 16.95L5.82 14.12Z" fill="#FBBC05"/>
              <path d="M12 5.35C13.62 5.35 15.07 5.91 16.21 7L19.38 3.83C17.45 2.03 14.96 1 12 1C7.69 1 3.98 3.45 2.17 7.05L5.82 9.88C6.7 7.29 9.13 5.35 12 5.35Z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <div className="login-footer">
            Don't have an account? <Link to="/signup">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
