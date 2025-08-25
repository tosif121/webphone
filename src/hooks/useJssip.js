import React, { useState, useEffect, useRef, useContext } from 'react';
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
  const [timeoutArray, setTimeoutArray] = useState([]);
  const [isCallended, setIsCallended] = useState(false);
  const [messageDifference, setMessageDifference] = useState([]);
  const [avergaeMessageTimePerMinute, setAvergaeMessageTimePerMinute] = useState([]);
  // const [isDialbuttonClicked, setIsDialbuttonClicked] = useState(false);
  const [callHandled, setCallHandled] = useState(false);
  const [incomingSession, setIncomingSession] = useState(null);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [isIncomingRinging, setIsIncomingRinging] = useState(false);
  const [followUpDispoes, setFollowUpDispoes] = useState([]);
  const [conferenceCalls, setConferenceCalls] = useState([]);
  const [callConference, setCallConference] = useState(false);
  const [callType, setCallType] = useState('');
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
        dispositionModal || incomingSession || status === 'calling' || status === 'conference' || isIncomingRinging;

      if (hasActiveCall) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dispositionModal, incomingSession, status, isIncomingRinging]);

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
          return true;
        }
        return false;
      }

      const data = response.data;
      setFollowUpDispoes(data.followUpDispoes);

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
      }, 4000);
    }

    return () => clearTimeout(timeout);
  }, [conferenceCalls, status, callConference, conferenceStatus]);

  // console.log(conferenceStatus, conferenceCalls, status, callConference, 'conferenceCalls length');
  // Helper function for logout process
  const handleLogout = async (token, message) => {
    try {
      if (token) {
        await axios.delete(`${window.location.origin}/deleteFirebaseToken`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Show alert with reason before clearing and redirecting
      const alertMessage = message || 'You are being logged out. Please re-login to continue.';
      window.alert(alertMessage);

      localStorage.clear();

      toast.success('Logged out successfully');

      if (session && session.status < 6) {
        session.terminate();
      }
      stopRecording();

      window.location.href = '/webphone/v1/login';
    } catch (error) {
      console.error('Error during logout:', error);

      // Show alert in error case too
      window.alert('An error occurred during logout. Please re-login.');

      localStorage.clear();

      window.location.href = '/webphone/v1/login';
    }

    if (message) {
      toast.error(message);
    }
    setIsConnectionLost(true);
  };

  // Helper function for connection lost scenarios
  const handleConnectionLost = async () => {
    window.location.href = '/webphone/v1';

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

  // const getAverage = (arr) => {
  //   if (arr.length === 0) return 0; // Handle empty array case
  //   return arr.reduce((sum, num) => sum + num, 0) / arr.length;
  // };

  // useEffect(() => {
  //   // console.log('message difference time :', messageDifference);
  //   // console.log('averages per minutes :', avergaeMessageTimePerMinute);
  //   if (avergaeMessageTimePerMinute.length > 10) {
  //     // Remove oldest difference
  //     setAvergaeMessageTimePerMinute((prev) => prev.slice(1));
  //   }
  //   if (messageDifference.length === 12) {
  //     const average = Math.ceil(getAverage(messageDifference));
  //     const maxNumber = Math.max(...messageDifference);
  //     const avgAndMaxNumberObj = {
  //       average,
  //       maxNumber,
  //     }
  //     setAvergaeMessageTimePerMinute((prev) => [...prev, avgAndMaxNumberObj]);
  //     setMessageDifference([]);
  //   }
  // }, [messageDifference]);

  // useEffect(() => {
  //   let isMounted = true; // To prevent state updates after unmount

  //   function checkUserLive() {
  //     if (!isMounted) return;

  //     if (messageDifference.length < 12) {
  //       console.log('running recurrsion functoin for checking time :');
  //       console.log('messageDifference length :', messageDifference);
  //       const lastElement = messageDifference[messageDifference.length - 1];
  //       console.log('last element :', lastElement);
  //       const timeOfLastElement = lastElement?.messageTime;
  //       const currentTime = Date.now();
  //       console.log('current time :', currentTime);
  //       const difference = currentTime - timeOfLastElement;
  //       console.log('difference in messageDifference time check : ', difference);

  //       if (difference > 14000) {
  //         console.log("User is not live");
  //         toast.error("User is not live. Please login again.");
  //         return;
  //       }
  //     }

  //     setTimeout(checkUserLive, 5000); //Recursively call every 15 seconds
  //   };
  //   checkUserLive(messageDifference);

  //   return () => {
  //     isMounted = false; //Cleanup to prevent memory leaks
  //   };
  // }, [])

  useEffect(() => {
    let isMounted = true;

    function checkUserLive() {
      if (!isMounted) return;

      setMessageDifference((prev) => {
        const lastElement = prev[prev.length - 1];
        const timeOfLastElement = lastElement?.messageTime;
        const currentTime = Date.now();
        const difference = currentTime - timeOfLastElement;

        if (difference > 14000) {
          console.log('User is not live');

          // Show alert with reason
          window.alert('Session timed out due to inactivity or no keep-alive response from server. Please re-login.');

          localStorage.clear(); // Clear after alert
          window.location.href = '/webphone/v1/login';

          toast.error('User is not live. Please login again.');
          toast.error(
            'Keep Alive message not received from server live. Please check network connection and login again.'
          );
          return prev;
        }

        setTimeout(checkUserLive, 15000);
        return prev;
      });
    }

    checkUserLive();

    return () => {
      isMounted = false;
    };
  }, []);

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
          console.log('Message body :', message);
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
              console.log('✅ This is our OUTGOING call (auto-answer)');
              dialingNumberRef.current = '';
              handleIncomingCall(e.session, e.request); // Your existing auto-answer logic
            } else {
              console.log('✅ This is TRUE INCOMING call');

              if (isMobile) {
                // Mobile: Show UI with ringtone
                console.log('📱 Mobile - showing incoming call UI');
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
                console.log('🖥️ Desktop - auto-answering incoming call');
                handleIncomingCall(e.session, e.request); // Reuse existing auto-answer logic
              }
            }
          } else {
            console.log('✅ Normal OUTGOING call');
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
        toast.error('You Are Logout');
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

      console.log('🚀 Starting OUTGOING call to:', targetNumber);

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
      console.log('calling user/callednde api:', Date.now());
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
          setIsCallended(false);
          setDispositionModal(true);
        } catch (error) {
          console.error('Error calling callendedd API:', error);
        }
      }
    };

    callApi();
  }, [isCallended, username]);

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
  ];
};

export default useJssip;
