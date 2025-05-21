import { useState } from 'react';
import { FiPhone } from 'react-icons/fi';
import { TiBackspaceOutline, TiBackspace } from 'react-icons/ti';
import useFormatPhoneNumber from '../hooks/useFormatPhoneNumber';
import KeyPad from './KeyPad';
import toast from 'react-hot-toast';

const CallConference = ({ conferenceNumber, handleCall, setCallConference, phoneNumber, setConferenceNumber }) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatPhoneNumber = useFormatPhoneNumber();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCall();
    }
  };

  const handleCallClick = () => {
    handleCall();
  };

  return (
    <div className="flex flex-col items-center md:justify-center min-h-screen">
      <div className="w-full max-w-72 p-4 bg-white dark:bg-[#3333] rounded-lg shadow-[0px_0px_7px_0px_rgba(0,0,0,0.1)]">
        <div className="text-xl font-bold text-primary mb-2">WebPhone</div>
        <marquee
          className="text-sm text-white p-1 cursor-pointer bg-primary mb-4"
          onClick={() => setCallConference(false)}
        >
          Return on {phoneNumber}
        </marquee>
        <div className="relative mb-4">
          <input
            type="text"
            value={formatPhoneNumber(conferenceNumber)}
            onChange={(e) => {
              const input = e.target.value;
              if (input.length <= 12) {
                setConferenceNumber(input);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Phone number"
            className="w-full outline-none text-2xl indent-1.5 bg-white dark:bg-[#1a1a1a]/20 dark:text-white text-[#070707]"
          />

          {phoneNumber && (
            <div
              className="absolute inset-y-0 right-0 flex items-center cursor-pointer text-primary"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setConferenceNumber((prev) => prev.slice(0, -1).trim())}
            >
              {isHovered ? <TiBackspace size={24} /> : <TiBackspaceOutline size={24} />}
            </div>
          )}
        </div>

        <KeyPad setPhoneNumber={setConferenceNumber} />
        <div className="text-center">
          <button
            className="p-4 mt-4 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleCallClick}
          >
            <FiPhone size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallConference;
