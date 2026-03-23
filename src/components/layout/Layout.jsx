import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { JssipContext } from '@/context/JssipContext';
import HistoryContext from '../../context/HistoryContext';
import DraggableWebPhone from '../DraggableWebPhone';
import { ConsentRequestModal } from '../ForceLoginModals';
import Footer from './Footer';
import Header from './Header';

export default function Layout({ children }) {
  const router = useRouter();
  const { audioRef } = useContext(JssipContext);
  const { showSecurityAlert, setShowSecurityAlert } = useContext(HistoryContext);

  const hiddenPhoneRoutes = ['/agent-dashboard', '/system-monitoring'];
  const shouldShowPhone = !hiddenPhoneRoutes.includes(router.pathname) && !showSecurityAlert;

  const handleAllowForceLogin = () => {
    toast.success('Force login allowed. Logging out...');
    setShowSecurityAlert(false);
    localStorage.removeItem('token');
    localStorage.setItem('userLoggedOut', 'true');
    router.push('/');
  };

  const handleRejectForceLogin = () => {
    toast.error('Force login request rejected');
    setShowSecurityAlert(false);
  };

  useEffect(() => {
    const handleForceLoginRequest = () => {
      setShowSecurityAlert(true);
      toast.error('Security Alert: Someone is trying to login from another device!');
    };

    window.addEventListener('forceLoginRequest', handleForceLoginRequest);
    window.testForceLogin = () => {
      setShowSecurityAlert(true);
    };

    return () => {
      window.removeEventListener('forceLoginRequest', handleForceLoginRequest);
      delete window.testForceLogin;
    };
  }, [setShowSecurityAlert]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const nextRoot = document.getElementById('__next');

    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlHeight = html.style.height;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyHeight = body.style.height;
    const previousNextOverflow = nextRoot?.style.overflow || '';
    const previousNextHeight = nextRoot?.style.height || '';

    html.style.height = '100%';
    html.style.overflow = 'hidden';
    body.style.height = '100%';
    body.style.overflow = 'hidden';

    if (nextRoot) {
      nextRoot.style.height = '100%';
      nextRoot.style.overflow = 'hidden';
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      html.style.height = previousHtmlHeight;
      body.style.overflow = previousBodyOverflow;
      body.style.height = previousBodyHeight;

      if (nextRoot) {
        nextRoot.style.overflow = previousNextOverflow;
        nextRoot.style.height = previousNextHeight;
      }
    };
  }, []);

  return (
    <>
      {showSecurityAlert && <ConsentRequestModal onAllow={handleAllowForceLogin} onReject={handleRejectForceLogin} />}

      <div className="flex h-screen flex-col overflow-hidden">
        <Header />
        <main className="flex min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-none px-4 py-3 sm:py-4">
            {children}
          </div>
        </main>
        <Footer />
      </div>

      <div style={{ display: shouldShowPhone ? 'block' : 'none' }}>
        <DraggableWebPhone />
      </div>

      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
    </>
  );
}
