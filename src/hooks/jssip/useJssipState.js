// hooks/jssip/useJssipState.js
import { useState, useRef } from 'react';
import { useStopwatch } from 'react-timer-hook';

export const useJssipState = () => {
  /* ----------------------------- core call state ---------------------------- */
  const [phoneNumber, setPhoneNumber] = useState('');
  const [conferenceNumber, setConferenceNumber] = useState('');
  const [ua, setUa] = useState(null);
  const [session, setSession] = useState(null);
  const [bridgeID, setBridgeID] = useState('');
  const [status, setStatus] = useState('start');
  const [callType, setCallType] = useState('');
  const [isHeld, setIsHeld] = useState(false);
  const [conferenceStatus, setConferenceStatus] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isCustomerAnswered, setIsCustomerAnswered] = useState(false);

  /* ----------------------------- device control ---------------------------- */
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  /* ----------------------------- recording meta ---------------------------- */
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const chunks = useRef([]);

  /* ----------------------------- user / lead data -------------------------- */
  const [userCall, setUserCall] = useState('');
  const [followUpDispoes, setFollowUpDispoes] = useState([]);

  /* ------------------------------- ui states ------------------------------- */
  const [ringtone, setRingtone] = useState('');
  const [inNotification, setInNotification] = useState('');
  const [dispositionModal, setDispositionModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  /* ------------------------------ connection -------------------------------- */
  const [connectionStatus, setConnectionStatus] = useState('NOT_INUSE');
  const [isConnectionLost, setIsConnectionLost] = useState(false);
  const [timeoutArray, setTimeoutArray] = useState([]);
  const [origin, setOrigin] = useState('esamwad.iotcom.io');
  const [timeoutMessage, setTimeoutMessage] = useState('');
  const [isMerged, setIsMerged] = useState(false);

  /* ---------------------------- call tracking ------------------------------ */
  const [isCallended, setIsCallended] = useState(false);
  const [callHandled, setCallHandled] = useState(false);

  /* ---------------------------- incoming call ------------------------------ */
  const [incomingSession, setIncomingSession] = useState(null);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [isIncomingRinging, setIsIncomingRinging] = useState(false);

  /* ---------------------------- conference data ---------------------------- */
  const [conferenceCalls, setConferenceCalls] = useState([]);
  const [callConference, setCallConference] = useState(false);
  const [hasParticipants, setHasParticipants] = useState(null);

  /* ------------------------------ misc flags ------------------------------- */
  const [userLogin, setUserLogin] = useState(false);
  const [queueDetails, setQueueDetails] = useState([]);
  const [hasTransfer, setHasTransfer] = useState(false);
  const [currentCallData, setCurrentCallData] = useState(null);

  /* ------------------------------- refs ------------------------------------ */
  const offlineToastIdRef = useRef(null);
  const agentSocketRef = useRef(null);
  const customerSocketRef = useRef(null);
  const agentMediaRecorderRef = useRef(null);
  const customerMediaRecorderRef = useRef(null);
  const dialingNumberRef = useRef('');
  const ringtoneRef = useRef(null);
  const audioRef = useRef();
  const callHandledRef = useRef(false);

  /* ----------------------------- stop-watch -------------------------------- */
  const { seconds, minutes, isRunning, pause, reset } = useStopwatch({ autoStart: false });

  /* ------------------------------ network log ------------------------------ */
  const [messageDifference, setMessageDifference] = useState([]);
  const [avergaeMessageTimePerMinute, setAvergaeMessageTimePerMinute] = useState([]);

  // System monitoring states (these were added later in your original)
  const [systemEvents, setSystemEvents] = useState([]);
  const [networkHealth, setNetworkHealth] = useState('unknown');
  const [lastError, setLastError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastLoggedUAState, setLastLoggedUAState] = useState(null);

  /* --------------------------- export everything --------------------------- */
  return {
    /* core */
    phoneNumber,
    setPhoneNumber,
    conferenceNumber,
    setConferenceNumber,
    ua,
    setUa,
    session,
    setSession,
    bridgeID,
    setBridgeID,
    status,
    setStatus,
    callType,
    setCallType,
    isHeld,
    setIsHeld,
    conferenceStatus,
    setConferenceStatus,
    origin,
    setOrigin,

    /* devices & recording */
    devices,
    setDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    mediaRecorder,
    setMediaRecorder,
    isRecording,
    setIsRecording,
    chunks,

    /* data */
    userCall,
    setUserCall,
    followUpDispoes,
    setFollowUpDispoes,

    /* ui */
    ringtone,
    setRingtone,
    inNotification,
    setInNotification,
    dispositionModal,
    setDispositionModal,
    showTimeoutModal,
    setShowTimeoutModal,

    /* connection */
    connectionStatus,
    setConnectionStatus,
    isConnectionLost,
    setIsConnectionLost,
    timeoutArray,
    setTimeoutArray,

    /* call tracking */
    isCallended,
    setIsCallended,
    callHandled,
    setCallHandled,

    /* incoming */
    incomingSession,
    setIncomingSession,
    incomingNumber,
    setIncomingNumber,
    isIncomingRinging,
    setIsIncomingRinging,

    /* conference */
    conferenceCalls,
    setConferenceCalls,
    callConference,
    setCallConference,
    hasParticipants,
    setHasParticipants,

    /* misc */
    userLogin,
    setUserLogin,
    queueDetails,
    setQueueDetails,
    hasTransfer,
    setHasTransfer,
    currentCallData,
    setCurrentCallData,

    /* refs */
    offlineToastIdRef,
    agentSocketRef,
    customerSocketRef,
    agentMediaRecorderRef,
    customerMediaRecorderRef,
    dialingNumberRef,
    ringtoneRef,
    audioRef,
    callHandledRef,

    /* stopwatch */
    seconds,
    minutes,
    isRunning,
    pause,
    reset,

    /* monitoring */
    messageDifference,
    setMessageDifference,
    avergaeMessageTimePerMinute,
    setAvergaeMessageTimePerMinute,
    systemEvents,
    setSystemEvents,
    networkHealth,
    setNetworkHealth,
    lastError,
    setLastError,
    successCount,
    setSuccessCount,
    errorCount,
    setErrorCount,
    lastLoggedUAState,
    setLastLoggedUAState,
    muted,
    setMuted,
    timeoutMessage,
    setTimeoutMessage,
    isCustomerAnswered,
    setIsCustomerAnswered,
    isMerged,
    setIsMerged,
  };
};
