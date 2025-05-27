import React, { createContext } from 'react';
import useJssip from '@/hooks/useJssip';

export const JssipContext = createContext();

export function JssipProvider({ children }) {
  // Destructure the array returned by useJssip
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
  ] = useJssip();

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
      }}
    >
      {children}
    </JssipContext.Provider>
  );
}
