import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import appConfig from '../../config/clientConfig';
import './Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standaloneMode, setStandaloneMode] = useState(false);

  const { register, error, clearError } = useAuth();
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
      username?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
    } = {};
    
    // Validate username
    if (!username) {
      errors.username = 'Username is required';
    } else if (username.length > appConfig.maxUsernameLength) {
      errors.username = `Username must be ${appConfig.maxUsernameLength} characters or less`;
    }
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Password confirmation validation
    if (!passwordConfirm) {
      errors.passwordConfirm = 'Please confirm your password';
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
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
      await register(username, email, password, passwordConfirm);
      // Redirect happens automatically via protected route
    } catch (err) {
      console.error('Registration submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle standalone mode
  const handleStandaloneMode = () => {
    if (confirm("Server connection unavailable. Your scores will be saved locally but not shared online. Continue in standalone mode?")) {
      localStorage.setItem('acnh_username', username);
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
        <h2>Create Your Account</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username (max 10 chars)"
              maxLength={10}
              autoComplete="username"
              className={formErrors.username ? 'input-error' : ''}
            />
            {formErrors.username && <div className="error-message">{formErrors.username}</div>}
          </div>
          
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
              placeholder="Create a password (min 6 chars)"
              minLength={6}
              autoComplete="new-password"
              className={formErrors.password ? 'input-error' : ''}
            />
            {formErrors.password && <div className="error-message">{formErrors.password}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className={formErrors.passwordConfirm ? 'input-error' : ''}
            />
            {formErrors.passwordConfirm && <div className="error-message">{formErrors.passwordConfirm}</div>}
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-links">
          <button onClick={handlePlayAsGuest} className="guest-button">
            Play as Guest
          </button>
          <p>
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
