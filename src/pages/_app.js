import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { HistoryProvider } from '@/context/HistoryContext';
import { JssipProvider } from '@/context/JssipContext';
import '../styles/globals.css';
import { Jost } from 'next/font/google';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logError, checkHydrationIssues } from '@/utils/debugUtils';

const jostSans = Jost({
  variable: '--font-jost-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const publicPages = new Set(['/login', '/subscription-expired', '/404']);
  const isPublicPage = publicPages.has(router.pathname);

  // Handle Authentication for protected routes
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const tokenData = localStorage.getItem('token');
    const isLoggedIn = !!tokenData;
    setIsAuthenticated(isLoggedIn);

    if (!isLoggedIn && !isPublicPage) {
      router.push('/login');
    } else if (isLoggedIn && router.pathname === '/login') {
      router.push('/');
    }
  }, [isPublicPage, router.pathname]);

  // Add global error handlers for unhandled errors
  useEffect(() => {
    const handleError = (event) => {
      logError(event.error || new Error(event.message), 'unhandled-error');
    };

    const handleUnhandledRejection = (event) => {
      logError(new Error(event.reason?.toString() || 'Unhandled promise rejection'), 'unhandled-rejection');
    };

    if (typeof window !== 'undefined') {
      checkHydrationIssues();
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  // 1. If we don't know the auth status yet, hide everything to prevent blinking.
  if (isAuthenticated === null) {
    return <div className="h-screen w-screen bg-background" />;
  }

  // 2. If not logged in and trying to access a protected page, hide while redirecting.
  if (!isAuthenticated && !isPublicPage) {
    return <div className="h-screen w-screen bg-background" />;
  }

  // 3. If logged in and trying to access login page, hide while redirecting to dashboard.
  if (isAuthenticated && router.pathname === '/login') {
    return <div className="h-screen w-screen bg-background" />;
  }

  return (
    <ErrorBoundary>
      <main className={`${jostSans.className} scroll-smooth font-[family-name:var(--font-jost-sans)]`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster position="top-right" reverseOrder={false} />
          {isPublicPage ? (
            <Component {...pageProps} />
          ) : (
            <HistoryProvider>
              <JssipProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </JssipProvider>
            </HistoryProvider>
          )}
        </ThemeProvider>
      </main>
    </ErrorBoundary>
  );
}
