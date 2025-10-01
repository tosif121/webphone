import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import HistoryContext from '../context/HistoryContext';
import { useStopwatch } from 'react-timer-hook';
import JsSIP from 'jssip';
import axios from 'axios';
import toast from 'react-hot-toast';

const useJssip = (isMobile = false) => {
  const { setHistory, username, password, setSelectedBreak, selectedBreak } = useContext(HistoryContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [conferenceNumber, setConferenceNumber] = useState('');
  const [ua, setUa] = useState(null);
  const [session, setSession] = useState(null);
  const [bridgeID, setBridgeID] = useState('');
  const [status, setStatus] = useState('start');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [userCall, setUserCall] = useState('');
  const [ringtone, setRingtone] = useState('');
  const [inNotification, setInNotification] = useState('');
  const [isHeld, setIsHeld] = useState(false);
  const [conferenceStatus, setConferenceStatus] = useState(false);
  const [dispositionModal, setDispositionModal] = useState(false);
  const [isConnectionLost, setIsConnectionLost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('NOT_INUSE');
  const [timeoutArray, setTimeoutArray] = useState([]);
  const [isCallended, setIsCallended] = useState(false);
  const [messageDifference, setMessageDifference] = useState([]);
  const [avergaeMessageTimePerMinute, setAvergaeMessageTimePerMinute] = useState([]);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [callHandled, setCallHandled] = useState(false);
  const [incomingSession, setIncomingSession] = useState(null);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [isIncomingRinging, setIsIncomingRinging] = useState(false);
  const [followUpDispoes, setFollowUpDispoes] = useState([]);
  const [conferenceCalls, setConferenceCalls] = useState([]);
  const [callConference, setCallConference] = useState(false);
  const [userLogin, setUserLogin] = useState(false);
  const [callType, setCallType] = useState('');
  const [hasParticipants, setHasParticipants] = useState(false);
  const offlineToastIdRef = useRef(null);
  const agentSocketRef = useRef(null);
  const customerSocketRef = useRef(null);
  const agentMediaRecorderRef = useRef(null);
  const customerMediaRecorderRef = useRef(null);
  const dialingNumberRef = useRef('');
  const ringtoneRef = useRef(null);
  const audioRef = useRef();
  const callHandledRef = useRef(false);
  const chunks = useRef([]);
  const { seconds, minutes, isRunning, pause, reset } = useStopwatch({
    autoStart: false,
  });

  const [origin, setOrigin] = useState('esamwad.iotcom.io');

  useEffect(() => {
    const originWithoutProtocol = window.location.origin.replace(/^https?:\/\//, '');
    setOrigin(originWithoutProtocol);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasActiveCall =
        connectionStatus === 'Disposition' ||
        incomingSession ||
        status === 'calling' ||
        status === 'conference' ||
        isIncomingRinging;

      if (hasActiveCall) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [connectionStatus, incomingSession, status, isIncomingRinging]);

  function notifyMe() {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      createNotification();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          createNotification();
        }
      });
    }
  }

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.volume = 0.5;

      // Handle autoplay policy
      const playPromise = ringtoneRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Ringtone started playing');
          })
          .catch((error) => {
            console.error('Error playing ringtone:', error);
            // Try to play with user interaction
            if (error.name === 'NotAllowedError') {
              console.log('Autoplay prevented. User interaction required.');
            }
          });
      }
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  function createNotification() {
    const notifiOptions = {
      body: `Incoming call from ${inNotification}`,
      icon: '/badge.png',
      badge: '/badge.png',
      vibrate: [5000, 4000, 5000],
      tag: 'notification-tag',
      renotify: true,
      requireInteraction: true,
    };

    const notification = new Notification('Incoming Call', notifiOptions);

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };
    // notification.onclose = function () {
    //   console.log('Call notification closed');
    // };
    return notification;
  }

  const handleLoginSuccess = () => {
    setShowTimeoutModal(false);
    toast.success('Re-login successful');
    // Refresh page or fetch fresh user data
    // window.location.reload();
  };

  const closeTimeoutModal = () => {
    setShowTimeoutModal(false);
    localStorage.removeItem('token');
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('call-history');
    localStorage.removeItem('phoneShow');
    localStorage.removeItem('formNavigationState');
    localStorage.removeItem('selectedBreak');

    window.location.href = '/webphone/v1/login';
  };

  const createConferenceCall = async () => {
    try {
      const response = await fetch(`${window.location.origin}/reqConf/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confNumber: conferenceNumber.replace(/\s+/g, ''),
        }),
      });

      const data = await response.json();
      if (data.message === 'conferance call dialed') {
        if (data.result) {
          setBridgeID(data.result);
          setConferenceStatus(true);
          setStatus('conference');
        }
      } else if (data.message === 'error dialing conference call') {
        console.error('Conference call dialing failed');
        setStatus('calling');
      } else {
        console.log('Unexpected response:', data.message);
      }
    } catch (error) {
      console.error('Error creating conference call:', error);
      setStatus('calling');
    }
  };

  const withTimeout = (promise, timeoutMs) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))]);

  const addTimeout = (type) => {
    setTimeoutArray((prev) => [...prev, type]);
  };

  const connectioncheck = async () => {
    try {
      setIsConnectionLost(false);

      // Parse token data once at the beginning
      const tokenDataString = localStorage.getItem('token');
      if (!tokenDataString) {
        console.error('No token data found');
        return false;
      }

      const parsedTokenData = JSON.parse(tokenDataString);
      const token = parsedTokenData.token;

      if (!parsedTokenData?.userData?.campaign) {
        console.error('Campaign information missing in token data');
        return false;
      }

      const campaign = parsedTokenData.userData.campaign;

      const response = await withTimeout(
        axios.post(
          `${window.location.origin}/userconnection`,
          { user: username },
          { headers: { 'Content-Type': 'application/json' } }
        ),
        3000
      );

      // Handle authentication failures
      if (response.status === 401 || !response.data.isUserLogin) {
        if (status === 'start' && !dispositionModal) {
          await handleLogout(token, 'Session expired. Please log in again.');
          setUserLogin(true);
          return true;
        }
        return false;
      }

      const data = response.data;
      setFollowUpDispoes(data.followUpDispoes);
      setConnectionStatus(data.status);
      // Handle connection issues
      if (data.message !== 'ok connection for user') {
        if (status === 'start' && !dispositionModal) {
          await handleConnectionLost();
          return true;
        }
        return false;
      }

      setConferenceCalls(data.conferenceCalls || []);

      // Handle call queue
      if (data.currentCallqueue?.length > 0) {
        if (campaign === data.currentCallqueue[0].campaign) {
          setTimeoutArray([]);
          setRingtone(data.currentCallqueue);
          setInNotification(data.currentCallqueue.map((call) => call.Caller));
        } else {
          console.log('Campaign mismatch:', campaign, data.currentCallqueue[0].campaign);
        }
      } else {
        setRingtone([]);
      }

      setIsConnectionLost(false);
      return false;
    } catch (err) {
      return await handleConnectionError(err);
    }
  };

  useEffect(() => {
    let timeout;

    if (conferenceCalls && conferenceStatus && (status === 'conference' || status === 'ringing')) {
      timeout = setTimeout(() => {
        if (conferenceCalls.length === 0) {
          setStatus('calling');
          setCallConference(false);
          setConferenceNumber('');
          setConferenceStatus(false);
          reqUnHold?.();
        }
      }, 12000);
    }

    return () => clearTimeout(timeout);
  }, [conferenceCalls, status, callConference, conferenceStatus]);

  const handleLogout = async (token, message) => {
    try {
      if (token) {
        await axios.delete(`${window.location.origin}/deleteFirebaseToken`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // REPLACED window.alert with existing timeout modal state
      setShowTimeoutModal(true);

      if (session && session.status < 6) {
        session.terminate();
      }
      stopRecording();

      // Don't redirect here - let the modal handle it
    } catch (error) {
      console.error('Error during logout:', error);

      // REPLACED window.alert with existing timeout modal state
      setShowTimeoutModal(true);
    }

    if (message) {
      toast.error(message);
    }
    setIsConnectionLost(true);
  };

  // Helper function for connection lost scenarios
  const handleConnectionLost = async () => {
    // REPLACED window.alert with existing timeout modal state
    setShowTimeoutModal(true);

    if (session && session.status < 6) {
      session.terminate();
    }

    stopRecording();
    toast.error('Connection lost. Please log in again.');
    setIsConnectionLost(true);
  };

  // Helper function for error handling
  const handleConnectionError = async (err) => {
    console.error('Error during connection check:', err);

    if (err.message === 'Timeout') {
      console.error('Connection timed out');
      if (status === 'start' && !dispositionModal) {
        toast.error('Server appears to be unresponsive. Retrying...');
      }
      addTimeout('timeout');
    } else if (err.message.includes('Network')) {
      console.error('Network error:', err.message);
      if (status === 'start' && !dispositionModal) {
        toast.error('Network error. Please check your connection.');
      }
      addTimeout('network');
    } else if (err.response?.status === 401 && status === 'start' && !dispositionModal) {
      // Handle auth errors
      window.location.href = '/webphone/v1';
      toast.error('Session expired. Please log in again.');

      if (session && session.status < 6) {
        session.terminate();
      }
      stopRecording();
    } else {
      // Generic error handling
      if (status === 'start' && !dispositionModal) {
        toast.error('Connection check failed. Please try again.');
      }
    }

    setIsConnectionLost(true);
    return true;
  };

  const checkUserReady = async () => {
    try {
      const url = `${window.location.origin}/userready/${username}`;
      const response = await axios.post(url, {}, { headers: { 'Content-Type': 'application/json' } });
      return response.data;
    } catch (error) {
      console.error('Error sending login request:', error);
      return null;
    }
  };

  useEffect(() => {
    const handleOffline = () => {
      if (offlineToastIdRef.current) {
        toast.dismiss(offlineToastIdRef.current);
      }

      offlineToastIdRef.current = toast.error('Network connection lost. Please check your internet.', {
        duration: 5000,
        onClose: () => {
          offlineToastIdRef.current = null;
        },
      });

      // window.location.href = '/webphone/v1';
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);

      if (offlineToastIdRef.current) {
        toast.dismiss(offlineToastIdRef.current);
      }
    };
  }, []);

  const initializeWebSocketTranscription = () => {
    const createWebSocket = (isAgent = true) => {
      const socketRef = isAgent ? agentSocketRef : customerSocketRef;
      const socket = new WebSocket(`wss://${origin}/socket`);

      socketRef.current = socket;

      socket.onopen = () => {
        // console.log(`${isAgent ? 'Agent' : 'Customer'} WebSocket Connected`);
      };

      socket.onerror = (error) => {
        // console.error(`${isAgent ? 'Agent' : 'Customer'} WebSocket Error:`, error);
      };

      socket.onclose = () => {
        // console.log(`${isAgent ? 'Agent' : 'Customer'} WebSocket Closed`);
        setTimeout(() => {
          createWebSocket(isAgent);
        }, 3000);
      };

      return socket;
    };

    createWebSocket(true);
    createWebSocket(false);
  };

  const startSpeechToText = (stream, isAgent = true) => {
    const websocket = isAgent ? agentSocketRef.current : customerSocketRef.current;
    const mediaRecorderRef = isAgent ? agentMediaRecorderRef : customerMediaRecorderRef;

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      if (websocket?.readyState === WebSocket.CLOSING || websocket?.readyState === WebSocket.CLOSED) {
        initializeWebSocketTranscription();
      }

      return;
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && websocket.readyState === WebSocket.OPEN) {
        websocket.send(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const tracks = stream.getAudioTracks();
      tracks.forEach((track) => track.stop());

      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify('streamClose'));
      }
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
  };

  const stopSpeechToText = (isAgent = true) => {
    const mediaRecorderRef = isAgent ? agentMediaRecorderRef : customerMediaRecorderRef;
    const websocket = isAgent ? agentSocketRef.current : customerSocketRef.current;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify('streamClose'));
    }
  };

  useEffect(() => {
    if (status != 'start') {
      initializeWebSocketTranscription();
    }

    return () => {
      if (agentSocketRef.current) {
        agentSocketRef.current.close();
      }
      if (customerSocketRef.current) {
        customerSocketRef.current.close();
      }
    };
  }, []);

  const reqUnHold = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${window.location.origin}/reqUnHold/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bridgeID: session.bridgeID,
        }),
      });

      if (response.ok) {
        if (audioRef.current) {
          audioRef.current.play();
        }
        setIsHeld(false);

        setConferenceStatus(false);
      } else {
        console.error('Failed to unhold call');
      }
    } catch (error) {
      console.error('Error unholding call:', error);
    }
  };

  const toggleHold = async () => {
    if (!session) return;

    try {
      if (!isHeld) {
        await fetch(`${window.location.origin}/reqHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: session.bridgeID,
          }),
        });

        if (audioRef.current) {
          audioRef.current.pause();
        }

        setIsHeld(true);
      } else {
        await fetch(`${window.location.origin}/reqUnHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: session.bridgeID,
          }),
        });

        if (audioRef.current) {
          audioRef.current.play();
        }

        setIsHeld(false);
      }
    } catch (error) {
      console.error('Error toggling hold:', error);
    }
  };

  const startRecording = async () => {
    if (!session || isRecording) return;

    try {
      const combinedStream = new MediaStream();

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      });

      const remoteReceivers = session.connection.getReceivers() || [];
      const remoteTracks = remoteReceivers
        .filter((receiver) => receiver.track?.kind === 'audio')
        .map((receiver) => receiver.track)
        .filter(Boolean);

      startSpeechToText(micStream, true);
      if (remoteTracks.length > 0) {
        const remoteStream = new MediaStream(remoteTracks);
        startSpeechToText(remoteStream, false);
      }

      remoteTracks.forEach((track) => {
        combinedStream.addTrack(track);
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();

      const localSource = audioContext.createMediaStreamSource(micStream);
      localSource.connect(destination);

      if (remoteTracks.length > 0) {
        const remoteStream = new MediaStream(remoteTracks);
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        remoteSource.connect(destination);
      }

      const recorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    stopSpeechToText(true);
    stopSpeechToText(false);
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = [];

        convertToWav(blob).then((wavBlob) => {
          const audioUrl = URL.createObjectURL(wavBlob);
          const audioLink = document.createElement('a');
          audioLink.href = audioUrl;
          audioLink.download = `call-recording-${new Date().toISOString()}.wav`;
          audioLink.click();
          URL.revokeObjectURL(audioUrl);
        });
      };
    }
  };

  const eventHandlers = {
    failed: function (e) {
      setStatus('fail');
      // setPhoneNumber('');
      if (isRecording) {
        stopRecording();
      }
      setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], status: 'Fail', start: 0, end: 0 }]);
    },

    confirmed: function (e) {
      reset();
      startRecording();
      setHistory((prev) => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          status: 'Success',
          start: new Date().getTime(),
        },
      ]);
    },

    ended: function (e) {
      if (isRecording) {
        stopRecording();
      }
      setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: new Date().getTime() }]);
      pause();
      setStatus('start');
      // setPhoneNumber('');
    },
  };

  const convertToWav = async (blob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const wavBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      wavBuffer.copyToChannel(channelData, channel);
    }

    const wavData = encodeWAV(wavBuffer);
    return new Blob([wavData], { type: 'audio/wav' });
  };

  const encodeWAV = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = audioBuffer.getChannelData(0);
    const samples = buffer.length;
    const dataSize = samples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(arrayBuffer);

    writeString(dataView, 0, 'RIFF');
    dataView.setUint32(4, totalSize - 8, true);
    writeString(dataView, 8, 'WAVE');
    writeString(dataView, 12, 'fmt ');
    dataView.setUint32(16, 16, true);
    dataView.setUint16(20, format, true);
    dataView.setUint16(22, numChannels, true);
    dataView.setUint32(24, sampleRate, true);
    dataView.setUint32(28, sampleRate * blockAlign, true);
    dataView.setUint16(32, blockAlign, true);
    dataView.setUint16(34, bitDepth, true);
    writeString(dataView, 36, 'data');
    dataView.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const value = Math.max(-1, Math.min(1, sample));
        dataView.setInt16(offset, value * 0x7fff, true);
        offset += bytesPerSample;
      }
    }

    return arrayBuffer;
  };

  const writeString = (dataView, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      dataView.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  var options = {
    eventHandlers: eventHandlers,
    mediaConstraints: {
      audio: {
        mandatory: {
          echoCancellation: true,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
        },
      },
    },
  };

  const changeAudioDevice = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (session) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        session.connection.getSenders()[0].replaceTrack(stream.getAudioTracks()[0]);
      } catch (error) {
        console.error('Error changing audio device:', error);
      }
    }
  };

  const answercall = async (incomingNumber = null) => {
    try {
      const response = await axios.post(
        `${window.location.origin}/useroncall/${username}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setBridgeID(response.data.currentcalldata.bridgeID);
        if (response.data.contactData) {
          setUserCall(response.data.contactData);
        }
        setConferenceStatus(false);

        if (incomingNumber) {
          setHistory((prev) => [
            ...prev,
            {
              phoneNumber: incomingNumber,
              type: 'incoming',
              status: 'Success',
              start: new Date().getTime(),
              startTime: new Date(),
            },
          ]);
        }
      } else {
        console.error('Failed to process call');
      }
    } catch (error) {
      console.error('Error processing call:', error);
    }
  };

  const answerIncomingCall = async () => {
    if (incomingSession) {
      try {
        stopRingtone(); // Stop ringtone when call is answered
        setCallHandled(true);
        callHandledRef.current = true;
        incomingSession.answer(options);
        setSession(incomingSession);
        setIncomingSession(null);
        setIsIncomingRinging(false);
        setStatus('calling');
        setCallType('incoming');
        reset();

        // Set up audio stream
        incomingSession.connection.addEventListener('addstream', (event) => {
          if (audioRef.current) {
            audioRef.current.srcObject = event.stream;
          }
        });

        // Update history
        setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], status: 'Success' }]);

        const callerNumber = incomingNumber;

        await answercall(callerNumber);
      } catch (error) {
        console.error('Error answering call:', error);
        toast.error('Failed to answer call');
      }
    }
  };

  const rejectIncomingCall = () => {
    stopRingtone();

    if (incomingSession && incomingSession.status < 6) {
      incomingSession.terminate();
    }
    checkUserReady();
    setIncomingSession(null);
    setIsIncomingRinging(false);
    setStatus('start');
    setCallType('');
    // Update history as rejected
    setHistory((prev) => [
      ...prev.slice(0, -1),
      { ...prev[prev.length - 1], status: 'Rejected', end: new Date().getTime() },
    ]);

    setDispositionModal(false);
  };

  useEffect(() => {
    if (inNotification != '') {
      notifyMe();
      setInNotification('');
    }
  }, [inNotification]);

  useEffect(() => {
    if (!username || !password) {
      return;
    }
    const initializeJsSIP = () => {
      try {
        var socket = new JsSIP.WebSocketInterface(`wss://${origin}:8089/ws`);

        // Add direct socket error handling
        socket.onclose = function (event) {
          if (!event.wasClean) {
            console.error('WebSocket connection died unexpectedly');
            toast.error('Connection lost');
            // localStorage.clear();
            window.location.href = '/webphone/v1';
          }
        };

        socket.onerror = function (error) {
          console.error('WebSocket error:', error);
          toast.error('Connection failed');
          // localStorage.clear();
          window.location.href = '/webphone/v1';
        };

        var configuration = {
          sockets: [socket],
          session_timers: false,
          uri: `${username.replace('@', '-')}@${origin}:8089`,
          password: password,
        };

        var ua = new JsSIP.UA(configuration);
        ua.start();

        ua.on('registered', async (data) => {
          console.log('Successfully registered:', data);

          checkUserReady();
          const storedBreak = localStorage.getItem('selectedBreak');
          if (storedBreak && storedBreak !== 'Break') {
            console.log(`[Re-apply Break] Found stored break in localStorage: ${storedBreak}`);
            try {
              // Add a small delay to allow backend to fully register the SIP session
              // before attempting to set the break. This might solve race conditions.
              await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay

              // console.log(
              //   `[Re-apply Break] Attempting to re-apply break to backend: ${storedBreak} for user: ${username}`
              // );
              const response = await axios.post(`${window.location.origin}/user/breakuser:${username}`, {
                breakType: storedBreak,
              });
              if (response.status === 200) {
                setSelectedBreak(storedBreak);
                // toast.success(`Break (${storedBreak}) re-applied successfully.`);
                // console.log(`[Re-apply Break] Backend confirmed break re-applied.`);
              } else {
                console.error(
                  `[Re-apply Break] Backend responded with status ${response.status} for break re-application.`,
                  response.data
                );
                // toast.error(`Failed to re-apply previous break (${storedBreak}).`);
                localStorage.removeItem('selectedBreak');
                setSelectedBreak('Break');
              }
            } catch (error) {
              console.error('Error re-applying break from localStorage after registration:', error);
              toast.error(`Failed to re-apply previous break (${storedBreak}).`);
              localStorage.removeItem('selectedBreak');
              setSelectedBreak('Break');
            }
          } else {
            // console.log('[Re-apply Break] No valid break found in localStorage to re-apply.');
          }
        });

        ua.on('newMessage', (e) => {
          const message = e.request.body;
          console.log('message event:', message);
          const objectToPush = {
            messageTime: Date.now(),
          };

          setMessageDifference((prev) => {
            const updatedDifferences = [...prev, objectToPush]; // Add new difference

            if (updatedDifferences.length > 10) {
              updatedDifferences.shift(); // Remove the first (oldest) element
            }

            return updatedDifferences;
          });
          connectioncheck();
        });

        ua.on('registrationFailed', (data) => {
          console.error('Registration failed:', data);
          toast.error('Registration failed');
          // localStorage.clear();
          // window.location.href = '/webphone/v1';
        });

        ua.on('stopped', (e) => {
          console.error('stopped', e);
          // Add logout behavior for stopped event
          toast.error('Connection stopped');
          // localStorage.clear();
          // window.location.href = '/webphone/v1';
        });

        ua.on('disconnected', (e) => {
          console.error('UA disconnected', e);
          toast.error('Connection lost');
          // localStorage.clear();
          // window.location.href = '/webphone/v1';
        });
        ua.on('newRTCSession', function (e) {
          console.log('🔍 Session Direction:', e.session.direction);
          console.log('🔍 Is Mobile:', isMobile);
          if (e.session.direction === 'incoming') {
            const remoteNumber = e.session.remote_identity.uri.user;
            const isActuallyOutgoing = dialingNumberRef.current && remoteNumber === dialingNumberRef.current;

            if (isActuallyOutgoing) {
              dialingNumberRef.current = '';
              handleIncomingCall(e.session, e.request); // Your existing auto-answer logic
            } else {
              if (isMobile) {
                // Mobile: Show UI with ringtone
                const incomingNumber = e.request.from._uri._user;
                setIncomingSession(e.session);
                setIncomingNumber(incomingNumber);
                setIsIncomingRinging(true);
                setStatus('incoming');
                playRingtone(); // Play ringtone on mobile
                // Add history and event listeners for mobile...
                setHistory((prev) => [
                  ...prev,
                  {
                    phoneNumber: incomingNumber,
                    type: 'incoming',
                    status: 'Ringing',
                    start: new Date().getTime(),
                    startTime: new Date(),
                  },
                ]);

                e.session.on('ended', () => {
                  stopRingtone();
                  checkUserReady();
                  setIncomingSession(null);
                  setIsIncomingRinging(false);
                  setStatus('start');
                  setHistory((prev) => [
                    ...prev.slice(0, -1),
                    { ...prev[prev.length - 1], status: 'Missed', end: new Date().getTime() },
                  ]);
                  setDispositionModal(callHandledRef.current);
                  setCallHandled(false);
                  callHandledRef.current = false;
                });

                e.session.on('failed', () => {
                  stopRingtone();
                  checkUserReady();
                  setIncomingSession(null);
                  setIsIncomingRinging(false);
                  setStatus('start');
                  setHistory((prev) => [
                    ...prev.slice(0, -1),
                    { ...prev[prev.length - 1], status: 'Failed', end: new Date().getTime() },
                  ]);
                  setDispositionModal(callHandledRef.current);
                  setCallHandled(false);
                  callHandledRef.current = false;
                });
              } else {
                // Desktop: Auto-answer (no UI, no ringtone)
                handleIncomingCall(e.session, e.request); // Reuse existing auto-answer logic
              }
            }
          } else {
            // Handle normal outgoing calls (when direction is actually "outgoing")
            setSession(e.session);
            setStatus('calling');

            // Set up audio stream
            e.session.connection.addEventListener('addstream', (event) => {
              if (audioRef.current) {
                audioRef.current.srcObject = event.stream;
              }
            });

            // Add event listeners for outgoing calls
            e.session.on('confirmed', () => {
              reset();
              startRecording();
              setHistory((prev) => [
                ...prev.slice(0, -1),
                {
                  ...prev[prev.length - 1],
                  status: 'Success',
                  start: new Date().getTime(),
                },
              ]);
            });

            e.session.on('ended', () => {
              if (isRecording) {
                stopRecording();
              }
              setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: new Date().getTime() }]);
              pause();
              setStatus('start');
              setIsCallended(true);
              setConferenceNumber('');
            });

            e.session.on('failed', () => {
              setStatus('fail');
              if (isRecording) {
                stopRecording();
              }
              setHistory((prev) => [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], status: 'Fail', start: 0, end: 0 },
              ]);
            });
          }
        });

        setUa(ua);
      } catch (error) {
        console.error('Error initializing JsSIP:', error);
        // toast.error('You Are Logout');
        // localStorage.clear();
        // window.location.href = '/webphone/v1';
      }
    };

    const handleIncomingCall = (session, request) => {
      const incomingNumber = request.from._uri._user;
      session.answer(options); // Auto-answers (good for outgoing)
      setSession(session);
      setStatus('calling');
      reset();
      answercall(incomingNumber);

      session.connection.addEventListener('addstream', (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.stream;
        }
      });

      // Your existing event listeners...
      session.once('ended', () => {
        setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: new Date().getTime() }]);
        pause();
        setStatus('start');
        setIsCallended(true);
        setConferenceNumber('');
        setDispositionModal(true);
      });

      session.once('failed', () => {
        setHistory((prev) => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], end: new Date().getTime(), status: 'Fail' },
        ]);
        pause();
        setStatus('start');
        setDispositionModal(false);
      });
    };

    const enumerateDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter((device) => device.kind === 'audioinput');
        setDevices(audioDevices);

        if (audioDevices.length > 0) {
          setSelectedDeviceId(audioDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    // Function to check socket connection status periodically
    const checkSocketConnection = () => {
      if (ua && ua.transport && ua.transport.socket) {
        const socketState = ua.transport.socket.readyState;

        // WebSocket.CLOSED = 3, WebSocket.CLOSING = 2
        if (socketState === 3 || socketState === 2) {
          console.error('Socket connection lost');
          toast.error('Connection lost');
          // localStorage.clear();
          // window.location.href = '/webphone/v1';
        }
      }
    };

    initializeJsSIP();
    enumerateDevices();

    // Set up periodic connection check
    const socketCheckInterval = setInterval(checkSocketConnection, 10000); // Check every 10 seconds

    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
      clearInterval(socketCheckInterval);

      if (ua) {
        ua.off('newMessage');
        try {
          ua.stop();
        } catch (error) {
          console.error('Error stopping UA:', error);
        }
      }
    };
  }, [username, password]);

  const removeBreak = async () => {
    try {
      await axios.post(`${window.location.origin}/user/removebreakuser:${username}`);
      setSelectedBreak('Break');
      localStorage.removeItem('selectedBreak');
      toast.success('Break removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing break:', error);
      toast.error('Error removing break');
      return false;
    }
  };

  const validatePhoneNumber = (number) => {
    if (!number) return false;
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 12;
  };

  const handleCall = async (formattedNumber) => {
    // Early returns for invalid states
    if (isConnectionLost) {
      toast.error('Connection lost. Please check your internet connection.');
      return;
    }

    const targetNumber = phoneNumber || formattedNumber;

    // if (!validatePhoneNumber(targetNumber)) {
    //   toast.error('Phone number must be 10-12 digits');
    //   return;
    // }

    try {
      // Handle break removal if needed
      if (selectedBreak !== 'Break') {
        const breakRemoved = await removeBreak();
        if (!breakRemoved) {
          return; // Stop if break removal failed
        }
      }

      // Clean and store the number
      const cleanedNumber = targetNumber.replace(/\D/g, '');
      dialingNumberRef.current = cleanedNumber;
      setPhoneNumber(targetNumber);
      setCallType('outgoing');

      // Add to call history
      const callRecord = {
        startTime: new Date(),
        phoneNumber: targetNumber,
        type: 'outgoing',
      };
      setHistory((prev) => [...prev, callRecord]);

      // Set dialing state
      try {
        localStorage.setItem('dialing', 'true');
      } catch (storageError) {
        console.warn('Failed to set localStorage:', storageError);
        // Continue anyway, localStorage isn't critical for the call
      }

      // Make the API call
      const response = await axios.post(
        `${window.location.origin}/dialnumber`,
        {
          caller: username,
          receiver: targetNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': username,
          },
          timeout: 10000, // 10 second timeout
        }
      );
    } catch (error) {
      console.error('❌ Call initiation failed:', error);

      // Reset state on error
      setStatus('start');
      setPhoneNumber('');
      dialingNumberRef.current = '';
      setCallType('');

      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        toast.error('Call request timed out. Please try again.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid phone number or user not found');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to initiate the call. Please try again.');
      }

      // Only redirect on critical errors, not all errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        window.location.href = '/webphone/v1';
      }
    }
  };
  useEffect(() => {
    const callApi = async () => {
      if (isCallended) {
        try {
          await axios.post(
            `${window.location.origin}/user/callended${username}`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          setIsHeld(false);
          setIsCallended(false);
          setDispositionModal(true);
        } catch (error) {
          console.error('Error calling callendedd API:', error);
        }
      }
    };

    callApi();
  }, [isCallended, username]);

  const [systemEvents, setSystemEvents] = useState([]);
  const [networkHealth, setNetworkHealth] = useState('unknown');
  const [lastError, setLastError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastLoggedUAState, setLastLoggedUAState] = useState(null);

  const storeInLocalStorage = useCallback((key, value) => {
    try {
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
      });

      localStorage.setItem(`jssip_${key}`, serialized);

      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('jssip-sync');
        channel.postMessage({
          key: `jssip_${key}`,
          value,
          timestamp: Date.now(),
          source: 'useJssip',
        });
        channel.close();
      }
    } catch (error) {
      console.error(`Failed to store ${key} in localStorage:`, error);
    }
  }, []);

  const getFromLocalStorage = useCallback((key, defaultValue = null) => {
    try {
      const stored = localStorage.getItem(`jssip_${key}`);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      return parsed.data || defaultValue;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  }, []);

  const calculateAverageResponseTime = useCallback(() => {
    if (messageDifference.length < 2) return 0;
    const intervals = [];
    for (let i = 1; i < messageDifference.length; i++) {
      const interval = messageDifference[i].messageTime - messageDifference[i - 1].messageTime;
      intervals.push(interval);
    }
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }, [messageDifference]);

  const calculateConnectionUptime = useCallback(() => {
    const sessionStart = getFromLocalStorage('session_start') || Date.now();
    return Date.now() - sessionStart;
  }, [getFromLocalStorage]);

  const isUARegistered = useCallback(() => {
    if (!ua) return false;

    try {
      if (typeof ua.isRegistered === 'function') {
        return ua.isRegistered();
      }
    } catch (e) {
      // fallback
    }

    if (ua.registrator && ua.registrator.registered === true) {
      return true;
    }

    const hasRecentKeepAlive =
      messageDifference.length > 0 && Date.now() - messageDifference[messageDifference.length - 1]?.messageTime < 30000;

    return hasRecentKeepAlive;
  }, [ua, messageDifference]);

  const getWebSocketStatus = useCallback(() => {
    if (!ua) {
      return { connected: false, readyState: null, status: 'no_ua' };
    }

    let socket = null;

    if (ua.transport && ua.transport.socket) {
      socket = ua.transport.socket;
    } else if (ua.transport && ua.transport.connection) {
      socket = ua.transport.connection;
    } else if (ua._transport && ua._transport.socket) {
      socket = ua._transport.socket;
    }

    if (!socket) {
      const isRegistered = isUARegistered();
      if (isRegistered) {
        return { connected: true, readyState: 1, status: 'connected_inferred' };
      }
      return { connected: false, readyState: null, status: 'no_socket' };
    }

    let readyState = socket.readyState;

    if (readyState === undefined || readyState === null) {
      const isRegistered = isUARegistered();
      const hasRecentKeepAlive =
        messageDifference.length > 0 &&
        Date.now() - messageDifference[messageDifference.length - 1]?.messageTime < 30000;

      if (isRegistered && hasRecentKeepAlive) {
        readyState = WebSocket.OPEN;
      } else if (isRegistered) {
        readyState = WebSocket.OPEN;
      } else {
        readyState = WebSocket.CLOSED;
      }
    }

    const connected = readyState === WebSocket.OPEN;

    return { connected, readyState, status: connected ? 'connected' : 'disconnected' };
  }, [ua, isUARegistered, messageDifference]);

  const analyzeSystemHealth = useCallback(() => {
    const now = Date.now();
    const recentTimeWindow = 5 * 60 * 1000;

    const isRegistered = isUARegistered();
    const wsStatus = getWebSocketStatus();

    const hasRecentKeepAlive =
      messageDifference.length > 0 && now - messageDifference[messageDifference.length - 1]?.messageTime < 30000;

    const wsHealth = wsStatus.connected || (isRegistered && hasRecentKeepAlive) ? 'healthy' : 'critical';
    const sipHealth = isRegistered ? 'healthy' : 'critical';
    const networkOnline = navigator.onLine;

    const connection = navigator.connection;
    const networkRtt = connection?.rtt || 0;
    const networkDownlink = connection?.downlink || 0;
    const effectiveType = connection?.effectiveType || 'unknown';

    let networkQuality = 'poor';
    let signalStrength = 1;

    if (effectiveType === '4g' || effectiveType === '3g') {
      if (effectiveType === '4g' && networkRtt < 100 && networkDownlink > 3) {
        networkQuality = 'excellent';
        signalStrength = 4;
      } else if (effectiveType === '4g' && networkRtt < 150) {
        networkQuality = 'good';
        signalStrength = 3;
      } else if (effectiveType === '3g' || networkRtt < 300) {
        networkQuality = 'fair';
        signalStrength = 2;
      }
    } else {
      if (networkRtt < 50 && networkDownlink > 10) {
        networkQuality = 'excellent';
        signalStrength = 4;
      } else if (networkRtt < 100 && networkDownlink > 5) {
        networkQuality = 'good';
        signalStrength = 3;
      } else if (networkRtt < 200 && networkDownlink > 2) {
        networkQuality = 'fair';
        signalStrength = 2;
      }
    }

    const recentErrors = systemEvents.filter(
      (event) => event.type === 'error' && now - event.timestamp < recentTimeWindow
    ).length;

    const recentSuccesses = systemEvents.filter(
      (event) => event.type === 'success' && now - event.timestamp < recentTimeWindow
    ).length;

    const lastKeepAlive =
      messageDifference.length > 0 ? messageDifference[messageDifference.length - 1]?.messageTime : null;
    const keepAliveHealth = lastKeepAlive && now - lastKeepAlive < 15000;

    const recentTimeouts = timeoutArray.filter((timeout) => {
      if (!timeout.timestamp) return false;
      const timeoutTime = new Date(timeout.timestamp);
      const windowStart = new Date(now - 30000);
      return timeoutTime > windowStart;
    });

    if (recentTimeouts.length >= 3) signalStrength = Math.max(signalStrength - 2, 1);
    else if (recentTimeouts.length === 2) signalStrength = Math.max(signalStrength - 1, 1);
    else if (recentTimeouts.length === 1) signalStrength = Math.max(signalStrength - 1, 2);

    let overallHealth = 100;

    if (!ua) {
      overallHealth = 25;
    } else if (isRegistered && (wsStatus.connected || hasRecentKeepAlive)) {
      overallHealth = 100;
      if (!keepAliveHealth && messageDifference.length > 0) overallHealth -= 5;
      if (recentErrors > recentSuccesses) overallHealth -= 5;
      if (networkQuality === 'poor') overallHealth -= 10;
      else if (networkQuality === 'fair') overallHealth -= 5;
    } else if (isRegistered && !wsStatus.connected && !hasRecentKeepAlive) {
      overallHealth = 60;
    } else if (!isRegistered && (wsStatus.connected || hasRecentKeepAlive)) {
      overallHealth = 50;
    } else {
      overallHealth = 30;
    }

    if (!networkOnline) overallHealth = Math.min(overallHealth, 25);
    overallHealth = Math.max(0, Math.min(100, overallHealth));

    return {
      overallHealth,
      wsHealth,
      sipHealth,
      networkOnline,
      networkQuality,
      networkType: effectiveType,
      networkRtt,
      networkDownlink,
      keepAliveHealth,
      recentErrors,
      recentSuccesses,
      signalStrength,
      recentTimeouts: recentTimeouts.length,
      lastKeepAlive: lastKeepAlive ? new Date(lastKeepAlive).toISOString() : null,
      isUARegistered: isRegistered,
      wsConnected: wsStatus.connected || (isRegistered && hasRecentKeepAlive),
      wsReadyState: wsStatus.readyState,
      hasRecentKeepAlive,
    };
  }, [ua, isUARegistered, getWebSocketStatus, systemEvents, messageDifference, timeoutArray]);

  const logSystemEvent = useCallback((type, category, message, details = {}) => {
    const event = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type,
      category,
      message,
      details,
    };

    setSystemEvents((prev) => [...prev, event].slice(-500));

    if (type === 'success') setSuccessCount((prev) => prev + 1);
    if (type === 'error') {
      setErrorCount((prev) => prev + 1);
      setLastError(event);
    }
  }, []);

  useEffect(() => {
    if (!ua) return;

    const wsStatus = getWebSocketStatus();
    const registered = isUARegistered();

    const currentState = {
      isRegistered: registered,
      socketReadyState: wsStatus.readyState,
      socketConnected: wsStatus.connected,
      connectionStatus,
      hasSocket: !!ua?.transport?.socket,
      hasKeepAlive: messageDifference.length > 0,
      uaStarted: ua._state === 'started',
    };

    const stateSignature = JSON.stringify(currentState);

    if (lastLoggedUAState !== stateSignature) {
      setLastLoggedUAState(stateSignature);

      const timeoutId = setTimeout(() => {
        const systemHealth = analyzeSystemHealth();

        storeInLocalStorage('ua_status', {
          isConnected: wsStatus.connected,
          isRegistered: registered,
          isStarted: ua._state === 'started',
          transport: {
            connected: ua?.transport?.connected || false,
            connecting: ua?.transport?.connecting || false,
            readyState: wsStatus.readyState,
          },
          registrator: {
            registered: registered,
            expires: ua?.registrator?.expires || null,
          },
          systemHealth,
          signalStrength: systemHealth.signalStrength,
        });

        if (registered && wsStatus.connected) {
          logSystemEvent('success', 'system', 'UA fully operational - registered and connected', {
            socketReadyState: wsStatus.readyState,
            uaState: ua._state,
            keepAliveCount: messageDifference.length,
          });
        } else if (registered && !wsStatus.connected) {
          logSystemEvent('warning', 'system', 'UA registered but WebSocket not connected', {
            socketReadyState: wsStatus.readyState,
            registered: registered,
          });
        } else if (!registered && wsStatus.connected) {
          logSystemEvent('info', 'system', 'UA WebSocket connected but not registered yet', {
            socketReadyState: wsStatus.readyState,
            uaState: ua._state,
            connectionStatus,
          });
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    ua,
    ua?._state,
    connectionStatus,
    messageDifference.length,
    lastLoggedUAState,
    isUARegistered,
    getWebSocketStatus,
    storeInLocalStorage,
    analyzeSystemHealth,
    logSystemEvent,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const connectionHealth = analyzeSystemHealth();

      storeInLocalStorage('connection_status', {
        connectionStatus,
        isConnectionLost,
        userLogin,
        showTimeoutModal,
        origin,
        lastConnectionCheck: Date.now(),
        networkStatus: navigator.onLine,
        socketState: getWebSocketStatus().readyState,
        systemHealth: connectionHealth,
        networkHealth: connectionHealth.networkQuality,
        errorCount,
        successCount,
        lastError,
        signalStrength: connectionHealth.signalStrength,
        uaRegistered: isUARegistered(),
      });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [
    connectionStatus,
    isConnectionLost,
    userLogin,
    showTimeoutModal,
    origin,
    errorCount,
    successCount,
    lastError,
    session,
    isUARegistered,
    getWebSocketStatus,
    storeInLocalStorage,
    analyzeSystemHealth,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const systemHealth = analyzeSystemHealth();

      storeInLocalStorage('monitoring_data', {
        timeoutArray,
        messageDifference,
        systemEvents: systemEvents.slice(-100),
        performanceMetrics: {
          lastKeepAlive:
            messageDifference.length > 0 ? messageDifference[messageDifference.length - 1]?.messageTime : null,
          timeoutCount: timeoutArray.length,
          averageResponseTime: calculateAverageResponseTime(),
          connectionUptime: calculateConnectionUptime(),
          systemHealth: systemHealth.overallHealth,
          errorRate: systemEvents.length > 0 ? (errorCount / systemEvents.length) * 100 : 0,
          successRate: systemEvents.length > 0 ? (successCount / systemEvents.length) * 100 : 0,
        },
        networkInfo: {
          effectiveType: navigator.connection?.effectiveType || 'unknown',
          downlink: navigator.connection?.downlink || null,
          rtt: navigator.connection?.rtt || null,
          online: navigator.onLine,
          quality: systemHealth.networkQuality,
          signalStrength: systemHealth.signalStrength,
        },
        systemAnalysis: systemHealth,
      });
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [
    timeoutArray.length,
    messageDifference.length,
    systemEvents.length,
    errorCount,
    successCount,
    storeInLocalStorage,
    analyzeSystemHealth,
    calculateAverageResponseTime,
    calculateConnectionUptime,
  ]);

  useEffect(() => {
    const handleOnline = () => {
      logSystemEvent('success', 'network', 'Internet connection restored', {
        downlink: navigator.connection?.downlink || 'unknown',
        rtt: navigator.connection?.rtt || 'unknown',
      });
    };

    const handleOffline = () => {
      logSystemEvent('error', 'network', 'Internet connection lost', {
        lastOnline: new Date().toISOString(),
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [logSystemEvent]);

  useEffect(() => {
    if (!ua) return;

    const handleRegisteredEvent = () => {
      logSystemEvent('success', 'sip', 'SIP registration successful via ua.on event', {
        timestamp: new Date().toISOString(),
      });
    };

    const handleRegistrationFailedEvent = () => {
      logSystemEvent('error', 'sip', 'SIP registration failed via ua.on event', {
        timestamp: new Date().toISOString(),
      });
    };

    const handleStoppedEvent = () => {
      logSystemEvent('error', 'websocket', 'UA stopped via ua.on event', {
        timestamp: new Date().toISOString(),
      });
    };

    const handleDisconnectedEvent = () => {
      logSystemEvent('error', 'websocket', 'UA disconnected via ua.on event', {
        timestamp: new Date().toISOString(),
      });
    };

    const handleNewMessageEvent = () => {
      logSystemEvent('success', 'keep_alive', 'Keep-alive message received via ua.on event', {
        timestamp: new Date().toISOString(),
      });
    };

    ua.on('registered', handleRegisteredEvent);
    ua.on('registrationFailed', handleRegistrationFailedEvent);
    ua.on('stopped', handleStoppedEvent);
    ua.on('disconnected', handleDisconnectedEvent);
    ua.on('newMessage', handleNewMessageEvent);

    return () => {
      if (ua) {
        ua.off('registered', handleRegisteredEvent);
        ua.off('registrationFailed', handleRegistrationFailedEvent);
        ua.off('stopped', handleStoppedEvent);
        ua.off('disconnected', handleDisconnectedEvent);
        ua.off('newMessage', handleNewMessageEvent);
      }
    };
  }, [ua, logSystemEvent]);

  useEffect(() => {
    if (timeoutArray.length > 0) {
      const latestTimeout = timeoutArray[timeoutArray.length - 1];
      logSystemEvent('warning', 'timeout', `Timeout event detected: ${latestTimeout.type}`, {
        timeoutType: latestTimeout.type,
        totalTimeouts: timeoutArray.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, [timeoutArray.length, logSystemEvent]);

  useEffect(() => {
    if (!ua?.transport?.socket) return;

    const checkWebSocketState = () => {
      const socket = ua.transport.socket;
      const currentState = socket.readyState;
      const prevState = socket._prevReadyState;

      if (prevState !== currentState) {
        socket._prevReadyState = currentState;

        let stateText = 'UNKNOWN';
        let eventType = 'info';

        switch (currentState) {
          case 0:
            stateText = 'CONNECTING';
            eventType = 'info';
            break;
          case 1:
            stateText = 'OPEN';
            eventType = 'success';
            break;
          case 2:
            stateText = 'CLOSING';
            eventType = 'warning';
            break;
          case 3:
            stateText = 'CLOSED';
            eventType = 'error';
            break;
        }

        logSystemEvent(eventType, 'websocket', `WebSocket state changed to ${stateText}`, {
          readyState: currentState,
          previousState: prevState,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const interval = setInterval(checkWebSocketState, 10000);
    return () => clearInterval(interval);
  }, [ua?.transport?.socket, logSystemEvent]);

  useEffect(() => {
    const checkSystemReadiness = () => {
      const wsStatus = getWebSocketStatus();
      const registered = isUARegistered();
      const isNetworkOnline = navigator.onLine;

      const hasRecentKeepAlive =
        messageDifference.length > 0
          ? Date.now() - messageDifference[messageDifference.length - 1].messageTime < 15000
          : true;

      const systemReady = wsStatus.connected && registered && isNetworkOnline;

      if (!ua) {
        logSystemEvent('info', 'system', 'Waiting for UA initialization', { connectionStatus });
      } else if (!registered) {
        logSystemEvent('info', 'system', 'UA initialized, waiting for SIP registration', {
          hasUA: !!ua,
          uaState: ua._state,
          hasSocket: !!ua?.transport?.socket,
          connectionStatus,
        });
      } else if (systemReady) {
        logSystemEvent('success', 'system', 'System fully operational', { allSystemsGo: true });
      }
    };

    const readinessInterval = setInterval(checkSystemReadiness, 60000);
    return () => clearInterval(readinessInterval);
  }, [ua, ua?._state, messageDifference.length, connectionStatus, isUARegistered, getWebSocketStatus, logSystemEvent]);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const wsStatus = getWebSocketStatus();
      const registered = isUARegistered();
      const hasRecentKeepAlive =
        messageDifference.length > 0 &&
        Date.now() - messageDifference[messageDifference.length - 1]?.messageTime < 30000;

      let wsStateText = 'Not Connected';
      let wsStateIcon = '❌';

      if (!ua) {
        wsStateText = 'UA Not Initialized';
        wsStateIcon = '⏸️';
      } else if (!ua?.transport?.socket && !wsStatus.connected) {
        wsStateText = 'No Socket';
        wsStateIcon = '❌';
      } else if (!registered) {
        wsStateText = 'Socket Ready, Not Registered';
        wsStateIcon = '🔄';
      } else if (registered && hasRecentKeepAlive) {
        wsStateText = 'CONNECTED & ACTIVE (inferred)';
        wsStateIcon = '✅';
      } else if (wsStatus.connected) {
        wsStateText = 'OPEN & REGISTERED';
        wsStateIcon = '✅';
      } else if (registered) {
        wsStateText = 'REGISTERED (socket status unclear)';
        wsStateIcon = '⚠️';
      } else {
        switch (wsStatus.readyState) {
          case 0:
            wsStateText = 'CONNECTING';
            wsStateIcon = '🔄';
            break;
          case 2:
            wsStateText = 'CLOSING';
            wsStateIcon = '⚠️';
            break;
          case 3:
            wsStateText = 'CLOSED';
            wsStateIcon = '❌';
            break;
          default:
            wsStateText = `UNKNOWN(${wsStatus.readyState})`;
            wsStateIcon = '❓';
        }
      }

      let sipStateText = 'NOT_INITIALIZED';
      let sipStateIcon = '⏸️';

      if (!ua) {
        sipStateText = 'UA Not Initialized';
        sipStateIcon = '⏸️';
      } else if (registered) {
        sipStateText = 'REGISTERED & ACTIVE';
        sipStateIcon = '✅';
      } else if (ua && ua._state) {
        sipStateText = `UA READY (${ua._state})`;
        sipStateIcon = '🔄';
      }

      let connectionIcon = '❓';
      switch (connectionStatus) {
        case 'CONNECTED':
          connectionIcon = '🟢';
          break;
        case 'CONNECTING':
          connectionIcon = '🔄';
          break;
        case 'NOT_INUSE':
          connectionIcon = '⚪';
          break;
        case 'INUSE':
          connectionIcon = '🟡';
          break;
        case 'Disposition':
          connectionIcon = '📞';
          break;
        default:
          connectionIcon = '❓';
      }

      const currentHealth = analyzeSystemHealth();
      let healthIcon = '💚';
      if (currentHealth.overallHealth < 30) healthIcon = '❤️';
      else if (currentHealth.overallHealth < 60) healthIcon = '💛';
      else if (currentHealth.overallHealth < 80) healthIcon = '🧡';

      if (messageDifference.length > 0) {
        const lastMessage = messageDifference[messageDifference.length - 1];
        const timeSinceLastMessage = Date.now() - lastMessage.messageTime;
      }
    }, 30000);

    return () => clearInterval(logInterval);
  }, [
    ua,
    ua?._state,
    connectionStatus,
    timeoutArray.length,
    messageDifference,
    successCount,
    errorCount,
    isUARegistered,
    getWebSocketStatus,
    analyzeSystemHealth,
  ]);

  useEffect(() => {
    if (!getFromLocalStorage('session_start')) {
      storeInLocalStorage('session_start', Date.now());
    }

    logSystemEvent('info', 'system', 'JsSIP monitoring system initialized', {
      connectionStatus,
      networkOnline: navigator.onLine,
      hasUA: !!ua,
      timestamp: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (conferenceCalls && conferenceCalls.length > 0 && (status === 'conference' || status === 'ringing')) {
      if (!hasParticipants) {
        setHasParticipants(true);
      }
    } else {
      if (hasParticipants) {
        setCallConference(false);
        setConferenceNumber('');
        setConferenceStatus(false);
        reqUnHold?.();
        setHasParticipants(false);
      }
    }
  }, [conferenceCalls, hasParticipants]);

  return [
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
  ];
};

export default useJssip;
