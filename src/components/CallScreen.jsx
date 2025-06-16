import { useState, useEffect, useContext } from 'react';
import {
  User,
  MicOff,
  Pause,
  UserPlus,
  Grip,
  XCircle,
  PhoneOff,
  Square,
  Merge,
  PhoneForwarded,
  Clock,
  Volume2,
  Loader2,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import HistoryContext from '@/context/HistoryContext';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import KeyPad from './KeyPad';
import Image from 'next/image';

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
  const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const parsedData = tokenData ? JSON.parse(tokenData) : {};
  const { username } = useContext(HistoryContext);
  const numberMasking = parsedData?.userData?.numberMasking;

  const handleTransfer = async () => {
    try {
      await axios.post(`${window.location.origin}/reqTransfer/${username}`, {});
      toast.success('Request successful!');
    } catch (error) {
      toast.error('Request failed. Please try again.');
    }
  };

  const handleMerge = () => {
    reqUnHold?.();
    setIsMerged(true);
  };

  useEffect(() => {
    if (conferenceNumber) {
      session?.unmute();
      setMuted(false);
    }
  }, [conferenceNumber, session]);

  // Masking logic
  const maybeMask = (num) => (numberMasking ? maskPhoneNumber?.(num) : num);

  // Main phone display
  const mainNumber = (() => {
    if (isMerged && phoneNumber && conferenceNumber) {
      return `${maybeMask(phoneNumber)} Conference with ${maybeMask(conferenceNumber)}`;
    }
    if (conferenceNumber) return maybeMask(conferenceNumber);
    if (phoneNumber) return maybeMask(phoneNumber);
    return maybeMask(userCall?.contactNumber) || '+1 (555) 123-4567';
  })();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      {/* Header */}
      <div className="flex flex-col items-center my-6">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <User className="text-primary-foreground" size={28} />
          </div>
        </div>
        <div className="text-center mb-2">
          <div className="text-xl font-bold text-foreground truncate px-4">{mainNumber}</div>
          <div className="flex items-center justify-center gap-2 mt-1">
            {isRunning ? (
              <>
                <Clock className="w-4 h-4 text-secondary-foreground" />
                <span className="text-lg font-mono text-secondary-foreground">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-primary text-sm">Calling...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="space-y-6">
        {!showKeyPad ? (
          <>
            {/* Primary Controls Row */}
            <div className="flex justify-center gap-4">
              <ControlButton
                onClick={toggleHold}
                disabled={!session}
                active={isHeld}
                icon={<Pause size={22} />}
                title="Hold"
              />
              <ControlButton
                disabled={!isMerged}
                onClick={handleTransfer}
                icon={<PhoneForwarded size={22} />}
                title="Transfer"
                className={!isMerged ? 'opacity-40' : ''}
              />
              <ControlButton onClick={() => setShowKeyPad(true)} icon={<Grip size={22} />} title="Keypad" />
            </div>

            {/* Secondary Controls Row */}
            <div className="flex justify-center gap-4 mt-4">
              {conferenceStatus ? (
                <ControlButton disabled={!session} onClick={handleMerge} icon={<Merge size={22} />} title="Merge" />
              ) : (
                <ControlButton
                  disabled={!session}
                  onClick={() => setCallConference?.(true)}
                  icon={<UserPlus size={22} />}
                  title="Add Call"
                />
              )}

              {/* Recording Button */}
              <ControlButton
                onClick={!isRecording ? startRecording : stopRecording}
                disabled={!session && !isRecording}
                icon={<Square size={22} className={isRecording ? 'text-destructive' : 'text-secondary-foreground'} />}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                active={isRecording}
              />

              <ControlButton
                active={muted}
                onClick={() => {
                  muted ? session?.unmute() : session?.mute();
                  setMuted(!muted);
                }}
                icon={<MicOff size={22} />}
                title="Mute"
              />
            </div>
          </>
        ) : (
          /* Keypad Section */
          <div className="space-y-4">
            <div className="relative">
              <button
                className="absolute -top-8 right-0 z-10 p-2 text-muted-foreground hover:text-destructive transition-all duration-200"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => {
                  setCurrNum('');
                  setShowKeyPad(false);
                }}
                aria-label="Close Keypad"
              >
                <XCircle size={22} className={isHovered ? 'text-destructive' : ''} />
              </button>
              <KeyPad setPhoneNumber={setCurrNum} />
            </div>
          </div>
        )}

        {/* End Call Button */}
        <div className="flex justify-center pt-4">
          <button
            className="text-white cursor-pointer w-14 h-14 flex items-center justify-center rounded-full bg-destructive shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rotate-[133deg] focus:outline-none focus:ring-2 focus:ring-destructive group"
            onClick={() => {
              session?.terminate();
              stopRecording?.();
            }}
            aria-label="End Call"
            type="button"
          >
            <Phone />
          </button>
        </div>

        {/* Audio Device Selector */}
        <div className="pt-4">
          <select
            id="audio-device"
            value={selectedDeviceId}
            onChange={(e) => changeAudioDevice?.(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
          >
            {Array.isArray(devices) && devices.length > 0 ? (
              devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Audio device ${index + 1}`}
                </option>
              ))
            ) : (
              <option value="default">Default Audio Device</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

// Reusable Control Button Component
const ControlButton = ({ onClick, disabled, active, icon, title, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-14 h-14 rounded-xl transition-all duration-200 flex items-center justify-center
        ${active ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-card/80 text-primary hover:bg-accent'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl active:scale-95'}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

export default CallScreen;
