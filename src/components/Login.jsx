import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

import {
  Eye,
  EyeOff,
  LogIn,
  AlertTriangle,
  User,
  Lock,
  PhoneCall,
  Loader2,
  Clock,
  AlertCircle,
  Crown,
  Calendar,
} from 'lucide-react';

import { LoginConflictModal, TimerWaitingModal } from './ForceLoginModals';
import HistoryContext from '@/context/HistoryContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const { showSecurityAlert, setShowSecurityAlert } = useContext(HistoryContext);

  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [subscriptionDialog, setSubscriptionDialog] = useState({
    isOpen: false,
    daysExpired: 0,
    type: 'expired',
  });

  const [showLoginConflict, setShowLoginConflict] = useState(false);
  const [showTimerWaiting, setShowTimerWaiting] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('45 minutes');

  const handleUsernameChange = (e) => {
    const value = e.target.value.replace(/\s+/g, '');
    setUsername(value);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value.replace(/\s+/g, '');
    setPassword(value);
  };

  const validateForm = () => {
    const errors = {};
    if (!username) errors.username = 'Please enter username';
    if (!password) errors.password = 'Please enter password';
    else if (password.length < 6) errors.password = 'Password length should be at least 6 characters';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkMicrophoneAccess = async () => {
    try {
      // Check if we're in a mobile environment
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Skip microphone check on mobile devices - just return true
      if (isMobile) {
        return true;
      }

      // Only check microphone permissions on desktop
      // Check permissions if available
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' });
          if (result.state === 'denied') {
            toast.error('Microphone access denied. Please enable it in your browser settings.');
            return false;
          }
        } catch (err) {
          console.warn('Permissions API not fully supported', err);
        }
      }

      // Request access only on desktop
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (err) {
      console.error('Microphone access error:', err);

      let errorMessage = 'Microphone access denied or unavailable.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission was denied. Please allow microphone access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone device found.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      }

      toast.error(errorMessage);
      return false;
    }
  };

  const getSubscriptionDelayInfo = (daysExpired) => {
    const configs = {
      1: { time: 10000, message: 'Your subscription expired yesterday', color: 'amber', severity: 'medium' },
      2: { time: 15000, message: 'Your subscription expired 2 days ago', color: 'orange', severity: 'high' },
      3: { time: 20000, message: 'Your subscription expired 3 days ago', color: 'red', severity: 'high' },
      4: { time: 30000, message: 'Your subscription expired 4 days ago', color: 'red', severity: 'critical' },
      5: { time: 60000, message: 'Your subscription expired 5 days ago', color: 'red', severity: 'critical' },
    };

    const day = Math.ceil(daysExpired);
    return configs[day] || configs[5];
  };

  const handleSubscriptionDelay = async (daysExpired) => {
    const config = getSubscriptionDelayInfo(daysExpired);

    setLoaderMessage(config.message);
    setIsLoading(true);
    setSubscriptionDialog({
      isOpen: true,
      daysExpired: Math.ceil(daysExpired),
      type: 'expired',
    });

    const totalSeconds = config.time / 1000;
    setTimer(totalSeconds);

    for (let i = totalSeconds; i > 0; i--) {
      setTimer(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsLoading(false);
    setSubscriptionDialog((prev) => ({ ...prev, isOpen: false }));

    return config.message;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  // Auto login with saved credentials
  const handleAutoLogin = async () => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');

    // Use the saved credentials for login
    await performLogin(savedUsername, savedPassword);
  };

  // Perform the actual login logic
  const performLogin = async (usernameParam, passwordParam) => {
    const loginUsername = usernameParam || username;
    const loginPassword = passwordParam || password;

    if (!loginUsername || !loginPassword) {
      if (!usernameParam) {
        // Only show validation errors for manual login
        validateForm();
      }
      setIsLoading(false);
      return;
    }

    const hasMicrophone = await checkMicrophoneAccess();
    if (!hasMicrophone) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: response } = await axios.post(
        `${window.location.origin}/userlogin/${loginUsername}`,
        { username: loginUsername, password: loginPassword },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!response) {
        toast.error('No response from server.');
        setIsLoading(false);
        return;
      }

      if (response.message === 'wrong login info') {
        toast.error('Incorrect username or password');
        setIsLoading(false);
        return;
      }

      if (response.message === 'User already login somewhere else') {
        setShowLoginConflict(true);
        setIsLoading(false);
        return;
      }

      if (response.message === 'Request failed') {
        toast.error('Login request failed. Please try again.');
        setIsLoading(false);
        return;
      }

      const userData = response?.userData;
      if (!userData || !userData.ExpiryDate) {
        toast.error('Invalid user data received.');
        setIsLoading(false);
        return;
      }

      const expiryDate = new Date(userData.ExpiryDate);
      const currentDate = new Date();
      const differenceInTime = expiryDate - currentDate;
      const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

      // Store the token and save credentials for future auto-login
      localStorage.setItem('token', JSON.stringify(response));
      localStorage.setItem('savedUsername', loginUsername);
      localStorage.setItem('savedPassword', loginPassword);

      // Remove logout flag since user successfully logged in
      localStorage.removeItem('userLoggedOut');

      if (differenceInDays < 0) {
        const daysExpired = Math.abs(differenceInDays);

        if (daysExpired > 5) {
          setIsLoading(false);
          toast.error('Your subscription has expired. Please renew to continue.');
          await router.replace('/subscription-expired');
          return;
        }

        const toastMessage = await handleSubscriptionDelay(daysExpired);
        toast.error(toastMessage);
        toast.success('Login successfully');
        setIsLoading(false);
        await router.push('webphone/v1');
      } else if (differenceInDays < 3) {
        setSubscriptionDialog({
          isOpen: true,
          daysExpired: Math.ceil(differenceInDays),
          type: 'expiring',
        });
        setTimeout(() => {
          setSubscriptionDialog((prev) => ({ ...prev, isOpen: false }));
        }, 3000);
        toast.error('Your subscription is about to expire. Please renew soon!');
        toast.success('Login successfully');
        setIsLoading(false);
        await router.push('webphone/v1');
      } else {
        toast.success('Login successfully');
        setIsLoading(false);
        await router.push('webphone/v1');
      }
    } catch (error) {
      // Axios error handling
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'An error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    await performLogin();
  };

  // Check for auto-login on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userLoggedOut = localStorage.getItem('userLoggedOut');
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');

    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // If user has valid token and didn't manually logout, redirect to webphone
    if (token && !userLoggedOut) {
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken) {
          router.push('webphone/v1');
          return;
        }
      } catch (error) {
        // Invalid token, continue with login flow
      }
    }

    // If user logged out manually, clear the logout flag and show login form
    if (userLoggedOut) {
      localStorage.removeItem('userLoggedOut');
    }

    // Auto-login directly on mobile if we have saved credentials and user didn't manually logout
    if (savedUsername && savedPassword && !userLoggedOut && isMobile) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      // Trigger auto-login after a short delay to ensure state is set
      setTimeout(() => {
        handleAutoLogin();
      }, 100);
    }
  }, [router]);

  const handleForceLogin = () => {
    setShowLoginConflict(false);
    setShowTimerWaiting(true);

    // Auto-close timer modal after 5 seconds and retry login
    setTimeout(() => {
      setShowTimerWaiting(false);
      // Here you would make the force login API call
      toast.success('Force login request sent');
      // Retry the login after force login request
      performLogin();
    }, 5000);
  };

  return (
    <>
      {/* Login Conflict Modal */}
      {showLoginConflict && (
        <LoginConflictModal
          onCancel={() => {
            setShowLoginConflict(false);
            setIsLoading(false);
          }}
          onForceLogin={handleForceLogin}
          sessionDuration={sessionDuration}
        />
      )}

      {/* Timer Waiting Modal */}
      {showTimerWaiting && <TimerWaitingModal />}

      <Dialog open={subscriptionDialog.isOpen} onOpenChange={() => {}} modal={true}>
        <DialogContent
          className="w-[95%] max-w-lg md:max-w-xl lg:max-w-2xl bg-card/95 [&>button]:hidden backdrop-blur-md border shadow-2xl z-50 mx-auto my-auto p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[90vh]"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                {subscriptionDialog.type === 'expiring' ? (
                  <AlertTriangle className="h-10 w-10 text-primary-foreground" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-primary-foreground" />
                )}
              </div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {subscriptionDialog.type === 'expiring' ? 'Subscription Expiring Soon' : 'Subscription Expired'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base mt-2 text-muted-foreground text-center">
              {subscriptionDialog.type === 'expiring'
                ? `Your subscription expires in ${subscriptionDialog.daysExpired} day${
                    subscriptionDialog.daysExpired !== 1 ? 's' : ''
                  }`
                : loaderMessage}
            </DialogDescription>
          </DialogHeader>

          {subscriptionDialog.type === 'expired' && (
            <div className="py-6 space-y-6">
              {/* Progress Bar */}
              <div className="space-y-4">
                <Progress
                  value={
                    timer > 0
                      ? (timer / (getSubscriptionDelayInfo(subscriptionDialog.daysExpired).time / 1000)) * 100
                      : 0
                  }
                  className="w-full h-4"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Please wait while we verify your subscription...
                  </span>
                  <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-foreground">{formatTime(timer)}</span>
                  </div>
                </div>
              </div>

              {/* Grace Period Info Card */}
              <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Grace Period Active</h4>
                    <p className="text-sm text-muted-foreground">
                      You can still access your account while we verify your subscription status. Please wait for the
                      verification to complete.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {subscriptionDialog.type === 'expiring' && (
            <div className="py-4">
              <div className="bg-accent/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Renew Your Subscription</h4>
                    <p className="text-sm text-muted-foreground">
                      Don't lose access to your account. Renew now to continue using all features without interruption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        {/* Custom Full Screen Blocking Overlay */}
        {subscriptionDialog.isOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'all',
            }}
            onClick={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </Dialog>

      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:py-12">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-muted/20 md:block hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md shadow-lg border backdrop-blur-sm bg-card/95 relative z-10 mx-auto">
          {/* Decorative elements */}
          <div className="absolute md:block hidden top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-accent/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 bg-primary/10 rounded-full blur-2xl"></div>

          <CardHeader className="space-y-1 pb-6 pt-6 sm:pt-10">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <PhoneCall className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-foreground">SAMWAD</CardTitle>
            <CardDescription className="text-sm sm:text-base text-center mt-2">Sign in to your account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 px-6 pb-8 sm:px-8 sm:pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-sm font-medium pl-1">
                  Username
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className="h-14 pl-12 pr-4 bg-background border-input focus:border-ring focus:ring-ring/30 focus:ring-4 transition-all"
                    value={username}
                    onChange={handleUsernameChange}
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1 pl-1">
                    <AlertTriangle className="h-3 w-3" />
                    {validationErrors.username}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium pl-1">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="h-14 pl-12 pr-12 bg-background border-input focus:border-ring focus:ring-ring/30 focus:ring-4 transition-all"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1 pl-1">
                    <AlertTriangle className="h-3 w-3" />
                    {validationErrors.password}
                  </p>
                )}
              </div>
              <Button
                className="w-full h-14 text-base cursor-pointer font-medium mt-8 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Login <LogIn className="ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
