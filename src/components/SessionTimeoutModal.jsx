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

const SessionTimeoutModal = ({ isOpen, onClose, onLoginSuccess, userLogin, customMessage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleReLogin = async () => {
    if (!isClient) return;

    setIsLoading(true);
    setError('');

    try {
      const savedUsername = typeof window !== 'undefined' ? localStorage.getItem('savedUsername') : null;
      const savedPassword = typeof window !== 'undefined' ? localStorage.getItem('savedPassword') : null;

      if (!savedUsername || !savedPassword) {
        setError('No saved credentials found. Please login manually.');
        setIsLoading(false);
        return;
      }

      const { data: response } = await axios.post(
        `${window.location.origin}/userlogin/${savedUsername}`,
        { username: savedUsername, password: savedPassword },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (response && (response.success || response.token || response.message === 'Login successful')) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', JSON.stringify(response));
        }

        onLoginSuccess();
        toast.success('Re-login successful');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Re-login failed:', err);

      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid credentials. Please login manually.');
      } else if (err.response?.status === 404) {
        setError('User not found. Please login manually.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.message === 'Invalid response from server') {
        setError('Invalid server response. Please login manually.');
      } else {
        setError('Re-login failed. Please login manually.');
      }

      toast.error('Re-login failed');
    } finally {
      setIsLoading(false);
    }
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
        if (key.startsWith('breakStartTime_')) {
          localStorage.removeItem(key);
        }
      });
      window.location.href = '/webphone/v1/login';
    }
  };

  // ✅ Determine the issue type
  const isPoorConnection = customMessage?.toLowerCase().includes('poor connection');
  const isNotReady = customMessage?.toLowerCase().includes('not in a ready state');
  const isForceLogout = userLogin === true;

  // ✅ NEW: Check if error requires manual login
  const requiresManualLogin = 
    error.includes('Please login manually') || 
    error.includes('Invalid credentials') ||
    error.includes('User not found') ||
    error.includes('No saved credentials found');

  // ✅ Select appropriate icon
  const getIcon = () => {
    if (isPoorConnection) return <WifiOff className="h-6 w-6 text-red-600" />;
    if (isNotReady) return <UserX className="h-6 w-6 text-orange-600" />;
    return <AlertCircle className="h-6 w-6 text-yellow-600" />;
  };

  // ✅ Select appropriate title
  const getTitle = () => {
    if (isForceLogout) return 'Session Expired';
    if (isPoorConnection) return 'Connection Issue';
    if (isNotReady) return 'Agent Not Ready';
    return 'Session Expired';
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            {getIcon()}
            <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {customMessage ||
              'Session timed out due to inactivity or no keep-alive response from server. Please re-login to continue.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ✅ Show helpful tips based on error type */}
        {!error && !isForceLogout && (
          <>
            {isPoorConnection && (
              <Alert>
                <AlertDescription>
                  This may be due to network instability. Please check your internet connection and try re-connecting.
                </AlertDescription>
              </Alert>
            )}

            {isNotReady && (
              <Alert>
                <AlertDescription>
                  Your agent status may have changed. Please re-login to restore your ready state.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <AlertDialogFooter>
          {/* ✅ Show buttons based on scenario */}
          {isForceLogout || requiresManualLogin ? (
            /* Show only "Go to Login" button */
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login
            </Button>
          ) : (
            /* Show both buttons */
            <div className="flex gap-2 w-full">
              {/* Show "Go to Login" as secondary option when there's an error */}
              {error && (
                <Button onClick={handleGoToLogin} variant="outline" className="flex-1">
                  Go to Login
                </Button>
              )}
              
              {/* Show "Re-Connect" button */}
              <Button 
                onClick={handleReLogin} 
                disabled={isLoading || requiresManualLogin} 
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Re-connecting...' : 'Re-Connect'}
              </Button>
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutModal;
