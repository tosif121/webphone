import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Immediate synchronous check - no loading state needed
    const token = localStorage.getItem('token');
    const userLoggedOut = localStorage.getItem('userLoggedOut');
    
    // If user manually logged out, go to login
    if (userLoggedOut) {
      localStorage.removeItem('userLoggedOut');
      router.replace('/webphone/v1/login');
      return;
    }

    // If no token, go to login
    if (!token) {
      router.replace('/webphone/v1/login');
      return;
    }

    // Try to parse token
    try {
      const parsedToken = JSON.parse(token);
      
      // Validate token structure
      if (parsedToken && parsedToken.userData) {
        // Token looks valid, redirect to main app immediately
        router.replace('/webphone/v1');
        return;
      } else {
        // Invalid token structure, clear and go to login
        localStorage.removeItem('token');
        router.replace('/webphone/v1/login');
        return;
      }
    } catch (parseError) {
      // Invalid JSON token, clear and go to login
      localStorage.removeItem('token');
      router.replace('/webphone/v1/login');
      return;
    }
  }, [router]);

  // Return null immediately - no loading spinner
  // The redirect happens so fast that users won't see this page
  return null;
}
