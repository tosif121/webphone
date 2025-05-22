import React from 'react';

function Footer() {
  return (
    <footer className="bg-transparent border-t-[#ddd] dark:border-[#333] text-gray-900 py-4 border-t dark:text-white">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} iotcom.io All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
