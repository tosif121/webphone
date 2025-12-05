import React, { useEffect, useContext, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import { JssipContext } from '@/context/JssipContext';
import { ConsentRequestModal } from '../ForceLoginModals';
import { toast } from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';

export default function Layout({ children }) {
  const router = useRouter();
  const { audioRef } = useContext(JssipContext);
  const { showSecurityAlert, setShowSecurityAlert } = useContext(HistoryContext);

  const hiddenPhoneRoutes = ['/webphone/v1/agent-dashboard', '/webphone/v1/system-monitoring'];
  const shouldShowPhone = !hiddenPhoneRoutes.includes(router.pathname) && !showSecurityAlert;

  const handleAllowForceLogin = () => {
    // Handle logout and allow force login
    toast.success('Force login allowed. Logging out...');
    setShowSecurityAlert(false);

    // Clear token and redirect to login
    localStorage.removeItem('token');
    localStorage.setItem('userLoggedOut', 'true');
    router.push('/');
  };

  const handleRejectForceLogin = () => {
    // Handle rejection
    toast.error('Force login request rejected');
    setShowSecurityAlert(false);
  };

  // Listen for force login request messages from JsSIP
  useEffect(() => {
    const handleForceLoginRequest = (event) => {
      console.log('Force login request received in Layout:', event.detail);
      setShowSecurityAlert(true);
      toast.error('Security Alert: Someone is trying to login from another device!');
    };

    // Listen for custom forceLoginRequest event
    window.addEventListener('forceLoginRequest', handleForceLoginRequest);

    // FOR TESTING: Expose a function to manually trigger the security alert
    // You can call this from browser console: window.testForceLogin()
    window.testForceLogin = () => {
      console.log('Testing force login alert...');
      setShowSecurityAlert(true);
    };

    return () => {
      window.removeEventListener('forceLoginRequest', handleForceLoginRequest);
      delete window.testForceLogin;
    };
  }, [setShowSecurityAlert]);

  return (
    <>
      {/* Security Alert Modal */}
      {showSecurityAlert && <ConsentRequestModal onAllow={handleAllowForceLogin} onReject={handleRejectForceLogin} />}

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-8">{children}</div>
        </main>
        <Footer />
      </div>

      {/* Phone UI - conditionally rendered WITHOUT wrapper - Hidden when Security Alert is shown */}
      {shouldShowPhone && <DraggableWebPhone />}

      {/* Persistent audio - ALWAYS mounted, never unmounts */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
    </>
  );
}
