import { useState, useEffect } from 'react';
import KeyPad from './KeyPad';
import NetworkMonitor from './NetworkMonitor';
import { Delete, History, Phone } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import { Button } from './ui/button';

const Home = ({ phoneNumber, setPhoneNumber, handleCall, setSeeLogs, timeoutArray, isConnectionLost }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  // Detect mobile screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    setIsMobile(mediaQuery.matches);

    const handleResize = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCall();
    }
  };

  return (
    <div className="md:p-3 p-4 h-full flex flex-col md:justify-start justify-end md:pb-0 pb-14">
      {/* Header - Only show on desktop, hidden on mobile since MobileNavigation provides it */}
      {!isMobile && (
        <div className="flex justify-between items-center mb-4 sm:mb-3 cursor-move select-none">
          <div className="text-base sm:text-lg font-semibold text-primary">WebPhone</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NetworkMonitor timeoutArray={timeoutArray} />
            <button
              className="text-primary hover:text-primary/70 transition-colors p-1"
              onClick={() => setSeeLogs(true)}
              aria-label="View Call History"
              tabIndex={-1}
            >
              <History className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile: White box with shadow around dialpad content */}
      <div>
        {/* Phone Input */}
        <div className="relative mb-6 md:mb-4">
          <input
            type="text"
            value={formatPhoneNumber(phoneNumber)}
            onChange={(e) => {
              const input = e.target.value;
              if (input.length <= 12) setPhoneNumber(input);
            }}
            onKeyDown={handleKeyDown}
            autoFocus={!isMobile}
            readOnly={isMobile}
            placeholder="Enter number"
            className="w-full text-4xl md:text-2xl placeholder:text-2xl font-normal text-center bg-transparent border-none focus:border-none outline-none py-0 pr-8 text-foreground placeholder:text-muted-foreground/50 transition-all"
            aria-label="Phone number"
          />
          {phoneNumber && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-2 text-foreground/70 hover:text-destructive transition-colors"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setPhoneNumber((prev) => prev.slice(0, -1).trim())}
              aria-label="Delete last digit"
            >
              <Delete className={`w-5 h-5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
            </button>
          )}
        </div>

        {/* KeyPad */}
        <div className="flex items-center justify-center sm:flex-1 mb-4">
          <KeyPad setPhoneNumber={setPhoneNumber} />
        </div>

        {/* Call Button */}
        <div className="flex justify-center">
          <button
            disabled={!phoneNumber}
            className="w-16 h-16 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-green-600 hover:bg-green-700 active:scale-95 hover:shadow-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCall}
            aria-label="Call"
          >
            <Phone className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
