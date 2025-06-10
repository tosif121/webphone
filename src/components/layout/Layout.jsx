import React from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();
  return (
    <div>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted text-muted-foreground flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      {router.pathname != '/webphone/agent-dashboard' && <DraggableWebPhone />}
    </div>
  );
}