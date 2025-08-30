import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Register from './Register';
import './Auth.css';

interface AuthContainerProps {
  initialMode?: 'login' | 'register';
}

const AuthContainer: React.FC<AuthContainerProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to game
  if (isAuthenticated) {
    navigate('/game');
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</h2>
        
        {mode === 'login' ? (
          <>
            <Login />
            <div className="auth-links">
              <p>
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>
                  Sign up
                </a>
              </p>
            </div>
          </>
        ) : (
          <>
            <Register />
            <div className="auth-links">
              <p>
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>
                  Log in
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthContainer;
