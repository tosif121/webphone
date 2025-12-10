import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Shield, X } from 'lucide-react';

// State A: Login Conflict Modal
const LoginConflictModal = ({ onCancel, onForceLogin, sessionDuration = '45 minutes' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-card rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">Login Conflict</h2>
              <p className="text-sm text-muted-foreground mt-1">User Already Logged In</p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <p className="text-foreground">You are currently logged in on another device.</p>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Active Session Duration:</span>
                <span className="text-primary font-semibold">{sessionDuration}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Forcing login will immediately log out the other session.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-input text-foreground font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onForceLogin}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Force Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// State B: Timer/Waiting Modal
const TimerWaitingModal = () => {
  const [countdown, setCountdown] = useState(5);
  const progress = ((5 - countdown) / 5) * 100;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="relative bg-card rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-20 h-20 mb-4">
              {/* Circular Progress */}
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{countdown}</span>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">Requesting Consent</h2>
            <p className="text-sm text-muted-foreground">Requesting consent from active session...</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Waiting for response from the active device...
          </p>
        </div>
      </div>
    </div>
  );
};

// State C: Consent Request Modal
const ConsentRequestModal = ({ onAllow, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onReject} />

      <div className="relative bg-card rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">Security Alert</h2>
              <p className="text-sm text-muted-foreground mt-1">Login Attempt Detected</p>
            </div>
            <button
              onClick={onReject}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-foreground font-medium mb-2">
                Someone is requesting to Force Login to your account from another device.
              </p>
              <p className="text-sm text-muted-foreground">Do you want to allow this?</p>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Warning:</strong> Allowing this will immediately log you out from
                this device.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onAllow}
              className="w-full px-4 py-2.5 bg-destructive text-destructive-foreground font-medium rounded-lg hover:bg-destructive/90 transition-colors shadow-sm"
            >
              Yes, Logout & Allow
            </button>
            <button
              onClick={onReject}
              className="w-full px-4 py-2.5 border border-input text-foreground font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              No, Reject Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginConflictModal, TimerWaitingModal, ConsentRequestModal };
