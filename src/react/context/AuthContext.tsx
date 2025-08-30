import React, { createContext, useContext, useState, useEffect } from 'react';
import appConfig from '../config/clientConfig';

// Define types for our context
interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

const API_URL = appConfig.apiUrl;

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're running in standalone mode
  const isStandaloneMode = (): boolean => {
    return window.location.protocol === 'file:' || 
           localStorage.getItem(appConfig.standaloneModeName) === 'true' || 
           localStorage.getItem(appConfig.standaloneConfirmedName) === 'true';
  };

  // Load user from local storage on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem(appConfig.authTokenName);
        const storedUser = localStorage.getItem(appConfig.userInfoName);
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if in standalone mode
      if (isStandaloneMode()) {
        throw new Error('Server is not available. Please use standalone mode.');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Login failed (${response.status})`);
      }
      
      const data = await response.json();
      
      // Save to state
      setToken(data.token);
      setUser({
        id: data.id,
        username: data.username,
        email: data.email
      });
      
      // Save to local storage
      localStorage.setItem('acnh_token', data.token);
      localStorage.setItem('acnh_user', JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email
      }));
      localStorage.removeItem('acnh_guest');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    username: string, 
    email: string, 
    password: string, 
    passwordConfirm: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if in standalone mode
      if (isStandaloneMode()) {
        throw new Error('Server is not available. Please use standalone mode.');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          passwordConfirm 
        }),
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Registration failed (${response.status})`);
      }
      
      const data = await response.json();
      
      // Save to state
      setToken(data.token);
      setUser({
        id: data.id,
        username: data.username,
        email: data.email
      });
      
      // Save to local storage
      localStorage.setItem('acnh_token', data.token);
      localStorage.setItem('acnh_user', JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email
      }));
      localStorage.removeItem('acnh_guest');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear local storage
    localStorage.removeItem(appConfig.authTokenName);
    localStorage.removeItem(appConfig.userInfoName);
  };

  // Clear error function
  const clearError = (): void => {
    setError(null);
  };

  // Create the context value object
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
