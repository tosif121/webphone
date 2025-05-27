import { useState } from 'react';
import KeyPad from './KeyPad';
import NetworkMonitor from './NetworkMonitor';
import { Delete, History, Phone } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';

const Home = ({ phoneNumber, setPhoneNumber, handleCall, setSeeLogs, timeoutArray, isConnectionLost }) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCall();
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header (Drag Handle) */}
      <div className="flex justify-between items-center mb-4 cursor-move select-none">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          WebPhone
        </div>
        <div className="flex items-center gap-4">
          <NetworkMonitor timeoutArray={timeoutArray} />
          <button
            className="text-blue-600 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            onClick={() => setSeeLogs(true)}
            aria-label="View Call History"
            tabIndex={-1}
          >
            <History className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Phone Input */}
      <div className="relative mb-4">
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
          className="w-full text-2xl font-medium bg-transparent
              border-b-2 border-blue-200 dark:border-blue-700
              focus:border-blue-500 dark:focus:border-blue-400
              outline-none
              py-2 pr-10
              text-slate-800 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              transition-all
            "
          aria-label="Phone number"
        />
        {phoneNumber && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-2 text-blue-600 dark:text-blue-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setPhoneNumber((prev) => prev.slice(0, -1).trim())}
            aria-label="Delete last digit"
          >
            <Delete className={`w-6 h-6 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`} />
          </button>
        )}
      </div>

      {/* KeyPad */}
      <div className="flex-1">
        <KeyPad setPhoneNumber={setPhoneNumber} />
      </div>

      {/* Call Button */}
      <div className="flex justify-center mt-6">
        <button
          className="
              w-14 h-14 flex items-center justify-center
              rounded-full
              bg-gradient-to-r from-emerald-500 to-green-500
              text-white text-2xl
              shadow-lg shadow-emerald-500/20
              hover:from-emerald-600 hover:to-green-600
              focus:outline-none focus:ring-2 focus:ring-emerald-400
              transition-all
              disabled:bg-gray-300 disabled:cursor-not-allowed
            "
          onClick={handleCall}
          disabled={isConnectionLost}
          aria-label="Call"
        >
          <Phone size={20} />
        </button>
      </div>
    </div>
  );
};

export default Home;
