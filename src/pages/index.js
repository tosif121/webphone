import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client flag to prevent hydration mismatch
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run after client-side hydration is complete
    if (!isClient) return;

    try {
      const token = localStorage.getItem('token');
      const parsedToken = token ? JSON.parse(token) : null;

      if (parsedToken) {
        // User is logged in, show the main app
        // Don't redirect, just render the main component
        return;
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      router.replace('/login');
    }
  }, [isClient, router]);

  // Show loading state during SSR and initial hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  try {
    const token = localStorage.getItem('token');
    const parsedToken = token ? JSON.parse(token) : null;

    if (parsedToken) {
      // User is logged in, show the main app
      const MobileTabsWrapper = require('@/components/MobileTabsWrapper').default;
      return <MobileTabsWrapper />;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }

  // If we get here, user is not logged in and will be redirected
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}