import { useState, useEffect, useContext } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  MoveHorizontal,
  Lock,
  Unlock,
  History,
  LayoutGrid,
  BarChart3,
  Grid3x3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Rnd } from 'react-rnd';
import { useRouter } from 'next/router';
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

  const router = useRouter();
  const [audioSrc, setAudioSrc] = useState('');
  const [phoneShow, setPhoneShow] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [seeLogs, setSeeLogs] = useState(false);
  const [phonePosition, setPhonePosition] = useState('right');
  const [isDraggable, setIsDraggable] = useState(false);
  const [activeTab, setActiveTab] = useState('dialpad');

  const [rndState, setRndState] = useState({
    x: 0,
    y: 0,
    width: 250,
    height: 430,
  });

  const [confSeconds, setConfSeconds] = useState(0);
  const [confMinutes, setConfMinutes] = useState(0);
  const [confRunning, setConfRunning] = useState(false);

  const [localIsMobile, setLocalIsMobile] = useState(false);
  const effectiveIsMobile = isMobile ?? localIsMobile;

  // Detect mobile screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    setLocalIsMobile(mediaQuery.matches);

    const handleResize = () => setLocalIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Handle body scroll on mobile
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

  // Initialize default position after hydration
  useEffect(() => {
    if (typeof window !== 'undefined' && rndState.x === 0 && rndState.y === 0 && isHydrated) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const x = phonePosition === 'right' ? windowWidth - 250 - 32 : 32;

      setRndState({
        x,
        y: windowHeight - 430 - 64,
        width: 250,
        height: 430,
      });
    }
  }, [isHydrated, phonePosition]);

  // Load settings from localStorage and always show phone on desktop
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedPosition = localStorage.getItem('phonePosition');
      const savedDraggable = localStorage.getItem('phoneDraggable');
      const savedRndState = localStorage.getItem('phoneRndState');
      const savedShow = localStorage.getItem('phoneShow');

      // Load phoneShow state from localStorage, default to true on desktop
      if (!effectiveIsMobile) {
        if (savedShow !== null) {
          setPhoneShow(JSON.parse(savedShow));
        } else {
          setPhoneShow(true);
        }
      }

      if (savedPosition && (savedPosition === 'left' || savedPosition === 'right')) {
        setPhonePosition(savedPosition);
      }
      if (savedDraggable) {
        setIsDraggable(JSON.parse(savedDraggable));
      }
      if (savedRndState) {
        const parsed = JSON.parse(savedRndState);
        setRndState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load phone settings from localStorage:', error);
    }
  }, [effectiveIsMobile]);

  // Save settings to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('phonePosition', phonePosition);
        localStorage.setItem('phoneDraggable', JSON.stringify(isDraggable));
        localStorage.setItem('phoneRndState', JSON.stringify(rndState));
        localStorage.setItem('phoneShow', JSON.stringify(phoneShow));
      } catch (error) {
        console.warn('Failed to save phone settings to localStorage:', error);
      }
    }
  }, [phonePosition, isDraggable, rndState, phoneShow, isHydrated]);

  // Auto-show on incoming call
  useEffect(() => {
    if (isIncomingRinging) {
      setPhoneShow(true);
    }
  }, [isIncomingRinging]);

  // Auto-show when calling
  useEffect(() => {
    if (status === 'calling') {
      setPhoneShow(true);
    }
  }, [status]);

  // Listen for custom events from mobile navigation
  useEffect(() => {
    const handleOpenDialpad = () => {
      setPhoneShow(true);
      setActiveTab('dialpad');
      setSeeLogs(false);
    };

    const handleOpenDialpadRecents = () => {
      setPhoneShow(true);
      setActiveTab('recents');
      setSeeLogs(true);
    };

    const handleCloseDialpad = () => {
      // Only close if not in an active call
      if (status === 'start' || !session) {
        console.log('Closing dialpad');
        setPhoneShow(false);
      } else {
        console.log('Cannot close dialpad - call in progress');
      }
    };

    window.addEventListener('openDialpad', handleOpenDialpad);
    window.addEventListener('openDialpadRecents', handleOpenDialpadRecents);
    window.addEventListener('closeDialpad', handleCloseDialpad);

    return () => {
      window.removeEventListener('openDialpad', handleOpenDialpad);
      window.removeEventListener('openDialpadRecents', handleOpenDialpadRecents);
      window.removeEventListener('closeDialpad', handleCloseDialpad);
    };
  }, [status, session]);

  // Notify when dialpad opens/closes
  useEffect(() => {
    if (phoneShow) {
      window.dispatchEvent(new CustomEvent('dialpadOpened'));
    } else {
      window.dispatchEvent(new CustomEvent('dialpadClosed'));
    }
  }, [phoneShow]);

  // Conference call handler
  function handleCalls() {
    createConferenceCall();
    setCallConference(false);
  }

  // Reset on call start
  useEffect(() => {
    if (status === 'start') {
      stopRecording();
      setMuted(false);
    }
  }, [status, stopRecording, setMuted]);

  // Toggle left/right position
  const togglePosition = () => {
    const newPosition = phonePosition === 'right' ? 'left' : 'right';
    setPhonePosition(newPosition);

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

  // Toggle drag mode
  const toggleDraggable = () => {
    const newDraggable = !isDraggable;
    setIsDraggable(newDraggable);

    if (!newDraggable && typeof window !== 'undefined') {
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


  // Render phone content
  const renderPhoneContent = () => (
    <div
      className={
        effectiveIsMobile ? 'w-full h-full flex flex-col justify-center' : 'webphone-drag-handle w-full h-full'
      }
    >
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

      {/* Main Content Area */}
      <div className={effectiveIsMobile ? 'flex-1 overflow-hidden' : 'w-full h-full'}>
        {!(effectiveIsMobile && isIncomingRinging) && (activeTab === 'recents' || seeLogs) && (
          <HistoryScreen setSeeLogs={setSeeLogs} />
        )}

        {!(effectiveIsMobile && isIncomingRinging) && !seeLogs && activeTab === 'dialpad' && status === 'start' && (
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
          activeTab === 'dialpad' &&
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
    </div>
  );

  const positionClasses = phonePosition === 'right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6';

  return (
    <>
      {/* Control Buttons - Desktop Only */}
      {!effectiveIsMobile && (
        <div className={`fixed bottom-2 ${positionClasses} z-[51] flex flex-col gap-2`}>
          {/* Show/Hide Toggle */}
          <Button
            type="button"
            size="sm"
            className="rounded-full w-12 h-12 hover:scale-105 transition-transform"
            onClick={() => setPhoneShow((prev) => !prev)}
            aria-label={phoneShow ? 'Hide phone interface' : 'Show phone interface'}
          >
            {!phoneShow ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          </Button>

          {phoneShow && (
            <>
              {/* Lock/Unlock Toggle */}
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

              {/* Left/Right Position Toggle */}
              {!isDraggable && (
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
            </>
          )}
        </div>
      )}

      {/* Phone Interface */}
      {!dispositionModal && phoneShow && (
        <>
          {effectiveIsMobile ? (
            // Mobile: Full screen with padding for header and bottom nav from MobileNavigation
            <div className="fixed left-0 right-0 top-14 bottom-16 z-[35] bg-card overflow-hidden">
              {renderPhoneContent()}
            </div>
          ) : isDraggable ? (
            // Desktop: Draggable mode
            <Rnd
              position={{ x: rndState.x, y: rndState.y }}
              size={{ width: rndState.width, height: rndState.height }}
              minWidth={250}
              minHeight={430}
              maxWidth={400}
              maxHeight={600}
              bounds="window"
              dragHandleClassName="webphone-drag-handle"
              cancel="button, input, textarea, select, a"
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
              <div className="w-full h-full bg-card rounded-xl border-2 border-border shadow-xl overflow-hidden">
                {renderPhoneContent()}
              </div>
            </Rnd>
          ) : (
            // Desktop: Fixed position mode
            <div
              className={`bottom-16 ${
                phonePosition === 'right' ? 'end-8' : 'start-8'
              } fixed w-[250px] h-[460px] z-[50] bg-card rounded-xl border border-border shadow-xl transition-all duration-300 overflow-hidden`}
            >
              {renderPhoneContent()}
            </div>
          )}
        </>
      )}
    </>
  );
}
