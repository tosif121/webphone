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
    <>
      <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20">
        <button
          onClick={() => setCallConference(false)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-slate-600 dark:text-slate-300 hover:text-blue-700"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Conference Call
        </h1>
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
          aria-label="Call"
        >
          <Phone size={20} />
        </button>
      </div>
    </>
  );
};

export default CallConference;
