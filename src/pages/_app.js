import { ThemeProvider } from '@/components/ThemeProvider';
import { HistoryProvider } from '@/context/HistoryContext';
import { JssipProvider } from '@/context/JssipContext';
import '@/styles/globals.css';

import { Jost } from 'next/font/google';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';

const jostSans = Jost({
  variable: '--font-jost-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

import Layout from '@/components/layout/Layout';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const publicPages = ['/login', '/subscription-expired'];
  const isPublicPage = publicPages.includes(router.pathname);

  return (
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
  );
}
