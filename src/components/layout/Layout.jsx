import React, { useEffect, useContext } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { JssipContext } from '@/context/JssipContext';

export default function Layout({ children }) {
  const router = useRouter();
  const { audioRef } = useContext(JssipContext);

  // Routes where phone UI should be hidden (but audio remains active)
  const hiddenPhoneRoutes = ['/webphone/v1/agent-dashboard', '/webphone/v1/system-monitoring'];
  const shouldHidePhone = hiddenPhoneRoutes.includes(router.pathname);

  return (
    <div>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-8">{children}</div>
        </main>
        <Footer />
      </div>
      
      {/* Always render DraggableWebPhone but control visibility */}
      <div style={{ display: shouldHidePhone ? 'none' : 'block' }}>
        <DraggableWebPhone />
      </div>

      {/* Persistent audio element - always mounted regardless of route */}
      <audio 
        ref={audioRef} 
        autoPlay 
        playsInline
        style={{ display: 'none' }}
      />
    </div>
  );
}