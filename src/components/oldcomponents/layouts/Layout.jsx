import React from 'react';
import Footer from './Footer';
import TopBarPage from './TopBar';

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBarPage />
      <div className="flex-grow flex flex-col">
        <div className="flex-grow md:p-4 p-2">{children}</div>
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
