import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(token);
      
      if (parsed && parsed.userData) {
        setIsAuthenticated(true);
        setUser(parsed.userData);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    }
    
    setIsLoading(false);
  };

  const login = (tokenData) => {
    try {
      localStorage.setItem('token', JSON.stringify(tokenData));
      setIsAuthenticated(true);
      setUser(tokenData.userData);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;