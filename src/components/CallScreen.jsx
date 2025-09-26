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
import WebRTCStats from './WebRTCStats';

const CallScreen = ({
  conferenceNumber,
  reqUnHold,
  toggleHold,
  isHeld,
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
  const [confSeconds, setConfSeconds] = useState(0);
  const [confMinutes, setConfMinutes] = useState(0);
  const [confRunning, setConfRunning] = useState(false);

  // Start conference call timer when new conference call starts
  useEffect(() => {
    let interval;
    if (conferenceNumber && !isMerged) {
      setConfRunning(true);
      interval = setInterval(() => {
        setConfSeconds((prev) => {
          if (prev === 59) {
            setConfMinutes((m) => m + 1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [conferenceNumber, isMerged]);

  // Reset when merged
  useEffect(() => {
    if (isMerged) {
      setConfRunning(false);
      setConfSeconds(0);
      setConfMinutes(0);
    }
  }, [isMerged]);

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

  const maybeMask = (num) => (numberMasking ? maskPhoneNumber?.(num) : num);

  const mainNumber = (() => {
    if (isMerged && userCall?.contactNumber && conferenceNumber) {
      return `${maybeMask(userCall?.contactNumber)} Conference with ${maybeMask(conferenceNumber)}`;
    }
    if (conferenceNumber) return maybeMask(conferenceNumber);
    if (userCall?.contactNumber) return maybeMask(userCall?.contactNumber);
    return maybeMask(userCall?.contactNumber) || '';
  })();

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-3">
      {session && session.connection && <WebRTCStats peerConnection={session.connection} />}

      {/* Header */}
      <div className="flex flex-col items-center my-3">
        <div className="relative mb-2">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
            <User className="text-primary-foreground" size={20} />
          </div>
        </div>
        <div className="text-center mb-2">
          {conferenceStatus ? (
            <div className="text-sm font-medium text-muted-foreground max-w-[250px]">
              {userCall?.contactNumber} Hold {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          ) : (
            ''
          )}
          <div className="text-sm font-medium text-muted-foreground max-w-[250px]">{mainNumber}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {isRunning ? (
              <>
                <Clock className="w-3 h-3 text-secondary-foreground" />
                <span className="text-sm font-mono text-secondary-foreground">
                  {conferenceNumber && !isMerged
                    ? `${String(confMinutes).padStart(2, '0')}:${String(confSeconds).padStart(2, '0')}`
                    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                </span>
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span className="text-primary text-xs">Calling...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="space-y-4">
        {!showKeyPad ? (
          <>
            {/* Primary Controls Row */}
            <div className="flex justify-center gap-3">
              <ControlButton
                onClick={toggleHold}
                disabled={!session}
                active={isHeld}
                icon={<Pause size={16} />}
                title="Hold"
              />
              <ControlButton
                disabled={!isMerged}
                onClick={handleTransfer}
                icon={<PhoneForwarded size={16} />}
                title="Transfer"
                className={!isMerged ? 'opacity-40' : ''}
              />
              <ControlButton onClick={() => setShowKeyPad(true)} icon={<Grip size={16} />} title="Keypad" />
            </div>

            {/* Secondary Controls Row */}
            <div className="flex justify-center gap-3">
              {conferenceStatus ? (
                <ControlButton disabled={!session} onClick={handleMerge} icon={<Merge size={16} />} title="Merge" />
              ) : (
                <ControlButton
                  disabled={!session}
                  onClick={() => setCallConference?.(true)}
                  icon={<UserPlus size={16} />}
                  title="Add Call"
                />
              )}

              <ControlButton
                onClick={!isRecording ? startRecording : stopRecording}
                disabled={!session && !isRecording}
                icon={<Square size={16} className={isRecording ? 'text-destructive' : 'text-secondary-foreground'} />}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                active={isRecording}
              />

              <ControlButton
                active={muted}
                onClick={() => {
                  muted ? session?.unmute() : session?.mute();
                  setMuted(!muted);
                }}
                icon={<MicOff size={16} />}
                title="Mute"
              />
            </div>
          </>
        ) : (
          /* Keypad Section */
          <div className="space-y-3">
            <div className="relative">
              <button
                className="absolute -top-6 right-0 z-10 p-1 text-muted-foreground hover:text-destructive transition-all duration-200"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => {
                  setCurrNum('');
                  setShowKeyPad(false);
                }}
                aria-label="Close Keypad"
              >
                <XCircle size={18} className={isHovered ? 'text-destructive' : ''} />
              </button>
              <KeyPad setPhoneNumber={setCurrNum} />
            </div>
          </div>
        )}

        {/* End Call Button */}
        <div className="flex justify-center">
          <button
            className="text-white cursor-pointer w-12 h-12 flex items-center justify-center rounded-full bg-destructive shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 rotate-[133deg] focus:outline-none focus:ring-2 focus:ring-destructive"
            onClick={() => {
              session?.terminate();
              stopRecording?.();
            }}
            aria-label="End Call"
            type="button"
          >
            <Phone size={18} />
          </button>
        </div>

        {/* Audio Device Selector */}
        <div>
          <select
            id="audio-device"
            value={selectedDeviceId}
            onChange={(e) => changeAudioDevice?.(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-2 outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
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

// Reusable Control Button Component (Reduced Size)
const ControlButton = ({ onClick, disabled, active, icon, title, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center
        ${active ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card/80 text-primary hover:bg-accent'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg active:scale-95'}
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

export default CallScreen;
