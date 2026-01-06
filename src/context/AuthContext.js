import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

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

  const logout = async () => {
    // Notify React Native about logout
    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'logout',
          timestamp: Date.now(),
        })
      );
    }

    // Delete Firebase token before clearing local storage
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const parsedToken = JSON.parse(token);
        const authToken = parsedToken.token || parsedToken;

        await axios.delete(`${window.location.origin}/deleteFirebaseToken`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log('Firebase token deleted during logout');
      }
    } catch (error) {
      console.warn('Failed to delete Firebase token during logout:', error);
    }

    // Clear local storage and state
    localStorage.removeItem('token');
    localStorage.setItem('userLoggedOut', 'true'); // Mark as manually logged out
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/mobile/login';
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
