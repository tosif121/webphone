import React from 'react';
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

  const publicPages = new Set(['/webphone/v1/login', '/webphone/v1/subscription-expired', '/404']);

  const isPublicPage = publicPages.has(router.pathname);

  // Register service worker for notifications
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          // Service Worker registered successfully
        })
        .catch(function(error) {
          // Service Worker registration failed
        });
    }
  }, []);

  // Add global error handlers for unhandled errors
  React.useEffect(() => {
    const handleError = (event) => {
      logError(event.error || new Error(event.message), 'unhandled-error');
    };

    const handleUnhandledRejection = (event) => {
      logError(new Error(event.reason?.toString() || 'Unhandled promise rejection'), 'unhandled-rejection');
    };

    if (typeof window !== 'undefined') {
      // Check for hydration issues on mount
      checkHydrationIssues();
      
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

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
