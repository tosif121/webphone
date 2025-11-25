import { useState, useEffect, useContext } from 'react';
import { Phone, PhoneCall, PhoneOff, MoveHorizontal, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Rnd } from 'react-rnd';
import HistoryScreen from './HistoryScreen';
import Home from './Home';
import CallScreen from './CallScreen';
import useJssip from '@/hooks/useJssip';
import CallConference from './CallConference';
import { JssipContext } from '@/context/JssipContext';
import IncomingCall from './IncomingCall';

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
    callType,
    setCallType,
    connectionStatus,
    showTimeoutModal,
    setShowTimeoutModal,
    handleLoginSuccess,
    closeTimeoutModal,
    userLogin,
    hasParticipants,
    muted,
    setMuted,
    isMobile,
    isCustomerAnswered,
    setHasParticipants,
    isMerged,
    setIsMerged,
  } = useContext(JssipContext);

  const [audioSrc, setAudioSrc] = useState('');
  const [phoneShow, setPhoneShow] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [seeLogs, setSeeLogs] = useState(false);
  const [phonePosition, setPhonePosition] = useState('right');
  const [isDraggable, setIsDraggable] = useState(false);

  // RND state with size - UPDATED DEFAULT HERE
  const [rndState, setRndState] = useState({
    x: 1430,
    y: -497,
    width: 250,
    height: 430,
  });

  // Conference timer for unmerged calls
  const [confSeconds, setConfSeconds] = useState(0);
  const [confMinutes, setConfMinutes] = useState(0);
  const [confRunning, setConfRunning] = useState(false);

  const [localIsMobile, setLocalIsMobile] = useState(false);
  const effectiveIsMobile = isMobile ?? localIsMobile;

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

  // Load settings from localStorage
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedShow = localStorage.getItem('phoneShow');
      const savedPosition = localStorage.getItem('phonePosition');
      const savedDraggable = localStorage.getItem('phoneDraggable');
      const savedRndState = localStorage.getItem('phoneRndState');

      if (savedShow) {
        setPhoneShow(JSON.parse(savedShow));
      }
      if (savedPosition && (savedPosition === 'left' || savedPosition === 'right')) {
        setPhonePosition(savedPosition);
      }
      if (savedDraggable) {
        setIsDraggable(JSON.parse(savedDraggable));
      }
      if (savedRndState) {
        setRndState(JSON.parse(savedRndState));
      }
    } catch (error) {
      console.warn('Failed to load phone settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('phoneShow', JSON.stringify(phoneShow));
        localStorage.setItem('phonePosition', phonePosition);
        localStorage.setItem('phoneDraggable', JSON.stringify(isDraggable));
        localStorage.setItem('phoneRndState', JSON.stringify(rndState));
      } catch (error) {
        console.warn('Failed to save phone settings to localStorage:', error);
      }
    }
  }, [phoneShow, phonePosition, isDraggable, rndState, isHydrated]);

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

  function handleCalls() {
    createConferenceCall();
    setCallConference(false);
  }

  useEffect(() => {
    if (status === 'start') {
      stopRecording();
      setMuted(false);
    }
  }, [status]);

  // Toggle position between left and right
  const togglePosition = () => {
    const newPosition = phonePosition === 'right' ? 'left' : 'right';
    setPhonePosition(newPosition);

    // Update position when switching sides
    if (!isDraggable && typeof window !== 'undefined') {
      const windowWidth = window.innerWidth;
      const x = newPosition === 'right' ? windowWidth - 250 - 32 : 32;

      setRndState((prev) => ({
        ...prev,
        x,
        y: window.innerHeight - 430 - 64,
      }));
    }
  };

  // Toggle draggable mode
  const toggleDraggable = () => {
    const newDraggable = !isDraggable;
    setIsDraggable(newDraggable);

    if (!newDraggable && typeof window !== 'undefined') {
      // Reset to default position based on phonePosition when locking
      const windowWidth = window.innerWidth;
      const x = phonePosition === 'right' ? windowWidth - 250 - 32 : 32;

      setRndState({
        x,
        y: window.innerHeight - 430 - 64,
        width: 250,
        height: 430,
      });
    }
  };

  const renderPhoneContent = () => (
    <div className="w-full h-full">
      {effectiveIsMobile && isIncomingRinging && (
        <IncomingCall
          incomingNumber={incomingNumber}
          incomingSession={incomingSession}
          isIncomingRinging={isIncomingRinging}
          answerIncomingCall={answerIncomingCall}
          rejectIncomingCall={rejectIncomingCall}
          session={session}
        />
      )}

      {!(effectiveIsMobile && isIncomingRinging) && seeLogs && <HistoryScreen setSeeLogs={setSeeLogs} />}

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

      {!(effectiveIsMobile && isIncomingRinging) &&
        !seeLogs &&
        (status === 'calling' || status === 'ringing' || status === 'conference') &&
        (callConference ? (
          <CallConference
            conferenceNumber={conferenceNumber}
            setCallConference={setCallConference}
            setConferenceNumber={setConferenceNumber}
            handleCalls={handleCalls}
            setSeeLogs={setSeeLogs}
            phoneNumber={userCall?.contactNumber || phoneNumber}
            seconds={seconds}
            minutes={minutes}
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
            conferenceCalls={conferenceCalls}
            hasParticipants={hasParticipants}
            muted={muted}
            setMuted={setMuted}
            isCustomerAnswered={isCustomerAnswered}
            setConferenceNumber={setConferenceNumber}
            setHasParticipants={setHasParticipants}
            confRunning={confRunning}
            confMinutes={confMinutes}
            confSeconds={confSeconds}
            isMerged={isMerged}
            setIsMerged={setIsMerged}
            setConfRunning={setConfRunning}
            setConfSeconds={setConfSeconds}
            setConfMinutes={setConfMinutes}
          />
        ))}

      {!(effectiveIsMobile && isIncomingRinging) &&
        !seeLogs &&
        !['start', 'calling', 'ringing', 'conference'].includes(status) && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4">
              <PhoneCall className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-200">No Active Calls</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ready to make or receive calls</p>
          </div>
        )}
    </div>
  );

  // Dynamic position classes for buttons
  const positionClasses = phonePosition === 'right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6';

  // Calculate default position based on phonePosition
  const getDefaultPosition = () => {
    if (typeof window === 'undefined') {
      return { x: 0, y: 0, width: 250, height: 430 };
    }

    if (isDraggable && rndState.x !== 0) {
      return rndState;
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const x = phonePosition === 'right' ? windowWidth - 250 - 32 : 32;

    return {
      x,
      y: windowHeight - 430 - 64,
      width: 250,
      height: 430,
    };
  };

  return (
    <>
      {/* Floating buttons container */}
      <div className={`fixed bottom-18 sm:bottom-2 ${positionClasses} z-[51] flex flex-col gap-2`}>
        {/* Drag toggle button - only show on desktop when phone is visible */}
        {!effectiveIsMobile && phoneShow && (
          <Button
            type="button"
            size="sm"
            variant={isDraggable ? 'default' : 'outline'}
            className="rounded-full w-12 h-12 hover:scale-105 transition-transform"
            onClick={toggleDraggable}
            aria-label={isDraggable ? 'Lock position' : 'Enable dragging'}
            title={isDraggable ? 'Lock position' : 'Enable dragging'}
          >
            {isDraggable ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </Button>
        )}

        {/* Position toggle button - only show when NOT draggable */}
        {!effectiveIsMobile && phoneShow && !isDraggable && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full w-12 h-12 hover:scale-105 transition-transform"
            onClick={togglePosition}
            aria-label={`Move phone to ${phonePosition === 'right' ? 'left' : 'right'}`}
            title={`Move to ${phonePosition === 'right' ? 'left' : 'right'}`}
          >
            <MoveHorizontal className="h-5 w-5" />
          </Button>
        )}

        {/* Show/Hide phone button */}
        <Button
          type="button"
          size="sm"
          className="rounded-full w-12 h-12 hover:scale-105 transition-transform"
          onClick={() => setPhoneShow((prev) => !prev)}
          aria-label={phoneShow ? 'Hide phone interface' : 'Show phone interface'}
        >
          {!phoneShow ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        </Button>
      </div>

      {!dispositionModal && phoneShow && (
        <>
          {effectiveIsMobile ? (
            <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="relative w-[250px] h-[430px] bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                {renderPhoneContent()}
              </div>
            </div>
          ) : isDraggable ? (
            <Rnd
              position={{ x: rndState.x, y: rndState.y }}
              size={{ width: rndState.width, height: rndState.height }}
              minWidth={250}
              minHeight={430}
              maxWidth={400}
              maxHeight={600}
              bounds="window"
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
              disableDragging={false}
              onDragStop={(e, d) => {
                setRndState((prev) => ({
                  ...prev,
                  x: d.x,
                  y: d.y,
                }));
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                setRndState({
                  x: position.x,
                  y: position.y,
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                });
              }}
              style={{ zIndex: 50 }}
            >
              <div className="w-full h-full backdrop-blur-md bg-card/80 rounded-xl border-2 border-primary shadow-xl overflow-hidden">
                {renderPhoneContent()}
              </div>
            </Rnd>
          ) : (
            <div
              className={`backdrop-blur-md bottom-16 ${
                phonePosition === 'right' ? 'end-8' : 'start-8'
              } fixed w-[250px] h-[430px] z-0 md:z-[50] bg-card/80 rounded-xl border border-border shadow-xl transition-all duration-300 overflow-hidden`}
            >
              {renderPhoneContent()}
            </div>
          )}
        </>
      )}

      <audio ref={audioRef} autoPlay hidden />
    </>
  );
}
