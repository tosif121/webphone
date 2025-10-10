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
import { Loader2, AlertCircle } from 'lucide-react';

const SessionTimeoutModal = ({ isOpen, onClose, onLoginSuccess, userLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Ensure we only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleReLogin = async () => {
    if (!isClient) return; // Don't run on server side

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
          timeout: 10000, // 10 second timeout
        }
      );

      // Check if the response is successful
      if (response && (response.success || response.token || response.message === 'Login successful')) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', JSON.stringify(response));
        }

        // Call success handlers
        onLoginSuccess();
        toast.success('Re-login successful');

        // Don't call onClose() here - let onLoginSuccess handle the redirect/refresh
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Re-login failed:', err);

      // Handle different types of errors
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

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <AlertDialogTitle>Session Expired</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Session timed out due to inactivity or no keep-alive response from server. Please re-login to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button onClick={handleGoToLogin} variant="outline">
            Go to Login
          </Button>
          <Button onClick={handleReLogin} disabled={isLoading || userLogin}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Re-login...' : 'Re-Connect'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutModal;
