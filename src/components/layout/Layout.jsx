import React from 'react';

import Header from './Header';
import { Footer } from 'react-day-picker';
import DraggableWebPhone from '../DraggableWebPhone';


export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-900 dark:to-blue-950 px-4 py-8">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(120,120,255,0.4)_0%,rgba(0,0,0,0)_60%),radial-gradient(circle_at_70%_60%,rgba(120,255,190,0.3)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 -ml-32 -mb-32 bg-gradient-to-tr from-emerald-400 to-cyan-500 opacity-20 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 md:px-6 md:py-12">
          <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 p-6 md:p-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      <DraggableWebPhone />
    </div>
  );
}
