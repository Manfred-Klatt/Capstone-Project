import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <img src="/images/logo.png" alt="Animal Crossing Quiz" />
            <span>Animal Crossing Quiz</span>
          </Link>
        </div>
        
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/game">Play</Link></li>
            <li><a href="/leaderboards.html">Leaderboards</a></li>
            {isAuthenticated ? (
              <>
                <li className="user-greeting">
                  <span>Hello, {user?.username || 'Player'}</span>
                </li>
                <li>
                  <button onClick={handleLogout} className="logout-button">Logout</button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
