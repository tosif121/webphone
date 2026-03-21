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

  return (
    <>
      {showSecurityAlert && <ConsentRequestModal onAllow={handleAllowForceLogin} onReject={handleRejectForceLogin} />}

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-4 sm:py-8">{children}</div>
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
