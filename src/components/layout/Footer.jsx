import React from 'react';

const WEB_VERSION = '0.1.7';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full p-4 md:px-10 bg-background border-t border-border text-muted-foreground mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-center gap-2">
        <p className="text-sm">
          &copy; {currentYear} <span className="font-semibold text-primary">iotcom.io</span>. All rights reserved.
        </p>
        <span className="text-xs text-muted-foreground">
          version {WEB_VERSION}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
