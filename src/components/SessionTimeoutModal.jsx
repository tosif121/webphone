import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, WifiOff, UserX } from 'lucide-react';
import { applyAgentUiPreferencesToDom } from '@/utils/agent-preferences';

const SessionTimeoutModal = ({ isOpen, onClose, onLoginSuccess, userLogin, customMessage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const performLogin = async (username, password) => {
    const apiOrigin =
      typeof window !== 'undefined' && window.location.origin ? window.location.origin : '${window.location.origin}';
    const { data: response } = await axios.post(
      `${apiOrigin}/userlogin/${username}`,
      { username, password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      },
    );

    if (!response || response.success === false) {
      throw new Error(response?.message || 'Login failed');
    }
    return response;
  };

  const handleReLogin = async (retries = 3) => {
    if (!isClient) return;

    let savedUsername =
      typeof window !== 'undefined' ? localStorage.getItem('savedUsername') || localStorage.getItem('username') : null;
    let savedPassword =
      typeof window !== 'undefined' ? localStorage.getItem('savedPassword') || localStorage.getItem('password') : null;

    if ((!savedUsername || !savedPassword) && typeof window !== 'undefined') {
      try {
        const tokenStr = localStorage.getItem('token');
        if (tokenStr) {
          const tokenObj = JSON.parse(tokenStr);
          savedUsername =
            savedUsername ||
            tokenObj?.savedUsername ||
            tokenObj?.username ||
            tokenObj?.userData?.username ||
            tokenObj?.user;
          savedPassword =
            savedPassword ||
            tokenObj?.savedPassword ||
            tokenObj?.password ||
            tokenObj?.userData?.password ||
            tokenObj?.userData?.savedPassword;
        }
      } catch (_) {}
    }

    if (!savedUsername || !savedPassword) {
      setError('No saved credentials found. Please login manually.');
      return;
    }

    setError('');
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (attempt > 0) {
        setError(`Connection issue, retrying (${attempt}/${retries})...`);
      }
      setIsLoading(true);

      try {
        const response = await performLogin(savedUsername, savedPassword);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', JSON.stringify(response));
          localStorage.setItem('savedUsername', savedUsername);
          localStorage.setItem('savedPassword', savedPassword);
          if (response?.userData?.uiPreferences) {
            applyAgentUiPreferencesToDom(response.userData.uiPreferences);
          }
          // Restore agent ready state on backend
          try {
            await axios.post(
              `${window.location.origin}/userready/${savedUsername}/Web`,
              {},
              { headers: { 'Content-Type': 'application/json' } },
            );
          } catch (_) {}
        }
        onLoginSuccess();
        return;
      } catch (err) {
        console.error(`Re-login attempt ${attempt + 1} failed:`, err);
        lastError = err;

        // Auth errors - retrying will not help, stop immediately
        if (err.response?.status === 401 || err.response?.status === 404) {
          setError(
            err.response?.status === 401
              ? 'Invalid credentials. Please login manually.'
              : 'User not found. Please login manually.',
          );
          break;
        }
      } finally {
        setIsLoading(false);
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    if (lastError?.response?.status === 401) {
      setError('Invalid credentials. Please login manually.');
    } else if (lastError?.response?.status === 404) {
      setError('User not found. Please login manually.');
    } else if (lastError?.response?.status >= 500) {
      setError('Server error. Please try again later.');
    } else if (lastError?.code === 'ECONNABORTED') {
      setError('Request timed out. Please try again.');
    } else if (lastError?.message === 'Invalid response from server') {
      setError('Invalid server response. Please try reconnecting again.');
    } else {
      setError('Re-login failed. Please try again.');
    }

    toast.error('Re-login failed');
  };

  const handleGoToLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('savedUsername');
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('call-history');
      localStorage.removeItem('phoneShow');
      localStorage.removeItem('formNavigationState');
      localStorage.removeItem('selectedBreak');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('breakStartTime_') || key.startsWith('leadFormDraft:')) {
          localStorage.removeItem(key);
        }
      });
      window.location.href = '/webphone/mobile/login';
    }
  };

  useEffect(() => {
    if (isOpen && isClient) {
      handleReLogin(5);
    }
  }, [isOpen, isClient]);

  // Hide modal dialog completely — auto-reconnect silently in background
  return null;
};

export default SessionTimeoutModal;
