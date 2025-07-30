import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HistoryScreen from './HistoryScreen';
import Home from './Home';
import CallScreen from './CallScreen';
import useJssip from '@/hooks/useJssip';
import CallConference from './CallConference';
import { JssipContext } from '@/context/JssipContext';
import IncomingCall from './IncomingCall';

function getInitialWebphoneState() {
  if (typeof window === 'undefined') {
    return {
      x: 200,
      y: 180,
      width: 330,
      height: 600,
    };
  }

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Default state, scaled slightly for screen size
  const defaultState = {
    x: Math.max(0, windowWidth - 350),
    y: 180,
    width: Math.min(330, windowWidth * 0.3), // Scale width to 30% of screen for larger desktops
    height: Math.min(550, windowHeight * 0.7), // Scale height to 70% of screen
  };

  try {
    const saved = localStorage.getItem('webphone-position');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clamp loaded position to current window bounds
      return {
        ...parsed,
        x: Math.max(0, Math.min(parsed.x, windowWidth - (parsed.width || defaultState.width))),
        y: Math.max(0, Math.min(parsed.y, windowHeight - (parsed.height || defaultState.height))),
      };
    }
  } catch {}
  return defaultState;
}

export default function DraggableWebPhone() {
  const {
    ringtone,
    conferenceStatus,
    reqUnHold,
    conferenceNumber,
    setConferenceNumber,
    createConferenceCall,
    toggleHold,
    isHeld,
    seconds,
    minutes,
    status,
    phoneNumber,
    setPhoneNumber,
    handleCall,
    session,
    isRunning,
    audioRef,
    devices,
    selectedDeviceId,
    changeAudioDevice,
    isRecording,
    startRecording,
    stopRecording,
    bridgeID,
    dispositionModal,
    setDispositionModal,
    userCall,
    timeoutArray,
    isConnectionLost,
    followUpDispoes,
    incomingSession,
    incomingNumber,
    isIncomingRinging,
    answerIncomingCall,
    rejectIncomingCall,
    ringtoneRef,
    playRingtone,
    stopRingtone,
    conferenceCalls,
    callConference,
    setCallConference,
    isMobile, // Assuming this is provided; if not, see useEffect below
  } = useContext(JssipContext);

  const [webphoneState, setWebphoneState] = useState(getInitialWebphoneState);
  const [audioSrc, setAudioSrc] = useState('');
  const [phoneShow, setPhoneShow] = useState(false); // Always start with false for SSR
  const [isHydrated, setIsHydrated] = useState(false);
  const [seeLogs, setSeeLogs] = useState(false);

  // If isMobile isn't provided in context, detect it responsively
  const [localIsMobile, setLocalIsMobile] = useState(false);
  const effectiveIsMobile = isMobile ?? localIsMobile;

  // Detect mobile based on screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    setLocalIsMobile(mediaQuery.matches);

    const handleResize = () => setLocalIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (effectiveIsMobile && phoneShow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [effectiveIsMobile, phoneShow]);

  // Handle hydration and localStorage sync
  useEffect(() => {
    setIsHydrated(true);
    try {
      const saved = localStorage.getItem('phoneShow');
      if (saved) {
        setPhoneShow(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load phoneShow from localStorage:', error);
    }
  }, []);

  // Save phoneShow to localStorage when it changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('phoneShow', JSON.stringify(phoneShow));
      } catch (error) {
        console.warn('Failed to save phoneShow to localStorage:', error);
      }
    }
  }, [phoneShow, isHydrated]);

  useEffect(() => {
    if (isIncomingRinging) {
      setPhoneShow(true);
    }
  }, [isIncomingRinging]);

  useEffect(() => {
    if (status === 'calling') {
      setPhoneShow(true);
    }
  }, [status]);

  // Save webphoneState to localStorage
  useEffect(() => {
    if (webphoneState && !effectiveIsMobile && isHydrated) {
      localStorage.setItem('webphone-position', JSON.stringify(webphoneState));
    }
  }, [webphoneState, effectiveIsMobile, isHydrated]);

  // Handle window resize: Clamp position to new bounds
  useEffect(() => {
    if (effectiveIsMobile || !isHydrated) return;

    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setWebphoneState((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(prev.x, windowWidth - prev.width)),
        y: Math.max(0, Math.min(prev.y, windowHeight - prev.height)),
        // Optional: Scale size slightly on resize for better fit
        width: Math.min(prev.width, windowWidth * 0.4),
        height: Math.min(prev.height, windowHeight * 0.8),
      }));
    };

    // Debounce for performance
    let timeout;
    const debouncedResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleResize, 200);
    };

    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [effectiveIsMobile, isHydrated]);

  const handleDragStop = (e, d) => {
    if (!effectiveIsMobile) {
      setWebphoneState((prev) => ({
        ...prev,
        x: d.x,
        y: d.y,
      }));
    }
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    if (!effectiveIsMobile) {
      setWebphoneState({
        x: position.x,
        y: position.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
    }
  };

  function handleCalls() {
    createConferenceCall();
    setCallConference(false);
  }

  useEffect(() => {
    if (status === 'start') {
      stopRecording();
    }
  }, [status]);

  // Render the phone content (unchanged)
  const renderPhoneContent = () => (
    <div className={effectiveIsMobile ? 'w-full h-full' : 'webphone-drag-handle w-full h-full'}>
      {/* Incoming Call - Only show on mobile when ringing */}
      {effectiveIsMobile && isIncomingRinging && (
        <IncomingCall
          {...{ incomingNumber, incomingSession, isIncomingRinging, answerIncomingCall, rejectIncomingCall, session }}
        />
      )}

      {/* History Screen - Don't show during incoming calls on mobile */}
      {!(effectiveIsMobile && isIncomingRinging) && seeLogs && <HistoryScreen setSeeLogs={setSeeLogs} />}

      {/* Home Screen - Don't show during incoming calls on mobile */}
      {!(effectiveIsMobile && isIncomingRinging) && !seeLogs && status === 'start' && (
        <Home
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          handleCall={handleCall}
          setSeeLogs={setSeeLogs}
          timeoutArray={timeoutArray}
          isConnectionLost={isConnectionLost}
        />
      )}

      {/* Active Call Screens - Don't show during incoming calls on mobile */}
      {!(effectiveIsMobile && isIncomingRinging) &&
        !seeLogs &&
        (status === 'calling' || status === 'ringing' || status === 'conference') &&
        (callConference ? (
          <CallConference
            conferenceNumber={conferenceNumber}
            setCallConference={setCallConference}
            setConferenceNumber={setConferenceNumber}
            handleCall={handleCalls}
            setSeeLogs={setSeeLogs}
            phoneNumber={phoneNumber}
          />
        ) : (
          <CallScreen
            conferenceNumber={conferenceNumber}
            userCall={userCall}
            reqUnHold={reqUnHold}
            setCallConference={setCallConference}
            toggleHold={toggleHold}
            isHeld={isHeld}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            phoneNumber={phoneNumber}
            session={session}
            seconds={seconds < 10 ? `0${seconds}` : `${seconds}`}
            minutes={minutes < 10 ? `0${minutes}` : `${minutes}`}
            isRunning={isRunning}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            changeAudioDevice={changeAudioDevice}
            conferenceStatus={conferenceStatus}
            status={status}
          />
        ))}

      {/* Fallback - Don't show during incoming calls on mobile */}
      {!(effectiveIsMobile && isIncomingRinging) &&
        !seeLogs &&
        !['start', 'calling', 'ringing', 'conference'].includes(status) && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-6">
              <PhoneCall className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-200">No Active Calls</h3>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-2">Ready to make or receive calls</p>
          </div>
        )}
    </div>
  );

  return (
    <>
      {/* <audio ref={ringtoneRef} preload="auto">
        <source src="/sounds/ringtone.mp3" type="audio/mp3" />
      </audio> */}

      {/* Floating Toggle Button - Responsive positioning */}
      <div className="fixed bottom-2 sm:bottom-20 right-4 sm:right-8 z-[51]">
        <Button
          type="button"
          size="lg"
          className="rounded-full w-14 h-14 hover:scale-105 transition-transform"
          onClick={() => setPhoneShow((prev) => !prev)}
          aria-label={phoneShow ? 'Hide phone interface' : 'Show phone interface'}
        >
          {!phoneShow ? <PhoneOff className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
        </Button>
      </div>

      {/* Phone Interface */}
      {(!dispositionModal && phoneShow && (
        <>
          {effectiveIsMobile ? (
            // Mobile: Fixed overlay covering full screen
            <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl h-[550px] bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
                {renderPhoneContent()}
              </div>
            </div>
          ) : (
            // Desktop: Draggable and resizable
            <Rnd
              position={{ x: webphoneState.x, y: webphoneState.y }}
              size={{ width: webphoneState.width, height: webphoneState.height }}
              onDragStop={handleDragStop}
              onResizeStop={handleResizeStop}
              minWidth={260} // Slightly smaller for small desktops
              minHeight={340}
              maxWidth={Math.min(700, window.innerWidth * 0.5)} // Dynamic max based on screen
              maxHeight={Math.min(900, window.innerHeight * 0.9)}
              bounds="window"
              dragHandleClassName="webphone-drag-handle"
              enableResizing={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
              }}
              className="backdrop-blur-md z-0 md:z-[50] !fixed bg-card/80 rounded-2xl border border-border shadow-xl transition-all overflow-hidden"
            >
              {renderPhoneContent()}
            </Rnd>
          )}
        </>
      )) ||
        ''}
      <audio ref={audioRef} autoPlay hidden />
    </>
  );
}
