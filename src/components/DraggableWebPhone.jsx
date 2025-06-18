import { useState, useEffect, useContext } from 'react';
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
  if (typeof window === 'undefined')
    return {
      x: 200,
      y: 180,
      width: 330,
      height: 550,
    };
  try {
    const saved = localStorage.getItem('webphone-position');
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    x: window.innerWidth / 2 - 192,
    y: 180,
    width: 330,
    height: 550,
  };
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
    isMobile,
  } = useContext(JssipContext);

  const [webphoneState, setWebphoneState] = useState(getInitialWebphoneState);
  const [audioSrc, setAudioSrc] = useState('');

  // Always start with false to match server-side rendering
  const [phoneShow, setPhoneShow] = useState(false);

  // Track if component has hydrated
  const [isHydrated, setIsHydrated] = useState(false);

  const [seeLogs, setSeeLogs] = useState(false);
  const [callConference, setCallConference] = useState(false);

  useEffect(() => {
    if (isMobile && phoneShow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, phoneShow]);

  // Handle hydration and localStorage sync
  useEffect(() => {
    setIsHydrated(true);

    // Load phoneShow state from localStorage after hydration
    try {
      const saved = localStorage.getItem('phoneShow');
      if (saved) {
        setPhoneShow(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load phoneShow from localStorage:', error);
    }
  }, []);

  // Save phoneShow to localStorage when it changes (but only after hydration)
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
    if (webphoneState && !isMobile) {
      localStorage.setItem('webphone-position', JSON.stringify(webphoneState));
    }
  }, [webphoneState, isMobile]);

  const handleDragStop = (e, d) => {
    if (!isMobile) {
      setWebphoneState((prev) => ({
        ...prev,
        x: d.x,
        y: d.y,
      }));
    }
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    if (!isMobile) {
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

  // Render the phone content
  const renderPhoneContent = () => (
    <div className={isMobile ? 'w-full h-full' : 'webphone-drag-handle w-full h-full'}>
      {/* Incoming Call - Only show on mobile when ringing */}
      {isMobile && isIncomingRinging && (
        <IncomingCall
          {...{ incomingNumber, incomingSession, isIncomingRinging, answerIncomingCall, rejectIncomingCall }}
        />
      )}

      {/* History Screen - Don't show during incoming calls on mobile */}
      {!(isMobile && isIncomingRinging) && seeLogs && <HistoryScreen setSeeLogs={setSeeLogs} />}

      {/* Home Screen - Don't show during incoming calls on mobile */}
      {!(isMobile && isIncomingRinging) && !seeLogs && status === 'start' && (
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
      {!(isMobile && isIncomingRinging) &&
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
      {!(isMobile && isIncomingRinging) &&
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

  // Add this useEffect to your DraggableWebPhone component
  useEffect(() => {
    const enableAudio = () => {
      if (ringtoneRef.current) {
        // Try to play and immediately pause to enable audio
        ringtoneRef.current
          .play()
          .then(() => {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
          })
          .catch(() => {
            // Audio not ready yet
          });
      }
    };

    // Enable audio on first user interaction
    const handleUserInteraction = () => {
      enableAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    setAudioSrc(`${window.location.origin}/sounds/ringtone.mp3`);
  }, []);

  return (
    <>
      <audio ref={ringtoneRef} loop preload="auto" style={{ display: 'none' }}>
        <source src={audioSrc} type="audio/mpeg" />
      </audio>

      {/* Floating Toggle Button */}
      <div className="fixed bottom-2 sm:bottom-20 right-8 z-[51]">
        <Button
          type="button"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={() => setPhoneShow((prev) => !prev)}
          aria-label={phoneShow ? 'Hide phone' : 'Show phone'}
        >
          {!phoneShow ? <PhoneOff className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
        </Button>
      </div>

      {/* Phone Interface */}
      {!dispositionModal && phoneShow && (
        <>
          {isMobile ? (
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
              minWidth={280}
              minHeight={340}
              maxWidth={700}
              maxHeight={900}
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
              className="backdrop-blur-md z-0 md:z-[50] bg-card/80 rounded-2xl border border-border shadow-xl transition-all overflow-hidden"
            >
              {renderPhoneContent()}
            </Rnd>
          )}
        </>
      )}
      <audio ref={audioRef} autoPlay hidden />
    </>
  );
}
