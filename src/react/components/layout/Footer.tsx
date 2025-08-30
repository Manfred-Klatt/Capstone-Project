import React from 'react';
import './Layout.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Animal Crossing Quiz</h4>
            <p>Test your knowledge of Animal Crossing characters and creatures!</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/game">Play Game</a></li>
              <li><a href="/leaderboards.html">Leaderboards</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Account</h4>
            <ul>
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Register</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} Animal Crossing Quiz. All rights reserved.</p>
          <p>
            <a href="/privacy.html">Privacy Policy</a> | 
            <a href="/terms.html">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
