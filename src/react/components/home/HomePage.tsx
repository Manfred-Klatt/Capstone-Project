import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🌿 Welcome to the Blathers App Portal! 🌿</h1>
        <p>Play as a guest or sign in to track your progress</p>
        
        {isAuthenticated ? (
          <div className="authenticated-section">
            <h2>Welcome back, {user?.username}!</h2>
            <div className="button-group">
              <Link to="/game" className="primary-button">
                Play Game
              </Link>
              <button onClick={logout} className="secondary-button">
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="button-group">
            <Link to="/game?guest=true" className="primary-button">
              Play as Guest
            </Link>
            <Link to="/login" className="secondary-button">
              Sign In
            </Link>
            <Link to="/register" className="secondary-button">
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
