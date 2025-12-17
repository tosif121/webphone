import { useState, useEffect } from 'react';
import { Phone, Delete, ArrowLeft, Clock } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import KeyPad from './KeyPad';
import { Button } from './ui/button';

const CallConference = ({
  conferenceNumber,
  handleCalls,
  setCallConference,
  phoneNumber,
  setConferenceNumber,
  seconds,
  minutes,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  // Detect mobile screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    setIsMobile(mediaQuery.matches);

    const handleResize = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalls();
    }
  };

  return (
    <div className="p-3 h-full flex items-end md:pb-0 pb-10 justify-center">
      {/* Mobile: White box with shadow */}
      <div className={isMobile ? '  ' : 'w-full max-w-md mx-auto'}>
        {/* Header - Only show on desktop */}
        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border bg-transparent md:bg-muted/60 md:p-3 p-0 rounded-none md:rounded-lg">
          {/* Back button */}
          <button
            onClick={() => setCallConference(false)}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-7 sm:h-7 rounded bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Phone number */}
          <h1 className="text-xl md:text-md font-semibold text-primary">{phoneNumber}</h1>

          {/* Timer */}
          <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 sm:w-3 sm:h-3 text-secondary-foreground" />
                  <span className="text-lg md:text-sm font-mono text-secondary-foreground">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Conference Number Input */}
        <div className="relative my-6 md:my-4">
          <input
            type="text"
            value={formatPhoneNumber(conferenceNumber)}
            onChange={(e) => {
              const input = e.target.value;
              if (input.length <= 12) setConferenceNumber(input);
            }}
            onKeyDown={handleKeyDown}
            readOnly={isMobile}
            placeholder="Conference number"
            className="w-full text-4xl md:text-2xl font-normal text-center bg-transparent border-none focus:border-none outline-none py-0 pr-8 text-foreground placeholder:text-muted-foreground/50 transition-all"
            aria-label="Conference number"
            onTouchStart={(e) => {
              // Prevent mobile keyboard from appearing on touch
              if (isMobile) {
                e.preventDefault();
                e.target.blur();
              }
            }}
            onFocus={(e) => {
              // Prevent mobile keyboard on focus
              if (isMobile) {
                e.target.blur();
              }
            }}
          />
          {conferenceNumber && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-2 text-foreground/70 hover:text-destructive transition-colors"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setConferenceNumber((prev) => prev.slice(0, -1).trim())}
              aria-label="Delete last digit"
            >
              <Delete className={`w-6 h-6 sm:w-5 sm:h-5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
            </button>
          )}
        </div>

        {/* KeyPad */}
        <div className="flex items-center justify-center mb-4">
          <KeyPad setPhoneNumber={setConferenceNumber} />
        </div>

        {/* Call Button */}
        <div className="flex justify-center">
          <button
            disabled={!conferenceNumber}
            className="w-16 h-16 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-green-600 hover:bg-green-700 active:scale-95 hover:shadow-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCalls}
            aria-label="Call"
          >
            <Phone className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallConference;
