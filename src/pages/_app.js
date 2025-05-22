import { ThemeProvider } from '@/components/ThemeProvider';
import { HistoryProvider } from '@/context/HistoryContext';
import '@/styles/globals.css';
import dynamic from 'next/dynamic';
import { Jost } from 'next/font/google';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';

const jostSans = Jost({
  variable: '--font-jost-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const Layout = dynamic(() => import('@/components/layout/Layout'), { ssr: false });

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isPublicPage = router.pathname === '/login' || router.pathname === '/subscription-expired';

  return (
    <main className={`${jostSans.className} scroll-smooth font-[family-name:var(--font-jost-sans)]`}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <HistoryProvider>
          <Toaster position="top-right" reverseOrder={false} />
          {isPublicPage ? (
            <Component {...pageProps} />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </HistoryProvider>
      </ThemeProvider>
    </main>
  );
}