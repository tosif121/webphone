import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { authService } from '@/utils/services';
import { Progress } from '@/components/ui/progress';
import HistoryContext from '@/context/HistoryContext';

export default function Login() {
  const router = useRouter();

  // Use HistoryContext
  const { username, setUsername, password, setPassword } = useContext(HistoryContext);

  // UI state
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [subscriptionDialog, setSubscriptionDialog] = useState({
    isOpen: false,
    daysExpired: 0,
    type: 'expired', // 'expired' | 'expiring'
  });

  // Handle input changes
  const handleUsernameChange = (e) => {
    console.log(username, password);
    setUsername(e.target.value.replace(/\s+/g, ''));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value.replace(/\s+/g, ''));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!username) errors.username = 'Please enter username';
    if (!password) errors.password = 'Please enter password';
    else if (password.length < 6) errors.password = 'Password length should be at least 6 characters';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check microphone access
  const checkMicrophoneAccess = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioInput = devices.some((device) => device.kind === 'audioinput');

      if (!hasAudioInput) {
        toast.error('Microphone Required: Please connect a microphone to continue.');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      toast.error('Microphone Access Denied: Please connect a microphone and allow access to continue.');
      return false;
    }
  };

  // Get subscription delay info
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

  // Handle subscription verification delay
  const handleSubscriptionDelay = async (daysExpired) => {
    const config = getSubscriptionDelayInfo(daysExpired);

    setLoaderMessage(config.message);
    setIsLoading(true);
    setSubscriptionDialog({
      isOpen: true,
      daysExpired: Math.ceil(daysExpired),
      type: 'expired',
    });

    // Start countdown timer
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

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  // Navigate to home page
  const navigateToHome = async () => {
    try {
      // Use replace instead of push to avoid back button issues
      await router.replace('/');
      
      // Alternative approaches if the above doesn't work:
      // Option 1: Force a hard refresh
      // window.location.href = '/';
      
      // Option 2: Use router.push with a small delay
      // setTimeout(() => router.push('/'), 100);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to hard refresh
      window.location.href = '/';
    }
  };

  // Handle login submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    // Check microphone access
    const hasMicrophone = await checkMicrophoneAccess();
    if (!hasMicrophone) return;

    setIsLoading(true);

    try {
      // Call auth service
      const response = await authService.login(username, {
        username: username,
        password: password,
      });

      if (response.message === 'wrong login info') {
        toast.error('Incorrect username or password');
        setIsLoading(false);
        return;
      }

      if (response.message === 'User already login somewhere else') {
        toast.error(response.message || 'User already logged in elsewhere. Please log out from other devices.');
        setIsLoading(false);
        return;
      }

      // Check subscription status
      const userData = response.data.userData;
      const expiryDate = new Date(userData.ExpiryDate);
      const currentDate = new Date();
      const differenceInTime = expiryDate - currentDate;
      const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

      // Set token first
      Cookies.set('samwad_token', response.data.token);

      // Handle subscription cases
      if (differenceInDays < 0) {
        const daysExpired = Math.abs(differenceInDays);

        if (daysExpired > 5) {
          await router.replace('/subscription-expired');
          return;
        }

        // Show subscription expiry dialog and wait
        const toastMessage = await handleSubscriptionDelay(daysExpired);
        toast.error(toastMessage);
      } else if (differenceInDays < 3) {
        // Approaching expiry - show warning dialog
        setSubscriptionDialog({
          isOpen: true,
          daysExpired: Math.ceil(differenceInDays),
          type: 'expiring',
        });

        // Auto close after 3 seconds
        setTimeout(() => {
          setSubscriptionDialog((prev) => ({ ...prev, isOpen: false }));
        }, 3000);

        toast.error('Your subscription is about to expire. Please renew soon!');
      }

      // Success login toast
      toast.success('Login successfully');
      
      // Small delay to ensure token is set and toast is shown
      setTimeout(async () => {
        setIsLoading(false);
        await navigateToHome();
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Subscription Dialog - NO CLOSE BUTTON */}
      <Dialog
        open={subscriptionDialog.isOpen}
        onOpenChange={() => {}} // Completely disabled - user cannot close
        modal={true}
      >
        <DialogContent
          className="sm:max-w-lg bg-white/95 [&>button]:hidden dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-2xl z-50 [&>button]:hidden" // HIDE CLOSE BUTTON
          onEscapeKeyDown={(e) => e.preventDefault()} // Prevent ESC key closing
          onPointerDownOutside={(e) => e.preventDefault()} // Prevent clicking outside to close
          onInteractOutside={(e) => e.preventDefault()} // Prevent any outside interaction
        >
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                {subscriptionDialog.type === 'expiring' ? (
                  <AlertTriangle className="h-10 w-10 text-white" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-white" />
                )}
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              {subscriptionDialog.type === 'expiring' ? 'Subscription Expiring Soon' : 'Subscription Expired'}
            </DialogTitle>
            <DialogDescription className="text-base mt-2 text-gray-600 dark:text-gray-300 text-center">
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
                  value={((timer || 1) / ((timer || 1) + 1)) * 100}
                  className="w-full h-4 rounded-full bg-gray-200 dark:bg-slate-700"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Please wait while we verify your subscription...
                  </span>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatTime(timer)}</span>
                  </div>
                </div>
              </div>

              {/* Grace Period Info Card */}
              <div className="bg-blue-50 dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-slate-600">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Grace Period Active</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
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
              <div className="bg-amber-50 dark:bg-slate-800 rounded-lg p-4 border border-amber-200 dark:border-slate-600">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Renew Your Subscription</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
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
            className="fixed inset-0 z-40 bg-black/80 dark:bg-black/90 backdrop-blur-sm"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'all', // Ensure it captures all pointer events
            }}
            onClick={(e) => e.preventDefault()} // Prevent any clicks
            onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
          />
        )}
      </Dialog>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-900 dark:to-blue-950 px-4">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(120,120,255,0.4)_0%,rgba(0,0,0,0)_60%),radial-gradient(circle_at_70%_60%,rgba(120,255,190,0.3)_0%,rgba(0,0,0,0)_60%)]"></div>

        <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 rounded-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 bg-gradient-to-tr from-emerald-400 to-cyan-500 opacity-20 rounded-full blur-3xl"></div>

          <CardHeader className="space-y-1 pb-6 pt-10">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <PhoneCall className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SAMWAD
            </CardTitle>
            <CardDescription className="text-center text-base mt-2">Sign in to your account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 px-8 pb-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-sm font-medium pl-1">
                  Username
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className="h-14 pl-12 pr-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-500 ring-blue-500/30 focus:ring-4 transition-all"
                    value={username}
                    onChange={handleUsernameChange}
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1 mt-1 pl-1">
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
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="h-14 pl-12 pr-12 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border-gray-200 dark:border-slate-700 focus:border-blue-500 ring-blue-500/30 focus:ring-4 transition-all"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1 mt-1 pl-1">
                    <AlertTriangle className="h-3 w-3" />
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full h-14 text-base font-medium dark:text-white mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Login <LogIn className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}