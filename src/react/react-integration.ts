// This script handles the integration of React components into existing HTML pages
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AuthContainer from './components/auth/AuthContainer';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Import CSS
import './index.css';
import '../css/shared-variables.css';
import './components/layout/AppLayout.css';
import './components/layout/Layout.css';

// Function to create a layout wrapper with header and footer
const createLayoutWrapper = (Component: React.ComponentType) => {
  return React.createElement(
    'div',
    { className: 'app-layout' },
    React.createElement(Header, null),
    React.createElement('main', { className: 'app-main' }, React.createElement(Component, null)),
    React.createElement(Footer, null)
  );
};

// Function to determine which component to render based on the container ID
const renderReactComponent = (containerId: string, elementId: string) => {
  const container = document.getElementById(containerId);
  const reactRoot = document.getElementById(elementId);
  
  if (!container || !reactRoot) return;
  
  // Create React root
  const root = ReactDOM.createRoot(reactRoot);
  
  // Determine which component to render based on the container ID
  switch (containerId) {
    case 'login-container':
      root.render(
        React.createElement(React.StrictMode, null,
          React.createElement(BrowserRouter, null,
            React.createElement(AuthProvider, null,
              createLayoutWrapper(Login)
            )
          )
        )
      );
      break;
    case 'register-container':
      root.render(
        React.createElement(React.StrictMode, null,
          React.createElement(BrowserRouter, null,
            React.createElement(AuthProvider, null,
              createLayoutWrapper(Register)
            )
          )
        )
      );
      break;
    case 'auth-container':
      root.render(
        React.createElement(React.StrictMode, null,
          React.createElement(BrowserRouter, null,
            React.createElement(AuthProvider, null,
              createLayoutWrapper(AuthContainer)
            )
          )
        )
      );
      break;
    case 'header-container':
      root.render(
        React.createElement(React.StrictMode, null,
          React.createElement(BrowserRouter, null,
            React.createElement(AuthProvider, null,
              React.createElement(Header, null)
            )
          )
        )
      );
      break;
    case 'footer-container':
      root.render(
        React.createElement(React.StrictMode, null,
          React.createElement(BrowserRouter, null,
            React.createElement(Footer, null)
          )
        )
      );
      break;
    default:
      console.error(`Unknown container ID: ${containerId}`);
  }
};

// Initialize React components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the login/register page
  const loginContainer = document.getElementById('login-container');
  const registerContainer = document.getElementById('register-container');
  const authContainer = document.getElementById('auth-container');
  
  if (loginContainer) {
    // Create a div for React to render into
    const reactRoot = document.createElement('div');
    reactRoot.id = 'react-login-root';
    loginContainer.appendChild(reactRoot);
    
    // Render the Login component
    renderReactComponent('login-container', 'react-login-root');
  }
  
  if (registerContainer) {
    // Create a div for React to render into
    const reactRoot = document.createElement('div');
    reactRoot.id = 'react-register-root';
    registerContainer.appendChild(reactRoot);
    
    // Render the Register component
    renderReactComponent('register-container', 'react-register-root');
  }
  
  if (authContainer) {
    // Create a div for React to render into
    const reactRoot = document.createElement('div');
    reactRoot.id = 'react-auth-root';
    authContainer.appendChild(reactRoot);
    
    // Render the AuthContainer component
    renderReactComponent('auth-container', 'react-auth-root');
  }
});

export { renderReactComponent };
