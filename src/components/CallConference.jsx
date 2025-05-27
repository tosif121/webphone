import { useState } from 'react';
import { Phone, Delete, ArrowLeft } from 'lucide-react';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import KeyPad from './KeyPad';

const CallConference = ({ conferenceNumber, handleCall, setCallConference, phoneNumber, setConferenceNumber }) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCall();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div
        className="
        w-full max-w-xs md:max-w-sm
        p-6 md:p-8
        backdrop-blur-md
        bg-white/80 dark:bg-slate-900/80
        rounded-2xl
        border border-white/30 dark:border-slate-700/30
        shadow-xl shadow-blue-500/10
        transition-all
      "
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-slate-600 dark:text-slate-300 hover:text-blue-700"
            aria-label="Back"
            onClick={() => setCallConference(false)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Conference Call
          </div>
        </div>

        {/* Info Bar */}
        <div className="mb-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center font-medium shadow-sm">
          Returning to: <span className="font-mono">{phoneNumber}</span>
        </div>

        {/* Conference Number Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={formatPhoneNumber(conferenceNumber)}
            onChange={(e) => {
              const input = e.target.value;
              if (input.length <= 12) setConferenceNumber(input);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Conference number"
            className="
              w-full text-2xl font-medium
              bg-transparent
              border-b-2 border-blue-200 dark:border-blue-700
              focus:border-blue-500 dark:focus:border-blue-400
              outline-none
              py-2 pr-10
              text-slate-800 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              transition-all
            "
            aria-label="Conference number"
          />
          {conferenceNumber && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-2 text-blue-600 dark:text-blue-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
            aria-label="Start Conference Call"
          >
            <Phone size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallConference;
