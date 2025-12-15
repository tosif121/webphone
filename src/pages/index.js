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
        router.replace('/webphone/v1');
      } else {
        router.replace('/webphone/v1/login');
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      router.replace('/webphone/v1/login');
    }
  }, [isClient, router]);

  // Show loading state during SSR and initial hydration
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
