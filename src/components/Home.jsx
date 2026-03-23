import { useState, useEffect } from 'react';
import KeyPad from './KeyPad';
import NetworkMonitor from './NetworkMonitor';
import { Delete, Phone } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';

const Home = ({ phoneNumber, setPhoneNumber, handleCall, setSeeLogs, timeoutArray, isConnectionLost, headerAction = null }) => {
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 pt-2.5 pb-2">
      {/* Header - Only show on desktop, hidden on mobile since MobileNavigation provides it */}
      {!isMobile && (
        <div className="mb-3 flex cursor-move select-none items-center justify-between">
          <div className="text-base sm:text-lg font-semibold text-primary">WebPhone</div>
          <div className="flex items-center gap-3">
            <NetworkMonitor timeoutArray={timeoutArray} />
            {headerAction}
          </div>
        </div>
      )}

      {/* Mobile: White box with shadow around dialpad content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Phone Input */}
        <div className="relative mb-1.5 shrink-0 border-b border-border/80 pb-2">
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
            className="w-full bg-transparent py-0 pr-8 text-center text-3xl font-medium tracking-[0.08em] text-foreground outline-none transition-all placeholder:text-xl placeholder:text-muted-foreground/45 md:text-[28px]"
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
          <div className="mb-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <KeyPad setPhoneNumber={setPhoneNumber} />
          </div>

        {/* Call Button */}
        <div className="flex shrink-0 justify-center pb-1 pt-0">
          <button
            disabled={!phoneNumber}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCall}
            aria-label="Call"
          >
            <Phone className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
