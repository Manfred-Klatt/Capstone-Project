import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import appConfig from '../../config/clientConfig';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standaloneMode, setStandaloneMode] = useState(false);

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Check if we're in standalone mode
  useEffect(() => {
    const checkStandaloneMode = () => {
      return window.location.protocol === 'file:' || 
             localStorage.getItem(appConfig.standaloneModeName) === 'true' || 
             localStorage.getItem(appConfig.standaloneConfirmedName) === 'true';
    };
    
    setStandaloneMode(checkStandaloneMode());
  }, []);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
    } = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // If in standalone mode, show message
    if (standaloneMode) {
      handleStandaloneMode();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      // Redirect happens automatically via protected route
    } catch (err) {
      console.error('Login submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle standalone mode
  const handleStandaloneMode = () => {
    if (confirm("Server connection unavailable. Your scores will be saved locally but not shared online. Continue in standalone mode?")) {
      localStorage.setItem('acnh_username', email.split('@')[0]);
      localStorage.setItem(appConfig.guestModeName, 'true');
      localStorage.setItem(appConfig.standaloneModeName, 'true');
      localStorage.setItem(appConfig.standaloneConfirmedName, 'true');
      navigate('/game?guest=true');
    }
  };

  // Handle play as guest
  const handlePlayAsGuest = () => {
    localStorage.setItem(appConfig.guestModeName, 'true');
    navigate('/game?guest=true');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log In</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className={formErrors.email ? 'input-error' : ''}
            />
            {formErrors.email && <div className="error-message">{formErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={formErrors.password ? 'input-error' : ''}
            />
            {formErrors.password && <div className="error-message">{formErrors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="auth-links">
          <button onClick={handlePlayAsGuest} className="guest-button">
            Play as Guest
          </button>
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
