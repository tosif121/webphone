import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import MobileTabsWrapper from '@/components/MobileTabsWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Index() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = logged in, false = not logged in
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    // Set client flag to prevent hydration mismatch
    setIsClient(true);
  }, []);

  const performAuthCheck = useCallback(() => {
    if (!isClient || authCheckComplete) return;

    console.log('Performing auth check...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token found:', !!token);
      
      if (!token) {
        console.log('No token found, redirecting to login');
        setIsAuthenticated(false);
        setIsRedirecting(true);
        setAuthCheckComplete(true);
        
        // Immediate redirect
        window.location.href = '/mobile/login';
        return;
      }

      const parsedToken = JSON.parse(token);
      console.log('Parsed token:', !!parsedToken, !!parsedToken?.userData);
      
      if (parsedToken && parsedToken.userData) {
        console.log('User is authenticated');
        setIsAuthenticated(true);
        setAuthCheckComplete(true);
      } else {
        console.log('Invalid token structure, redirecting to login');
        setIsAuthenticated(false);
        setIsRedirecting(true);
        setAuthCheckComplete(true);
        
        // Clean up invalid token
        localStorage.removeItem('token');
        window.location.href = '/mobile/login';
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      setIsAuthenticated(false);
      setIsRedirecting(true);
      setAuthCheckComplete(true);
      
      // Clean up corrupted token
      localStorage.removeItem('token');
      window.location.href = '/mobile/login';
    }
  }, [isClient, authCheckComplete]);

  useEffect(() => {
    if (!isClient) return;

    // Add a small delay to ensure DOM is ready
    const authTimeout = setTimeout(() => {
      performAuthCheck();
    }, 100);

    // Fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.warn('Auth check taking too long, forcing redirect');
        setIsAuthenticated(false);
        setIsRedirecting(true);
        setAuthCheckComplete(true);
        window.location.href = '/mobile/login';
      }
    }, 5000);

    return () => {
      clearTimeout(authTimeout);
      clearTimeout(fallbackTimeout);
    };
  }, [isClient, performAuthCheck, authCheckComplete]);

  // Show loading state during SSR and initial hydration
  if (!isClient || !authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center" style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" style={{ width: '32px', height: '32px', border: '2px solid #e5e7eb', borderBottomColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p className="mt-2 text-sm text-muted-foreground" style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state
  if (isRedirecting || isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center" style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" style={{ width: '32px', height: '32px', border: '2px solid #e5e7eb', borderBottomColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p className="mt-2 text-sm text-muted-foreground" style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show the main app
  if (isAuthenticated === true) {
    console.log('Rendering MobileTabsWrapper');
    return (
      <ErrorBoundary>
        <MobileTabsWrapper />
      </ErrorBoundary>
    );
  }

  // Fallback (should not reach here)
  console.warn('Reached fallback state');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center" style={{ textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" style={{ width: '32px', height: '32px', border: '2px solid #e5e7eb', borderBottomColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p className="mt-2 text-sm text-muted-foreground" style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>Loading...</p>
        <p className="mt-1 text-xs text-muted-foreground" style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>If this persists, please refresh the page</p>
      </div>
    </div>
  );
}