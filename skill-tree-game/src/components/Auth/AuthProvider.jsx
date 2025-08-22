import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Version to force re-authentication when changed
  const AUTH_VERSION = '2.0';
  const CORRECT_PASSWORD = 'FCAI25!';
  const AUTH_KEY = 'fcai_auth_token';
  const VERSION_KEY = 'fcai_auth_version';

  useEffect(() => {
    // Check authentication status on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedToken = localStorage.getItem(AUTH_KEY);
      const storedVersion = localStorage.getItem(VERSION_KEY);
      
      // Force re-auth if version doesn't match (this handles existing users)
      if (storedToken && storedVersion === AUTH_VERSION) {
        setIsAuthenticated(true);
      } else {
        // Clear old auth data
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(VERSION_KEY);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (password) => {
    if (password === CORRECT_PASSWORD) {
      const token = `authenticated_${Date.now()}`;
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
