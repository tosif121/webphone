import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full p-4 md:px-10 bg-background border-t border-border text-muted-foreground mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <p className="text-sm">
          &copy; {currentYear} <span className="font-semibold text-primary">iotcom.io</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
