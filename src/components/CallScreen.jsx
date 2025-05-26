import { User, MicOff, Pause, UserPlus, Key } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { PhoneOff } from 'lucide-react';
import { Square } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Merge } from 'lucide-react';
import { PhoneForwarded } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import HistoryContext from '@/context/HistoryContext';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import KeyPad from './KeyPad';

const CallScreen = ({
  conferenceNumber,
  reqUnHold,
  toggleHold,
  isHeld,
  phoneNumber,
  session,
  seconds,
  minutes,
  isRunning,
  devices,
  selectedDeviceId,
  changeAudioDevice,
  isRecording,
  startRecording,
  stopRecording,
  setCallConference,
  conferenceStatus,
  userCall,
}) => {
  const [currNum, setCurrNum] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showKeyPad, setShowKeyPad] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isMerged, setIsMerged] = useState(false);
  const tokenData = localStorage.getItem('token');
  const parsedData = JSON.parse(tokenData);
  const adminUser = parsedData?.userData?.adminuser;
  const { username } = useContext(HistoryContext);
  const numberMasking = parsedData?.userData?.numberMasking;

  const handleTransfer = async () => {
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/reqTransfer/${username}`, {});
      toast.success('Request successful!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Request failed. Please try again.');
    }
  };

  const handleMerge = () => {
    reqUnHold();
    setIsMerged(true);
  };

  useEffect(() => {
    if (conferenceNumber) {
      session.unmute();
      setMuted(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center md:justify-center min-h-screen">
      <div className="flex flex-col items-center w-full max-w-72 p-6 bg-white dark:bg-[#3333] rounded-lg shadow-[0px_0px_7px_0px_rgba(0,0,0,0.1)]">
        <div className={`flex flex-col items-center ${showKeyPad ? '' : 'mb-24'}`}>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <User className="text-white text-2xl" />
          </div>
          <marquee className="text-2xl font-bold text-primary mb-2">
            {(() => {
              const maybeMask = (num) => (numberMasking ? maskPhoneNumber(num) : num);

              if (isMerged && phoneNumber && conferenceNumber) {
                return `${maybeMask(phoneNumber)} Conference with ${maybeMask(conferenceNumber)}`;
              }

              if (conferenceNumber) return maybeMask(conferenceNumber);
              if (phoneNumber) return maybeMask(phoneNumber);
              return maybeMask(userCall?.contactNumber);
            })()}
          </marquee>

          {!isRunning ? (
            <span className="text-gray-500">Calling...</span>
          ) : (
            <span className="text-gray-500">
              {minutes} : {seconds}
            </span>
          )}
        </div>

        <div className="w-full">
          {!showKeyPad ? (
            <div className="mb-6">
              <div className="flex justify-around items-center">
                <button
                  onClick={toggleHold}
                  disabled={!session}
                  className={`p-4 rounded-full ${isHeld ? 'bg-primary text-white' : 'text-gray-600 dark:text-white'}`}
                  title="Hold"
                >
                  <Pause className="text-3xl" />
                </button>
                <button
                  disabled={!isMerged}
                  onClick={handleTransfer}
                  className={`p-4 rounded-full dark:text-white ${isMerged ? 'opacity-100' : 'opacity-45'}`}
                  title="Call Transfer"
                >
                  <PhoneForwarded className="text-3xl" />
                </button>

                <button
                  className="p-4 text-gray-600 dark:text-white rounded-full"
                  onClick={() => setShowKeyPad(true)}
                  title="Keypad"
                >
                  <Key className="text-3xl" />
                </button>
              </div>
              <div className="flex justify-around items-center">
                {(conferenceStatus && (
                  <button
                    className="p-4 rounded-full text-gray-600 dark:text-white"
                    disabled={!session}
                    onClick={handleMerge}
                    title="Merge"
                  >
                    <Merge className="text-3xl" />
                  </button>
                )) || (
                  <button
                    className="p-4 rounded-full text-gray-600 dark:text-white"
                    disabled={!session}
                    onClick={() => setCallConference(true)}
                    title="Call Conference"
                  >
                    <UserPlus className="text-3xl" />
                  </button>
                )}

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!session}
                    className={`flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-white rounded-lg transition-opacity focus:outline-none ${
                      !session ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Recording"
                  >
                    <Square className="text-3xl text-green-500" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-white rounded-lg transition-opacity focus:outline-none"
                  >
                    <Square className="text-3xl text-red-500" />
                    <span className="ml-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  </button>
                )}
                <button
                  className={`p-4 rounded-full ${muted ? 'bg-primary text-white' : 'text-gray-600 dark:text-white'}`}
                  onClick={() => {
                    muted ? session.unmute() : session.mute();
                    setMuted(!muted);
                  }}
                  title="Mute"
                >
                  <MicOff className="text-3xl" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-4 relative">
              <div className="text-xl font-bold text-primary mb-2">{currNum}</div>
              <KeyPad setPhoneNumber={setCurrNum} />
              <div
                className="flex items-center justify-center mt-4 text-primary cursor-pointer absolute -top-6 right-1"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => {
                  setCurrNum('');
                  setShowKeyPad(false);
                }}
              >
                <XCircle className={`text-3xl ${isHovered ? 'fill-current' : ''}`} />
              </div>
            </div>
          )}
        </div>

        <button
          className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
          onClick={() => {
            session.terminate();
            stopRecording();
          }}
        >
          <PhoneOff size={20} />
        </button>

        <div className="mt-5">
          <select
            id="audio-device"
            value={selectedDeviceId}
            onChange={(e) => changeAudioDevice(e.target.value)}
            className="bg-gray-50 border dark:text-white dark:bg-[#3333] dark:border-[#333] border-[#ddd] text-gray-900 text-sm rounded-lg block w-full p-2.5 outline-none"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Audio device ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CallScreen;