import { useState } from 'react';
import KeyPad from './KeyPad';
import NetworkMonitor from './NetworkMonitor';
import { Delete, History, Phone } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import { Button } from './ui/button';

const Home = ({
  phoneNumber,
  setPhoneNumber,
  handleCall,
  setSeeLogs,
  timeoutArray,
  isConnectionLost,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCall();
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 cursor-move select-none">
        <div className="text-lg font-semibold text-primary">WebPhone</div>
        <div className="flex items-center gap-3">
          <NetworkMonitor timeoutArray={timeoutArray} />
          <button
            className="text-primary hover:text-primary/70 transition-colors"
            onClick={() => setSeeLogs(true)}
            aria-label="View Call History"
            tabIndex={-1}
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Phone Input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={formatPhoneNumber(phoneNumber)}
          onChange={(e) => {
            const input = e.target.value;
            if (input.length <= 12) setPhoneNumber(input);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Phone number"
          className="w-full text-xl font-semibold bg-transparent border-b border-border focus:border-primary outline-none py-1.5 pr-8 text-foreground placeholder:text-muted-foreground transition-all"
          aria-label="Phone number"
        />
        {phoneNumber && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-1.5 text-primary hover:text-destructive transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setPhoneNumber((prev) => prev.slice(0, -1).trim())}
            aria-label="Delete last digit"
          >
            <Delete className={`w-4 h-4 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
          </button>
        )}
      </div>

      {/* KeyPad */}
      <div className="flex-1">
        <KeyPad setPhoneNumber={setPhoneNumber} />
      </div>

      {/* Call Button */}
      <div className="flex justify-center">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full text-white shadow-md bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
          onClick={handleCall}
          aria-label="Call"
        >
          <Phone className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Home;
