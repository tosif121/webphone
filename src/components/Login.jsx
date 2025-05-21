import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { Eye, EyeOff, LogIn, AlertTriangle, User, Lock, PhoneCall } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { authService } from '@/utils/services';
import { Progress } from './ui/progress';

export default function Login() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // UI state
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [timer, setTimer] = useState(0);

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value.replace(/\s+/g, ''),
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.username) errors.username = 'Please enter username';
    if (!formData.password) errors.password = 'Please enter password';
    else if (formData.password.length < 6) errors.password = 'Password length should be at least 6 characters';

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

  // Handle subscription verification delay
  const handleSubscriptionDelay = async (daysExpired) => {
    let message = 'Verifying subscription status...';
    let waitTime = 5000; // Default 5 seconds

    if (daysExpired <= 1) {
      message = 'Your subscription expired yesterday.';
      waitTime = 10000;
    } else if (daysExpired <= 2) {
      message = 'Your subscription expired 2 days ago.';
      waitTime = 15000;
    } else if (daysExpired <= 3) {
      message = 'Your subscription expired 3 days ago.';
      waitTime = 20000;
    } else if (daysExpired <= 4) {
      message = 'Your subscription expired 4 days ago.';
      waitTime = 30000;
    } else if (daysExpired <= 5) {
      message = 'Your subscription expired more than 4 days ago.';
      waitTime = 60000;
    }

    setLoaderMessage(message);
    setIsLoading(true);

    // Start countdown timer
    const totalSeconds = waitTime / 1000;
    setTimer(totalSeconds);

    for (let i = totalSeconds; i > 0; i--) {
      setTimer(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsLoading(false);

    // Return appropriate toast message
    return `Subscription expired ${daysExpired <= 1 ? 'yesterday' : daysExpired + ' days ago'}...`;
  };

  // Handle login submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    // Check microphone access
    const hasMicrophone = await checkMicrophoneAccess();
    if (!hasMicrophone) return;

    try {
      // Call auth service
      const response = await authService.login(formData.username, {
        username: formData.username,
        password: formData.password,
      });

      if (response.message === 'wrong login info') {
        toast.error('Incorrect username or password');
        return;
      }

      if (response.message === 'User already login somewhere else') {
        toast.error(response.message || 'User already logged in elsewhere. Please log out from other devices.');
        return;
      }

      // Check subscription status
      const userData = response.data.userData;
      const expiryDate = new Date(userData.ExpiryDate);
      const currentDate = new Date();
      const differenceInTime = expiryDate - currentDate;
      const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

      // Set token
      Cookies.set('samwad_token', response.data.token);

      // Handle subscription cases
      if (differenceInDays < 0) {
        const daysExpired = Math.abs(differenceInDays);

        if (daysExpired > 5) {
          router.push('/subscription-expired');
          return;
        }

        // Only show subscription dialog if expired
        const toastMessage = await handleSubscriptionDelay(daysExpired);
        toast.error(toastMessage);
      } else if (differenceInDays < 3) {
        // Approaching expiry
        toast.error('Your subscription is about to expire. Please renew soon!');
      }

      // Success login
      toast.success('Login successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <>
      {/* Loading Dialog - Only shown when subscription is expired */}
      <Dialog open={isLoading} onOpenChange={setIsLoading}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{loaderMessage}</DialogTitle>
            <DialogDescription>Please wait while we verify your account...</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Progress value={(timer / (timer + 1)) * 100} className="w-full h-3 rounded-full" />
            <p className="text-center mt-4 text-sm text-gray-500">{timer} seconds remaining</p>
          </div>
        </DialogContent>
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={formData.username.replace(/\s+/g, '')}
                    onChange={handleInputChange}
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
                    value={formData.password.replace(/\s+/g, '')}
                    onChange={handleInputChange}
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
                type="submit"
                className="w-full h-14 text-base font-medium dark:text-white mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                disabled={isLoading}
              >
                Login
                <LogIn className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
