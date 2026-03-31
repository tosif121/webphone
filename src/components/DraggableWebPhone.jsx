import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Keyboard, Mic, MicOff, Pause, Phone, PhoneCall, PhoneOff, Play, ChevronDown } from 'lucide-react';
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
import { getStoredAgentUiPreferences } from '@/utils/agent-preferences';

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
    agentLifecycle,
    activeCallContext,
    workspaceActiveCall,
    isMobile,
    isCustomerAnswered,
    setHasParticipants,
    isMerged,
    setIsMerged,
    isAutomationLoading,
  } = useContext(JssipContext);

  const router = useRouter();
  const [audioSrc, setAudioSrc] = useState('');
  const [phoneShow, setPhoneShow] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [seeLogs, setSeeLogs] = useState(false);
  const [dialerDockMode, setDialerDockMode] = useState('right');
  const [dialerLayoutMode, setDialerLayoutMode] = useState('overlay');
  const [activeTab, setActiveTab] = useState('dialpad');
  const [isExpandedDuringCall, setIsExpandedDuringCall] = useState(false);
  const [miniBarX, setMiniBarX] = useState(null);
  const [workspaceBounds, setWorkspaceBounds] = useState(null);
  const phoneShowBeforeCallRef = useRef(true);
  const previousIsCallLiveRef = useRef(false);
  const previousHasWorkspaceActiveCallRef = useRef(false);
  const previousStatusRef = useRef(status);
  const compactBarDurationRef = useRef('00:00');
  const previousPostCallPhaseRef = useRef(false);
  const [compactBarDisconnectedAt, setCompactBarDisconnectedAt] = useState('');
  const [rndState, setRndState] = useState({ x: 0, y: 0, width: 280, height: 500 });

  useEffect(() => {
    console.log('[WebPhone] Current Active Tab:', activeTab);
  }, [activeTab]);

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

  // Load settings from localStorage and handle hydration
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedPreferences = getStoredAgentUiPreferences();
      console.log('[DraggableWebPhone] Initial preferences loaded:', savedPreferences);
      const savedRndState = localStorage.getItem('phoneRndState');
      const savedShow = localStorage.getItem('phoneShow');

      const PHONE_W = 280;
      const PHONE_H = 500;
      const MARGIN = 24;
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      const clampToScreen = (x, y) => {
        const maxX = Math.max(windowWidth - PHONE_W - MARGIN, MARGIN);
        const maxY = Math.max(windowHeight - PHONE_H - MARGIN, MARGIN);
        return {
          x: Math.round(Math.min(Math.max(x, MARGIN), maxX)),
          y: Math.round(Math.min(Math.max(y, MARGIN), maxY)),
        };
      };

      if (effectiveIsMobile) {
        setPhoneShow(true);
      } else if (savedShow) {
        setPhoneShow(JSON.parse(savedShow));
      }

      if (savedPreferences) {
        setDialerDockMode(savedPreferences.dialerDockMode || 'right');
        setDialerLayoutMode(savedPreferences.dialerLayoutMode || 'overlay');
      }

      if (savedRndState) {
        try {
          const parsed = JSON.parse(savedRndState);
          const clamped = clampToScreen(
            typeof parsed.x === 'number' ? parsed.x : windowWidth - PHONE_W - MARGIN,
            typeof parsed.y === 'number' ? parsed.y : windowHeight - PHONE_H - MARGIN,
          );
          setRndState({ ...parsed, ...clamped, width: PHONE_W, height: PHONE_H });
        } catch (e) {
          // Fallback to bottom-right
          const { x, y } = clampToScreen(windowWidth - PHONE_W - MARGIN, windowHeight - PHONE_H - MARGIN);
          setRndState({ x, y, width: PHONE_W, height: PHONE_H });
        }
      } else {
        // First run: bottom-right with margin
        const { x, y } = clampToScreen(windowWidth - PHONE_W - MARGIN, windowHeight - PHONE_H - MARGIN);
        setRndState({ x, y, width: PHONE_W, height: PHONE_H });
      }
    } catch (error) {
      console.warn('Failed to load phone settings from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      const nextPreferences = event?.detail || getStoredAgentUiPreferences();
      console.log('[DraggableWebPhone] Profile updated event received:', nextPreferences);
      setDialerDockMode(nextPreferences.dialerDockMode || 'right');
      setDialerLayoutMode(nextPreferences.dialerLayoutMode || 'overlay');
    };

    window.addEventListener('agent-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('agent-profile-updated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    const handleWorkspaceBoundsChange = (event) => {
      const nextBounds = event?.detail;
      if (!nextBounds || !nextBounds.height) {
        setWorkspaceBounds(null);
        return;
      }

      setWorkspaceBounds(nextBounds);
    };

    window.addEventListener('webphone-workspace-bounds', handleWorkspaceBoundsChange);
    return () => window.removeEventListener('webphone-workspace-bounds', handleWorkspaceBoundsChange);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('phoneRndState', JSON.stringify(rndState));
        localStorage.setItem('phoneShow', JSON.stringify(phoneShow));
      } catch (error) {
        console.warn('Failed to save phone settings to localStorage:', error);
      }
    }
  }, [rndState, phoneShow, isHydrated]);

  // Auto-show on incoming call, but preserve the user's pre-call dialer choice.
  useEffect(() => {
    if (isIncomingRinging) {
      if (!previousIsCallLiveRef.current) {
        phoneShowBeforeCallRef.current = phoneShow;
      }
      setPhoneShow(true);
    }
  }, [isIncomingRinging, phoneShow]);

  const isCallLive =
    ['dialing', 'ringing', 'on_call'].includes(agentLifecycle) ||
    ['calling', 'ringing', 'conference', 'incoming'].includes(status);
  const isWorkspaceCallMode = status !== 'start' || dispositionModal;
  const isPostCallPhase = dispositionModal && !isCallLive;
  const hasPostCallContext = Boolean(dispositionModal || workspaceActiveCall || userCall || activeCallContext);
  const hasCallUiContext = isWorkspaceCallMode || hasPostCallContext || isCallLive;
  const shouldShowCompactCallControls = isWorkspaceCallMode && !isIncomingRinging && !isExpandedDuringCall;
  const liveDurationLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  useEffect(() => {
    if (isCallLive) {
      compactBarDurationRef.current = liveDurationLabel;
    }
  }, [isCallLive, liveDurationLabel]);

  useEffect(() => {
    if (isPostCallPhase && !previousPostCallPhaseRef.current) {
      setCompactBarDisconnectedAt(
        new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date()),
      );
    } else if (!hasPostCallContext && previousPostCallPhaseRef.current) {
      setCompactBarDisconnectedAt('');
    }

    previousPostCallPhaseRef.current = isPostCallPhase;
  }, [hasPostCallContext, isPostCallPhase]);

  useEffect(() => {
    if (isCallLive) {
      if (!previousIsCallLiveRef.current) {
        phoneShowBeforeCallRef.current = phoneShow;
      }
      if (effectiveIsMobile) {
        setIsExpandedDuringCall(true);
      }
    } else if (previousIsCallLiveRef.current && !effectiveIsMobile) {
      setPhoneShow(Boolean(phoneShowBeforeCallRef.current));
      setIsExpandedDuringCall(false);
    }
    previousIsCallLiveRef.current = isCallLive;
  }, [effectiveIsMobile, isCallLive, phoneShow]);

  useEffect(() => {
    if (previousHasWorkspaceActiveCallRef.current && !isWorkspaceCallMode) {
      setActiveTab('dialpad');
      setSeeLogs(false);
      if (!effectiveIsMobile) {
        setPhoneShow(Boolean(phoneShowBeforeCallRef.current));
      }
    }

    previousHasWorkspaceActiveCallRef.current = isWorkspaceCallMode;
  }, [effectiveIsMobile, isWorkspaceCallMode]);

  // Listen for custom events from mobile navigation
  useEffect(() => {
    const handleOpenDialpad = () => {
      setPhoneShow(true);
      setActiveTab('dialpad');
    };

    const handleOpenDialpadRecents = () => {
      setPhoneShow(true);
      setActiveTab('recents');
    };

    const handleCloseDialpad = () => {
      // Only close if not in an active call and not on mobile
      if (!isWorkspaceCallMode && !effectiveIsMobile) {
        console.log('Closing dialpad');
        setPhoneShow(false);
      } else {
        console.log('Cannot close dialpad - call in progress or mobile mode');
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
  }, [isWorkspaceCallMode]);

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

  // Reset transient call UI only when the call session actually returns to idle.
  useEffect(() => {
    if (previousStatusRef.current !== status && status === 'start') {
      stopRecording();
      setMuted(false);
      setIsExpandedDuringCall(false);
    }
    previousStatusRef.current = status;
  }, [status, stopRecording, setMuted]);

  const handleCollapseDuringCall = () => {
    if (isWorkspaceCallMode) {
      setIsExpandedDuringCall(false);
    } else {
      setPhoneShow(false);
    }
  };

  const collapseButton = !effectiveIsMobile ? (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="h-8 w-8 rounded-full bg-background/95 hover:bg-accent shadow-sm transition-all active:scale-95 shrink-0"
      onClick={handleCollapseDuringCall}
      aria-label="Hide dialer"
    >
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </Button>
  ) : null;

  // Render phone content
  const renderPhoneContent = () => (
    <div className={effectiveIsMobile ? 'w-full flex flex-col' : 'w-full h-full flex flex-col'}>
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
      <div className={effectiveIsMobile ? 'w-full' : 'w-full h-full overflow-hidden'}>
        {!(effectiveIsMobile && isIncomingRinging) && activeTab === 'recents' && (
          <HistoryScreen setSeeLogs={setSeeLogs} />
        )}

        {!(effectiveIsMobile && isIncomingRinging) && activeTab === 'dialpad' && !isCallLive && (
          <Home
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            handleCall={handleCall}
            setSeeLogs={setSeeLogs}
            timeoutArray={timeoutArray}
            isConnectionLost={isConnectionLost}
            headerAction={collapseButton}
          />
        )}

        {!(effectiveIsMobile && isIncomingRinging) &&
          !seeLogs &&
          isCallLive &&
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
              headerAction={collapseButton}
            />
          ))}

        {!(effectiveIsMobile && isIncomingRinging) &&
          !seeLogs &&
          activeTab === 'dialpad' &&
          !isCallLive &&
          status !== 'start' && (
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

  const dockSideClass =
    dialerDockMode === 'left'
      ? 'left-4 sm:left-6'
      : dialerDockMode === 'floating'
        ? 'right-0 -translate-x-1/2'
        : 'right-4 sm:right-6';
  const desktopDockClass = dialerDockMode === 'left' ? 'left-6' : 'right-6';
  const miniBarWidth = 305;
  const fallbackDockedTop = typeof window !== 'undefined' && window.innerWidth >= 1280 ? 257 : 241;
  const fallbackBottomOffset = 132;
  const workspaceBottomOffset =
    typeof window !== 'undefined'
      ? Math.max(window.innerHeight - (workspaceBounds?.bottom ?? window.innerHeight - fallbackBottomOffset), 0)
      : fallbackBottomOffset;
  const miniBarBottomOffset = Math.max(workspaceBottomOffset, 12);
  const miniBarY = typeof window !== 'undefined' ? Math.max(window.innerHeight - (60 + miniBarBottomOffset), 24) : 24;
  const activeCallLabel =
    workspaceActiveCall?.contactNumber ||
    userCall?.contactNumber ||
    activeCallContext?.contactNumber ||
    incomingNumber ||
    phoneNumber ||
    'Active Call';
  const compactBarStatusLabel = isPostCallPhase ? `Call ended · ${compactBarDurationRef.current}` : liveDurationLabel;
  const compactBarButtonsDisabled = isPostCallPhase || isAutomationLoading;
  const isDialingPhase = callType === 'outgoing' && agentLifecycle === 'dialing' && !isPostCallPhase;
  const getDefaultMiniBarX = useCallback(() => {
    if (typeof window === 'undefined') {
      return 24;
    }

    return dialerDockMode === 'left' ? 24 : Math.max(window.innerWidth - miniBarWidth - 24, 24);
  }, [dialerDockMode]);
  const compactBarDisplayLabel = isPostCallPhase
    ? `Call ended - ${compactBarDisconnectedAt || compactBarDurationRef.current}`
    : compactBarStatusLabel;
  const shouldReserveSpace =
    dialerLayoutMode === 'docked' &&
    phoneShow &&
    !effectiveIsMobile &&
    !isWorkspaceCallMode &&
    !isIncomingRinging &&
    dialerDockMode !== 'floating';
  const fullDockedDialerStyle = {
    maxHeight: workspaceBounds?.height
      ? `${Math.round(workspaceBounds.height)}px`
      : `calc(100vh - ${fallbackDockedTop + fallbackBottomOffset}px)`,
  };
  const hiddenBubbleStyle = {
    bottom: `${Math.max(Math.min(workspaceBottomOffset, 28), 18)}px`,
  };

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('webphone-layout-change', {
        detail: {
          shouldReserveSpace,
          dialerDockMode,
          dialerLayoutMode,
        },
      }),
    );
  }, [dialerDockMode, dialerLayoutMode, shouldReserveSpace]);

  useEffect(() => {
    if (effectiveIsMobile || typeof window === 'undefined') {
      return;
    }

    const applyMiniBarPosition = () => {
      const defaultX = getDefaultMiniBarX();
      setMiniBarX((prev) => {
        if (prev === null) {
          return defaultX;
        }
        return Math.min(Math.max(prev, 24), Math.max(window.innerWidth - miniBarWidth - 24, 24));
      });
    };

    applyMiniBarPosition();
    window.addEventListener('resize', applyMiniBarPosition);
    return () => window.removeEventListener('resize', applyMiniBarPosition);
  }, [effectiveIsMobile, getDefaultMiniBarX]);

  const handleMuteToggle = () => {
    const nextMuted = !muted;
    if (nextMuted) {
      session?.mute();
    } else {
      session?.unmute();
    }
    setMuted(nextMuted);
  };

  const handleEndCurrentCall = () => {
    try {
      session?.terminate();
      stopRecording?.();
    } catch (error) {
      console.warn('Failed to terminate current session cleanly:', error);
    }
  };

  const handleExpandDuringCall = () => {
    setPhoneShow(true);
    setIsExpandedDuringCall(true);
    setActiveTab('dialpad');
    setSeeLogs(false);
  };

  const handleMiniBarPointerDown = useCallback(
    (event) => {
      if (effectiveIsMobile || typeof window === 'undefined') {
        return;
      }

      if (event.target instanceof HTMLElement && event.target.closest('button')) {
        return;
      }

      const startClientX = event.clientX;
      const startX = miniBarX ?? getDefaultMiniBarX();
      const minX = 24;
      const maxX = Math.max(window.innerWidth - miniBarWidth - 24, minX);

      const handlePointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startClientX;
        setMiniBarX(Math.min(Math.max(startX + deltaX, minX), maxX));
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [effectiveIsMobile, getDefaultMiniBarX, miniBarX],
  );

  if (!isHydrated) return null;

  return (
    <>
      {!effectiveIsMobile && !isWorkspaceCallMode && !phoneShow && (
        <div className={`fixed ${dockSideClass} z-[1000] flex flex-col gap-2`} style={hiddenBubbleStyle}>
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
      )}

      {shouldShowCompactCallControls &&
        (effectiveIsMobile ? (
          <div
            className="fixed z-[1000]"
            style={{
              width: `calc(100% - 24px)`,
              left: `12px`,
              bottom: `80px`,
            }}
            onPointerDown={handleMiniBarPointerDown}
          >
            <div
              className={`flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur ${compactBarButtonsDisabled ? 'opacity-70' : ''}`}
            >
              <div className="min-w-0 pr-2">
                <div className="truncate text-sm font-semibold text-foreground">{activeCallLabel}</div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {isDialingPhase ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>Dialing</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                      </span>
                    </span>
                  ) : (
                    compactBarDisplayLabel
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant={muted ? 'default' : 'outline'}
                className="h-9 w-9 rounded-full"
                onClick={handleMuteToggle}
                aria-label={muted ? 'Unmute call' : 'Mute call'}
                disabled={compactBarButtonsDisabled}
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant={isHeld ? 'default' : 'outline'}
                className="h-9 w-9 rounded-full"
                onClick={toggleHold}
                aria-label={isHeld ? 'Resume call' : 'Hold call'}
                disabled={compactBarButtonsDisabled}
              >
                {isHeld ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                onClick={handleExpandDuringCall}
                aria-label="Open dialpad"
                disabled={compactBarButtonsDisabled}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 rounded-full bg-destructive text-white hover:bg-destructive/90"
                onClick={handleEndCurrentCall}
                aria-label="End call"
                disabled={compactBarButtonsDisabled}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="fixed z-[1000]"
            style={{
              width: `${miniBarWidth}px`,
              height: '60px',
              left: `${miniBarX ?? getDefaultMiniBarX()}px`,
              bottom: `${miniBarBottomOffset}px`,
            }}
            onPointerDown={handleMiniBarPointerDown}
          >
            <div
              className={`flex h-[60px] cursor-grab items-center gap-2 rounded-full border border-border bg-card/95 px-4 shadow-xl backdrop-blur active:cursor-grabbing ${compactBarButtonsDisabled ? 'opacity-70' : ''}`}
            >
              <div className="min-w-0 pr-2">
                <div className="truncate text-sm font-semibold text-foreground">{activeCallLabel}</div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {isDialingPhase ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>Dialing</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                      </span>
                    </span>
                  ) : (
                    compactBarDisplayLabel
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant={muted ? 'default' : 'outline'}
                className="h-9 w-9 rounded-full"
                onClick={handleMuteToggle}
                aria-label={muted ? 'Unmute call' : 'Mute call'}
                disabled={compactBarButtonsDisabled}
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant={isHeld ? 'default' : 'outline'}
                className="h-9 w-9 rounded-full"
                onClick={toggleHold}
                aria-label={isHeld ? 'Resume call' : 'Hold call'}
                disabled={compactBarButtonsDisabled}
              >
                {isHeld ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                onClick={handleExpandDuringCall}
                aria-label="Open dialpad"
                disabled={compactBarButtonsDisabled}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 rounded-full bg-destructive text-white hover:bg-destructive/90"
                onClick={handleEndCurrentCall}
                aria-label="End call"
                disabled={compactBarButtonsDisabled}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

      {phoneShow && (isExpandedDuringCall || !isWorkspaceCallMode || isIncomingRinging) && (
        <>
          {effectiveIsMobile ? (
            <div
              className={`fixed left-0 right-0 z-[49] overflow-hidden bg-card ${
                isIncomingRinging || isCallLive ? 'top-14 bottom-16' : 'bottom-16 top-auto h-[72vh] rounded-t-[28px]'
              }`}
            >
              {renderPhoneContent()}
            </div>
          ) : dialerDockMode === 'floating' ? (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 49,
                pointerEvents: 'none',
              }}
            >
              <Rnd
                position={{ x: rndState.x, y: rndState.y }}
                size={{ width: rndState.width, height: rndState.height }}
                minWidth={280}
                minHeight={480}
                maxWidth={480}
                maxHeight={700}
                bounds="parent"
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
                  setRndState((prev) => ({ ...prev, x: d.x, y: d.y }));
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setRndState({
                    x: position.x,
                    y: position.y,
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                  });
                }}
                style={{ pointerEvents: 'all' }}
              >
                <div className="w-full h-full bg-card rounded-xl border-2 border-border shadow-xl overflow-hidden flex flex-col">
                  {/* Dedicated Drag Handle */}
                  <div className="webphone-drag-handle shrink-0 w-full h-6 bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-border/50">
                    <div className="w-10 h-1.5 rounded-full bg-border" />
                  </div>
                  <div className="flex-1 overflow-hidden">{renderPhoneContent()}</div>
                </div>
              </Rnd>
            </div>
          ) : (
            <div
              className={`fixed ${desktopDockClass} bottom-10 z-[49] w-[280px] overflow-hidden rounded-[28px] border border-border bg-card shadow-xl transition-all duration-300`}
              style={fullDockedDialerStyle}
            >
              {renderPhoneContent()}
            </div>
          )}
        </>
      )}
    </>
  );
}
