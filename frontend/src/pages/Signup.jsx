import React, { useState } from 'react';
import { User, Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const validate = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full Name is required';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (validate()) {
      // Mock Backend Save
      localStorage.setItem('mockUserEmail', formData.email);
      localStorage.setItem('mockUserPassword', formData.password);
      localStorage.setItem('isAuthenticated', 'true');
      console.log('Signup successful, redirecting to Setup...');
      navigate('/setup');
    }
  };

  return (
    <div className="centered-container">
      <div className="centered-header">
        <h1 className="centered-title">Cloud Pilot</h1>
        <p className="centered-subtitle">Create an account to begin AI Governance.</p>
      </div>

      <div className="signup-card">
        <form className="login-form" onSubmit={handleSignup}>
          
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="fullName"
                type="text"
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
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

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <KeyRound className="input-icon" size={18} />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          {/* Terms Checkbox */}
          <div className="checkbox-group" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="terms" 
              className="checkbox-input" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <label htmlFor="terms" className="checkbox-label">
              I agree to the <a href="#" className="text-purple">Terms of Service</a> and <a href="#" className="text-purple">Privacy Policy</a>
            </label>
          </div>
          {errors.terms && <span className="error-text" style={{ marginTop: '-0.5rem' }}>{errors.terms}</span>}

          {/* Submit Button */}
          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            Create Account <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
