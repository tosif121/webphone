import React, { createContext, useEffect, useState } from 'react';
import useJssip from '@/hooks/useJssip';

export const JssipContext = createContext();

export function JssipProvider({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Call useJssip only ONCE with the isMobile parameter
  const [
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
  ] = useJssip(isMobile);

  return (
    <JssipContext.Provider
      value={{
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
        isMobile,
      }}
    >
      {children}
    </JssipContext.Provider>
  );
}
