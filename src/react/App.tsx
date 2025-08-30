import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AuthContainer from './components/auth/AuthContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GamePage from './components/game/GamePage';
import HomePage from './components/home/HomePage';
import './index.css';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/game" /> : <AuthContainer initialMode="login" />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/game" /> : <AuthContainer initialMode="register" />
        } />
        <Route path="/auth" element={
          isAuthenticated ? <Navigate to="/game" /> : <AuthContainer />
        } />
        <Route 
          path="/game" 
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;

// Export components for direct use in HTML pages
export { Login, Register, AuthContainer };

