import { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
  conferenceCalls,
  hasParticipants,
  status,
  muted,
  setMuted,
  isCustomerAnswered,
  setHasParticipants,
  confRunning,
  confMinutes,
  confSeconds,
  isMerged,
  setIsMerged,
  setConfRunning,
  setConfSeconds,
  setConfMinutes,
}) => {
  const [currNum, setCurrNum] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showKeyPad, setShowKeyPad] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    setIsMobile(mediaQuery.matches);

    const handleResize = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // FIXED: Use ref to track processing state to avoid stale closures
  const processingRef = useRef(new Set());
  const [, forceUpdate] = useState({});

  const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const parsedData = tokenData ? JSON.parse(tokenData) : {};
  const { username } = useContext(HistoryContext);
  const numberMasking = parsedData?.userData?.numberMasking;

  // Start conference timer when participants join but not merged
  useEffect(() => {
    let interval;

    if (hasParticipants === 'connected' && conferenceStatus && !isMerged) {
      setConfRunning(true);
      session?.unmute();
      setMuted(false);

      interval = setInterval(() => {
        setConfSeconds((prev) => {
          if (prev === 59) {
            setConfMinutes((m) => m + 1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setConfRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasParticipants, conferenceStatus, isMerged]);

  // Reset conference timer when merged
  useEffect(() => {
    if (isMerged) {
      setConfRunning(false);
      setConfSeconds(0);
      setConfMinutes(0);
    }
  }, [isMerged]);

  // Reset states when conference ends
  useEffect(() => {
    if (!hasParticipants && !conferenceStatus) {
      setIsMerged(false);
      setConfRunning(false);
      setConfSeconds(0);
      setConfMinutes(0);
    }
  }, [hasParticipants, conferenceStatus]);

  const handleTransfer = async () => {
    try {
      await axios.post(`${window.location.origin}/reqTransfer/${username}`, {});
      toast.success('Request successful!');
    } catch (error) {
      toast.error('Request failed. Please try again.');
    }
  };

  // FIXED: Enhanced hold toggle with proper async handling
  const handleToggleHoldDebounced = useCallback(async () => {
    if (!toggleHold) {
      console.warn('toggleHold function not provided');
      return;
    }

    try {
      await toggleHold();
    } catch (error) {
      toast.error('Failed to toggle hold');
    }
  }, [toggleHold, isHeld]);

  const handleMerge = useCallback(() => {
    if (!hasParticipants) {
      toast.error('No conference participants to merge with');
      return;
    }

    // Log manual merge event
    const mergeLog = {
      timestamp: new Date().toISOString(),
      eventType: 'manual_merge',
      username,
      conferenceNumber,
      hasParticipants,
      isHeld,
      status,
      triggerSource: 'user_click_merge_button',
      userInitiated: true,
    };

    const existingLogs = JSON.parse(localStorage.getItem('mergeEventLogs') || '[]');
    existingLogs.push(mergeLog);

    if (existingLogs.length > 50) {
      existingLogs.shift();
    }

    localStorage.setItem('mergeEventLogs', JSON.stringify(existingLogs));

    reqUnHold?.();
    setIsMerged(true);
    toast.success('Merged with conference participants');
  }, [hasParticipants, username, conferenceNumber, isHeld, status, reqUnHold]);

  const handleMuteToggle = useCallback(() => {
    const newMutedState = !muted;

    if (newMutedState) {
      session?.mute();
    } else {
      session?.unmute();
    }

    setMuted(newMutedState);
  }, [muted, session]);

  const handleConferenceHangup = async () => {
    try {
      const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const parsedData = tokenData ? JSON.parse(tokenData) : {};
      const cleanNumber = conferenceNumber.replace(/\s/g, '');

      if (!cleanNumber) {
        toast.warning('No active conference to disconnect');
        return;
      }

      const response = await axios.post(
        `${window.location.origin}/hangup/hostChannel/Conf`,
        {
          user: username,
          hostNumber: cleanNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${parsedData?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Conference disconnected successfully');
        setHasParticipants('Conference disconnected');
      } else {
        if (response.data.message === 'Host channel not found in conference') {
          setHasParticipants('Conference disconnected');
        } else {
          toast.error('Failed to disconnect conference');
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Not authorized to end conference');
      } else {
        toast.error('Error disconnecting conference');

        if (session?.status < 6) {
          session.terminate();
        }
        if (stopRecording && typeof stopRecording === 'function') {
          stopRecording();
        }
      }
    } finally {
      setIsMerged(false);
      setConfRunning(false);
      setConfSeconds(0);
      setConfMinutes(0);
    }
  };

  const maybeMask = (num) => (numberMasking ? maskPhoneNumber?.(num) : num);

  const mainNumber = (() => {
    if (isMerged && userCall?.contactNumber && conferenceNumber) {
      return `${maybeMask(userCall?.contactNumber)} Conference with ${maybeMask(conferenceNumber)}`;
    }
    if (conferenceNumber) return maybeMask(conferenceNumber);
    if (userCall?.contactNumber) return maybeMask(userCall?.contactNumber);
    return maybeMask(userCall?.contactNumber) || '';
  })();

  // FIXED: Enhanced ControlButton with proper click handling
  const ControlButton = ({ onClick, disabled, active, icon, title, className = '', buttonId, debounceTime = 300 }) => {
    const isProcessing = processingRef.current.has(buttonId);
    const isDisabled = disabled || isProcessing;

    const handleClick = useCallback(
      async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // FIXED: Check processing state from ref
        if (processingRef.current.has(buttonId) || disabled || !onClick) {
          console.log(
            `🚫 Button ${buttonId} click ignored - processing: ${processingRef.current.has(
              buttonId
            )}, disabled: ${disabled}`
          );
          return;
        }

        // FIXED: Mark as processing immediately
        processingRef.current.add(buttonId);
        forceUpdate({}); // Force re-render to show loading state

        try {
          // Execute the actual click handler
          const result = onClick(e);

          // Handle both sync and async functions
          if (result instanceof Promise) {
            await result;
          }
        } catch (error) {
          toast.error(`${title} failed. Please try again.`);
        } finally {
          setTimeout(() => {
            processingRef.current.delete(buttonId);
            forceUpdate({});
          }, debounceTime);
        }
      },
      [onClick, disabled, buttonId, debounceTime, title]
    );

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        title={title}
        className={`
          w-14 h-14 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 flex items-center justify-center
          ${active ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card/80 text-primary hover:bg-accent'}
          ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg active:scale-95'}
          ${className}
        `}
      >
        {isProcessing ? <Loader2 size={isMobile ? 24 : 16} className="animate-spin" /> : icon}
      </button>
    );
  };

  return (
    <div className="flex flex-col sm:justify-start justify-end min-h-full md:pb-0 pb-14 px-0 md:px-3">
      {session && session.connection && <WebRTCStats peerConnection={session.connection} />}

      {/* Mobile: White box with shadow */}
      <div className={isMobile ? '' : 'w-full max-w-md mx-auto'}>
        {/* Header - Original UI Structure */}
        <div className="flex flex-col items-center my-4 md:my-3">
          <div className="relative mb-4 md:mb-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
              <User className="text-primary-foreground" size={isMobile ? 28 : 20} />
            </div>
          </div>

          <div className="text-center mb-3 md:mb-2">
            {conferenceStatus ? (
              <div className="text-lg md:text-sm font-medium text-muted-foreground max-w-[250px]">
                {userCall?.contactNumber} Hold {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            ) : (
              ''
            )}

            <div className="text-xl md:text-sm font-medium text-muted-foreground max-w-[250px]">{mainNumber}</div>

            <div className="flex items-center justify-center gap-1 mt-1">
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 sm:w-3 sm:h-3 text-secondary-foreground" />
                  <span className="text-lg md:text-sm font-mono text-secondary-foreground">
                    {conferenceNumber && !isMerged
                      ? `${String(confMinutes).padStart(2, '0')}:${String(confSeconds).padStart(2, '0')}`
                      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                  </span>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 sm:w-3 sm:h-3 text-primary animate-spin" />
                  <span className="text-primary text-sm md:text-xs">Calling...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls Section with Enhanced Buttons */}
        <div className="space-y-4">
          {!showKeyPad ? (
            <>
              {/* Primary Controls Row */}
              <div className="flex justify-center gap-6 sm:gap-4">
                <ControlButton
                  buttonId="hold-button"
                  onClick={handleToggleHoldDebounced}
                  disabled={!session || conferenceStatus}
                  active={isHeld}
                  icon={<Pause size={isMobile ? 24 : 16} />}
                  title="Hold"
                  debounceTime={1000}
                />
                <ControlButton
                  buttonId="transfer-button"
                  disabled={!isMerged}
                  onClick={handleTransfer}
                  icon={<PhoneForwarded size={isMobile ? 24 : 16} />}
                  title="Transfer"
                  className={!isMerged ? 'opacity-40' : ''}
                  debounceTime={500}
                />

                <ControlButton
                  buttonId="keypad-button"
                  onClick={() => setShowKeyPad(true)}
                  icon={<Grip size={isMobile ? 24 : 16} />}
                  title="Keypad"
                  debounceTime={200}
                />
              </div>

              {/* Secondary Controls Row */}
              <div className="flex justify-center gap-4 sm:gap-3">
                {conferenceStatus ? (
                  <ControlButton
                    buttonId="merge-button"
                    disabled={hasParticipants !== 'connected'}
                    onClick={handleMerge}
                    icon={<Merge size={isMobile ? 24 : 16} />}
                    title="Merge"
                    active={isMerged}
                    debounceTime={800}
                  />
                ) : (
                  <ControlButton
                    buttonId="add-call-button"
                    disabled={!session}
                    onClick={() => setCallConference?.(true)}
                    icon={<UserPlus size={isMobile ? 24 : 16} />}
                    title="Add Call"
                    debounceTime={500}
                    disabled={!isCustomerAnswered || isMerged}
                  />
                )}
                <ControlButton
                  buttonId="record-button"
                  onClick={!isRecording ? startRecording : stopRecording}
                  disabled={!session && !isRecording}
                  icon={
                    <Square
                      size={isMobile ? 24 : 16}
                      className={isRecording ? 'text-destructive' : 'text-secondary-foreground'}
                    />
                  }
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                  active={isRecording}
                  debounceTime={600}
                />

                <ControlButton
                  buttonId="mute-button"
                  active={muted}
                  onClick={handleMuteToggle}
                  icon={<MicOff size={isMobile ? 24 : 16} />}
                  title="Mute"
                  debounceTime={200}
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
                  <XCircle size={isMobile ? 24 : 16} className={isHovered ? 'text-destructive' : ''} />
                </button>
                <KeyPad setPhoneNumber={setCurrNum} />
              </div>
            </div>
          )}

          {/* End Call Button */}
          <div className="flex justify-center md:py-0 py-4">
            <button
              className="text-white cursor-pointer w-16 h-16 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-destructive shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 rotate-[133deg] focus:outline-none focus:ring-2 focus:ring-destructive"
              onClick={() => {
                if (conferenceNumber) {
                  handleConferenceHangup();
                } else {
                  session?.terminate();
                  stopRecording?.();
                }
              }}
              aria-label="End Call"
              title="End Call"
              type="button"
            >
              <Phone size={isMobile ? 24 : 18} />
            </button>
          </div>

          {/* Audio Device Selector */}
          <div className="text-center">
            <select
              id="audio-device"
              value={selectedDeviceId}
              onChange={(e) => changeAudioDevice?.(e.target.value)}
              className="md:w-full max-w-xs text-center bg-muted border border-border text-foreground text-xs rounded-lg p-2 outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
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
    </div>
  );
};

export default CallScreen;
