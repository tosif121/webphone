import { useState, useEffect, useContext } from 'react';
import { Rnd } from 'react-rnd';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';

import HistoryScreen from './HistoryScreen';
import Home from './Home';
import CallScreen from './CallScreen';
import useJssip from '@/hooks/useJssip';
import CallConference from './CallConference';
import { JssipContext } from '@/context/JssipContext';

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
  } = useContext(JssipContext);

  const [webphoneState, setWebphoneState] = useState(getInitialWebphoneState);

  // Always start with false to match server-side rendering
  const [phoneShow, setPhoneShow] = useState(false);

  // Track if component has hydrated
  const [isHydrated, setIsHydrated] = useState(false);

  const [seeLogs, setSeeLogs] = useState(false);
  const [callConference, setCallConference] = useState(false);

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
    if (webphoneState) {
      localStorage.setItem('webphone-position', JSON.stringify(webphoneState));
    }
  }, [webphoneState]);

  const handleDragStop = (e, d) => {
    setWebphoneState((prev) => ({
      ...prev,
      x: d.x,
      y: d.y,
    }));
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    setWebphoneState({
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
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

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-20 right-8 z-50">
        <button
          className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:scale-105"
          onClick={() => setPhoneShow((prev) => !prev)}
          aria-label={phoneShow ? 'Hide phone' : 'Show phone'}
        >
          {!phoneShow ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
        </button>
      </div>

      {/* Only show RND card if phoneShow is true */}
      {!dispositionModal && phoneShow && (
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
          style={{ zIndex: 50 }}
          className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-white/30 dark:border-slate-700/30 shadow-xl shadow-blue-500/10 transition-all overflow-hidden"
        >
          <div className="webphone-drag-handle w-full h-full">
            {seeLogs ? (
              <HistoryScreen setSeeLogs={setSeeLogs} />
            ) : status === 'start' ? (
              <Home
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                handleCall={handleCall}
                setSeeLogs={setSeeLogs}
                timeoutArray={timeoutArray}
                isConnectionLost={isConnectionLost}
              />
            ) : status === 'calling' || status === 'conference' ? (
              callConference ? (
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
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-6">
                  <PhoneCall className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-200">No Active Calls</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-2">Ready to make or receive calls</p>
              </div>
            )}
          </div>
        </Rnd>
      )}
      <audio ref={audioRef} autoPlay hidden />
    </>
  );
}
