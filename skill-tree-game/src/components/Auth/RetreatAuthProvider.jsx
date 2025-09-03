import React, { createContext, useContext, useState, useEffect } from 'react';

const RetreatAuthContext = createContext();

export const useRetreatAuth = () => {
  const context = useContext(RetreatAuthContext);
  if (!context) {
    throw new Error('useRetreatAuth must be used within a RetreatAuthProvider');
  }
  return context;
};

const RetreatAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Retreat-specific configuration
  const RETREAT_PASSWORD = 'LLRETREAT!';
  const AUTH_KEY = 'retreat_auth_token';
  const VERSION_KEY = 'retreat_auth_version';
  const AUTH_VERSION = '1.0';

  useEffect(() => {
    // Check authentication status on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedToken = localStorage.getItem(AUTH_KEY);
      const storedVersion = localStorage.getItem(VERSION_KEY);
      
      // Check if user is authenticated and version matches
      if (storedToken && storedVersion === AUTH_VERSION) {
        setIsAuthenticated(true);
      } else {
        // Clear old auth data
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(VERSION_KEY);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking retreat auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (password) => {
    if (password === RETREAT_PASSWORD) {
      const token = `retreat_authenticated_${Date.now()}`;
      localStorage.setItem(AUTH_KEY, token);
      localStorage.setItem(VERSION_KEY, AUTH_VERSION);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect password' };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(VERSION_KEY);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <RetreatAuthContext.Provider value={value}>
      {children}
    </RetreatAuthContext.Provider>
  );
};

export default RetreatAuthProvider;
