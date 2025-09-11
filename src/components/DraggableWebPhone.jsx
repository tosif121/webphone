import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    isMobile,
  } = useContext(JssipContext);

  const [audioSrc, setAudioSrc] = useState('');
  const [phoneShow, setPhoneShow] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [seeLogs, setSeeLogs] = useState(false);

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

  function handleCalls() {
    createConferenceCall();
    setCallConference(false);
  }

  useEffect(() => {
    if (status === 'start') {
      stopRecording();
    }
  }, [status]);

  useEffect(() => {
    if (dispositionModal) {
      const endCallAudio = new Audio('/sounds/end-call.mp3');
      endCallAudio.play().catch((error) => {
        console.error('Error playing end-call sound:', error);
      });
    }
  }, [dispositionModal]);

  const renderPhoneContent = () => (
    <div className={effectiveIsMobile ? 'w-full h-full' : 'webphone-drag-handle w-full h-full'}>
      {effectiveIsMobile && isIncomingRinging && (
        <IncomingCall
          {...{ incomingNumber, incomingSession, isIncomingRinging, answerIncomingCall, rejectIncomingCall, session }}
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
      {console.log(conferenceStatus, 'conferenceStatus', callConference, 'callConference')}

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

  return (
    <>
      <div className="fixed bottom-2 right-4 sm:right-6 z-[51]">
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

      {(!dispositionModal && phoneShow && (
        <>
          {effectiveIsMobile ? (
            <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="relative w-full max-w-sm h-[430px] bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                {renderPhoneContent()}
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-md bottom-16 end-8 fixed w-[250px] h-[430px] z-0 md:z-[50] bg-card/80 rounded-xl border border-border shadow-xl transition-all overflow-hidden">
              {renderPhoneContent()}
            </div>
          )}
        </>
      )) ||
        ''}

      <audio ref={audioRef} autoPlay hidden />
    </>
  );
}
