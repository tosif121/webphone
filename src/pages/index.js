import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    // Simple redirect logic without complex state management
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.replace('/mobile/login');
          return;
        }
        
        const parsed = JSON.parse(token);
        if (!parsed?.userData) {
          window.location.replace('/mobile/login');
          return;
        }
        
        // If we get here, user is authenticated, redirect to main app
        window.location.replace('/mobile/webphone');
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.replace('/mobile/login');
      }
    };

    // Small delay to ensure localStorage is available
    setTimeout(checkAuth, 100);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <p style={{ margin: 0, color: '#666' }}>Loading...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}