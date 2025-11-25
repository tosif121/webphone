import React, { useEffect, useContext } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import { JssipContext } from '@/context/JssipContext';

export default function Layout({ children }) {
  const router = useRouter();
  const { audioRef } = useContext(JssipContext);

  const hiddenPhoneRoutes = ['/webphone/v1/agent-dashboard', '/webphone/v1/system-monitoring'];
  const shouldShowPhone = !hiddenPhoneRoutes.includes(router.pathname);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-8">{children}</div>
        </main>
        <Footer />
      </div>
      
      {/* Phone UI - conditionally rendered WITHOUT wrapper */}
      {shouldShowPhone && <DraggableWebPhone />}

      {/* Persistent audio - ALWAYS mounted, never unmounts */}
      <audio 
        ref={audioRef} 
        autoPlay 
        playsInline
        style={{ display: 'none' }}
      />
    </>
  );
}
