import React, { useEffect, useState } from 'react';

function Index() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);

    // Only run on client side
    if (typeof window !== 'undefined') {
      const checkAuthAndRedirect = () => {
        try {
          const token = localStorage.getItem('token');
          const parsedToken = token ? JSON.parse(token) : null;
          
          if (parsedToken) {
            window.location.href = '/webphone';
          } else {
            window.location.href = '/webphone/login';
          }
        } catch (error) {
          console.error('Token parsing error:', error);
          window.location.href = '/webphone/login';
        }
      };

      checkAuthAndRedirect();
    }
  }, []);

  if (!isClient) {
    return null; // Or loading state for SSR
  }

  return null; // Or loading spinner while redirecting
}

export default Index;