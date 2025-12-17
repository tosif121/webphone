import React from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, ArrowLeft, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SubscriptionExpired = () => {
  const router = useRouter();

  const handleBackToLogin = () => {
    window.location.href = '/mobile/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-muted/20 md:block hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-lg border backdrop-blur-sm bg-card/95 relative z-10">
        {/* Decorative elements */}
        <div className="absolute md:block hidden top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-accent/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 bg-primary/10 rounded-full blur-2xl"></div>

        <CardHeader className="space-y-6 pb-6 pt-10">
          {/* Alert icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-destructive/10 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-destructive">Subscription Expired</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Account access suspended</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-8 pb-10">
          {/* Support info */}
          <div className="bg-muted/50 rounded-xl p-6 space-y-3">
            <h3 className="font-semibold text-foreground text-center">Need Help?</h3>
            <div className="text-center space-y-1 text-sm text-muted-foreground">
              <p>Contact our support team for subscription renewal</p>
              <p className="font-mono bg-background px-2 py-1 rounded border border-muted">support@samwad.com</p>
            </div>
          </div>

          {/* Action button */}
          <div className="space-y-4">
            <Button
              onClick={handleBackToLogin}
              className="w-full h-14 text-base cursor-pointer font-medium bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Login
            </Button>

            <p className="text-center text-xs text-muted-foreground">Return to login page to try a different account</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionExpired;
