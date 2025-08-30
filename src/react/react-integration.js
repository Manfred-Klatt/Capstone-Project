import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Login, Register, AuthContainer } from './App';

/**
 * Renders a React component into a DOM element
 * @param {string} containerId - The ID of the container element
 * @param {string} componentType - The type of component to render ('app', 'auth-container', 'login', 'register')
 */
export function renderReactComponent(containerId, componentType) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container with ID "${containerId}" not found`);
    return;
  }
  
  const root = ReactDOM.createRoot(container);
  
  switch (componentType) {
    case 'app':
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </React.StrictMode>
      );
      break;
    
    case 'auth-container':
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <AuthContainer />
            </AuthProvider>
          </BrowserRouter>
        </React.StrictMode>
      );
      break;
    
    case 'login':
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <Login />
            </AuthProvider>
          </BrowserRouter>
        </React.StrictMode>
      );
      break;
    
    case 'register':
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <Register />
            </AuthProvider>
          </BrowserRouter>
        </React.StrictMode>
      );
      break;
    
    default:
      console.error(`Unknown component type: ${componentType}`);
  }
}
