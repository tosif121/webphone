import React from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, ArrowLeft, PhoneCall, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SubscriptionExpired = () => {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-900 dark:to-blue-950 px-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(120,120,255,0.4)_0%,rgba(0,0,0,0)_60%),radial-gradient(circle_at_70%_60%,rgba(120,255,190,0.3)_0%,rgba(0,0,0,0)_60%)]"></div>

      <Card className="w-full max-w-lg shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 rounded-2xl relative">
        {/* Decorative gradient blurs */}
        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-gradient-to-br from-red-400 to-orange-500 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 bg-gradient-to-tr from-pink-400 to-red-500 opacity-20 rounded-full blur-3xl"></div>

        <CardHeader className="space-y-6 pb-6 pt-10">
          {/* Alert icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Subscription Expired
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Account access suspended</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-8 pb-10">
          {/* Message */}
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              Your subscription has expired and your account access has been suspended.
            </p>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Please contact our support team to renew your subscription and restore access to your account.
              </p>
            </div>
          </div>

          {/* Support info */}
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center">Need Help?</h3>
            <div className="text-center space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p>Contact our support team for subscription renewal</p>
              <p className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border">support@samwad.com</p>
            </div>
          </div>

          {/* Action button */}
          <div className="space-y-4">
            <Button
              onClick={handleBackToLogin}
              className="w-full h-14 text-base dark:text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Login
            </Button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Return to login page to try a different account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionExpired;
