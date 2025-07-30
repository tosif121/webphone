import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-8">{children}</div>
        </main>
        <Footer />
      </div>
      {router.pathname != '/webphone/v1/agent-dashboard' && <DraggableWebPhone />}
    </div>
  );
}
