import React from 'react';
import { HeartIcon } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-4 backdrop-blur-md static bg-white/80 dark:bg-slate-900/80 border-t border-white/20 dark:border-slate-700/20 text-slate-600 dark:text-slate-400 shadow-lg shadow-blue-500/5">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">
              &copy; {currentYear} 
              <span className="inline-block mx-2 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                iotcom.io
              </span>
            </p>
            <div className="flex items-center text-sm">
              <span>Built with</span>
              <HeartIcon className="h-4 w-4 mx-1 text-red-500" />
              <span>by SAMWAD team</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;