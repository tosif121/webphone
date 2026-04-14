import React from 'react';

const WEB_VERSION = '0.2.25';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block w-full shrink-0 border-t border-border bg-background px-4 py-2 md:px-8 text-muted-foreground">
      <div className="flex flex-col md:flex-row items-center justify-center gap-2">
        <p className="text-sm">
          &copy; {currentYear} <span className="font-semibold text-primary">iotcom.io</span>. All rights reserved.
        </p>
        <span className="text-xs text-muted-foreground">version {WEB_VERSION}</span>
      </div>
    </footer>
  );
};

export default Footer;
