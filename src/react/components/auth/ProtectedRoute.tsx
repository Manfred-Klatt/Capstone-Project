import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is playing as guest
    const urlParams = new URLSearchParams(location.search);
    const guestParam = urlParams.get('guest');
    const localStorageGuest = localStorage.getItem('acnh_guest');
    
    setIsGuest(guestParam === 'true' || localStorageGuest === 'true');
  }, [location]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Allow access if authenticated or playing as guest
  if (isAuthenticated || isGuest) {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  return <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default ProtectedRoute;
