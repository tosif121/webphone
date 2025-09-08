import { useState } from 'react';
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
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalls();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-3 border-b border-border bg-muted/60">
        {/* Back button */}
        <button
          onClick={() => setCallConference(false)}
          className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>

        {/* Phone number */}
        <h1 className="text-md font-semibold text-primary">{phoneNumber}</h1>

        {/* Timer */}
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-secondary-foreground" />
          <span className="text-sm font-mono text-secondary-foreground">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Conference Number Input */}
      <div className="relative p-3">
        <input
          type="text"
          value={formatPhoneNumber(conferenceNumber)}
          onChange={(e) => {
            const input = e.target.value;
            if (input.length <= 12) setConferenceNumber(input);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Conference number"
          className="w-full text-xl font-semibold bg-transparent border-b border-border focus:border-primary outline-none py-1.5 pr-8 text-foreground placeholder:text-muted-foreground transition-all"
          aria-label="Conference number"
        />
        {conferenceNumber && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-1.5 text-primary hover:text-destructive transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setConferenceNumber((prev) => prev.slice(0, -1).trim())}
            aria-label="Delete last digit"
          >
            <Delete className={`w-4 h-4 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
          </button>
        )}
      </div>

      {/* KeyPad */}
      <div className="px-3">
        <KeyPad setPhoneNumber={setConferenceNumber} />
      </div>

      {/* Call Button */}
      <div className="flex justify-center mt-4 pb-3">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full text-white shadow-md bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
          onClick={handleCalls}
          aria-label="Call"
        >
          <Phone className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
};

export default CallConference;
