import { useState } from 'react';
import { Phone, Delete, ArrowLeft } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import KeyPad from './KeyPad';
import { Button } from './ui/button';

const CallConference = ({ conferenceNumber, handleCall, setCallConference, phoneNumber, setConferenceNumber }) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCall();
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/60">
        <button
          onClick={() => setCallConference(false)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-semibold text-primary">Conference Call</h1>
      </div>

      {/* Conference Number Input */}
      <div className="relative p-4">
        <input
          type="text"
          value={formatPhoneNumber(conferenceNumber)}
          onChange={(e) => {
            const input = e.target.value;
            if (input.length <= 12) setConferenceNumber(input);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Conference number"
          className="w-full text-2xl font-medium bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 pr-10 text-foreground placeholder:text-muted-foreground transition-all"
          aria-label="Conference number"
        />
        {conferenceNumber && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-2 text-primary hover:text-destructive transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setConferenceNumber((prev) => prev.slice(0, -1).trim())}
            aria-label="Delete last digit"
          >
            <Delete className={`w-6 h-6 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
          </button>
        )}
      </div>

      {/* KeyPad */}
      <KeyPad setPhoneNumber={setConferenceNumber} />

      {/* Call Button */}
      <div className="flex justify-center mt-6">
        <Button
          size="icon"
          className="w-14 h-14 cursor-pointer rounded-full text-2xl text-white shadow-lg bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
          onClick={handleCall}
          aria-label="Call"
        >
          <Phone className="h-8 w-8" />
        </Button>
      </div>
    </>
  );
};

export default CallConference;
