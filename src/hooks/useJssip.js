import React, { useState, useEffect, useRef, useContext } from 'react';
import HistoryContext from '../context/HistoryContext';
import { useStopwatch } from 'react-timer-hook';
import JsSIP from 'jssip';
import axios from 'axios';
import toast from 'react-hot-toast';

const useJssip = () => {
  const { setHistory, username, password } = useContext(HistoryContext);
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
  const [followUpDispoes, setFollowUpDispoes] = useState([]);
  const offlineToastIdRef = useRef(null);
  const agentSocketRef = useRef(null);
  const customerSocketRef = useRef(null);
  const agentMediaRecorderRef = useRef(null);
  const customerMediaRecorderRef = useRef(null);
  const audioRef = useRef();
  const chunks = useRef([]);
  const { seconds, minutes, isRunning, pause, reset } = useStopwatch({
    autoStart: false,
  });

  const originWithoutProtocol = 'esamwad.iotcom.io';
  // const originWithoutProtocol = window.location.origin.replace(/^https?:\/\//, '');

  function notifyMe() {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
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
      const response = await fetch(`https://esamwad.iotcom.io/reqConf/${username}`, {
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
      setIsConnectionLost(false); // Reset state before checking connection

      // Ensure request times out if API is stuck
      const response = await withTimeout(
        axios.post(
          `https://esamwad.iotcom.io/userconnection`,
          { user: username },
          { headers: { 'Content-Type': 'application/json' } }
        ),
        3000
      );

      if (response.status === 401 || !response.data.isUserLogin) {
        localStorage.clear();
        window.location.href = '/webphone/login';
        toast.error('Session expired. Please log in again.');
        session.terminate();
        stopRecording();
        setIsConnectionLost(true);
        return true;
      }

      const data = response.data;
      const tokenData = JSON.parse(localStorage.getItem('token'));
      setFollowUpDispoes(data.followUpDispoes);
      if (!tokenData?.userData?.campaign) {
        console.error('Campaign information missing in token data');
        localStorage.clear();
        window.location.href = '/webphone/login';
        toast.error('Invalid session. Please log in again.');
        session.terminate();
        stopRecording();
        setIsConnectionLost(true);
        return true;
      }

      const campaign = tokenData.userData.campaign;

      if (data.message !== 'ok connection for user') {
        localStorage.clear();
        window.location.href = '/webphone/login';
        session.terminate();
        stopRecording();
        toast.error('Connection lost. Please log in again.');
        setIsConnectionLost(true);
        return true;
      }

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
        // console.log('No current call queue data available');
      }

      setIsConnectionLost(false); // Connection is fine
      return false;
    } catch (err) {
      if (err.message === 'Timeout') {
        console.error('Connection timed out');
        toast.error('Server appears to be unresponsive. Retrying...');
        // localStorage.clear();
        // window.location.href = '/webphone/login';
        addTimeout('timeout');
      } else if (err.message.includes('Network')) {
        console.error('Network error:', err.message);
        toast.error('Network error. Please check your connection.');
        addTimeout('network');
      } else {
        console.error('Error during connection check:', err);
        if (err.response && err.response.status === 401) {
          localStorage.clear();
          window.location.href = '/webphone/login';
          toast.error('Session expired. Please log in again.');
          session.terminate();
          stopRecording();
        }
      }
      setIsConnectionLost(true);
      return true;
    }
  };

  const checkUserReady = async () => {
    try {
      const url = `https://esamwad.iotcom.io/userready/${username}`;
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

      // window.location.href = '/webphone/login';
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
      const socket = new WebSocket(`wss://${originWithoutProtocol}/socket`);

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
      const response = await fetch(`https://esamwad.iotcom.io/reqUnHold/${username}`, {
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
        await fetch(`https://esamwad.iotcom.io/reqHold/${username}`, {
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
        await fetch(`https://esamwad.iotcom.io/reqUnHold/${username}`, {
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
        `https://esamwad.iotcom.io/useroncall/${username}`,
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
    let isMounted = true; // Prevent state updates after unmount

    function checkUserLive() {
      if (!isMounted) return;

      // ✅ Read latest state inside setTimeout
      setMessageDifference((prev) => {
        // if (prev.length < 12) {
        // console.log('running recursion function for checking time :');
        // console.log('messageDifference length :', prev);
        const lastElement = prev[prev.length - 1];
        // console.log('last element :', lastElement);
        const timeOfLastElement = lastElement?.messageTime;
        const currentTime = Date.now();
        // console.log('current time :', currentTime);
        const difference = currentTime - timeOfLastElement;
        // console.log('difference in messageDifference time check : ', difference);

        if (difference > 14000) {
          console.log('User is not live');
          toast.error('User is not live. Please login again.');
          // setTimeout(checkUserLive, 15000);
          localStorage.clear();
          window.location.href = '/webphone/login';
          return prev;
        }
        // }

        setTimeout(checkUserLive, 15000); // Recursively call every 5 seconds
        return prev;
      });
    }

    checkUserLive(); // Start the recursive function

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, []);

  useEffect(() => {
    if (!username || !password) {
      return;
    }
    const initializeJsSIP = () => {
      try {
        var socket = new JsSIP.WebSocketInterface(`wss://${originWithoutProtocol}:8089/ws`);

        // Add direct socket error handling
        socket.onclose = function (event) {
          if (!event.wasClean) {
            console.error('WebSocket connection died unexpectedly');
            toast.error('Connection lost');
            localStorage.clear();
            window.location.href = '/webphone/login';
          }
        };

        socket.onerror = function (error) {
          console.error('WebSocket error:', error);
          toast.error('Connection failed');
          localStorage.clear();
          window.location.href = '/webphone/login';
        };

        var configuration = {
          sockets: [socket],
          session_timers: false,
          uri: `${username.replace('@', '-')}@${originWithoutProtocol}:8089`,
          password: password,
        };

        var ua = new JsSIP.UA(configuration);
        ua.start();

        ua.on('registered', (data) => {
          console.log('Successfully registered:', data);
          checkUserReady();
        });

        ua.on('newMessage', (e) => {
          const message = e.request.body;
          console.log('message event:', message);
          // const messageTime = parseInt(message?.split(",")[1]?.trim(), 10); // Use parseInt with base 10
          // console.log(`
          //   ${messageTime}
          //   ${Date.now()}
          //   ==============================`
          // );

          // // console.log('Message time:', messageTime, "current time:", Date.now());
          // const difference = Date.now() - messageTime;
          const objectToPush = {
            messageTime: Date.now(),
          };
          // // console.log('Difference:', difference);

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
          toast.error('User Phone not exits');
          localStorage.clear();
          // window.location.href = '/webphone/login';
        });

        ua.on('stopped', (e) => {
          console.error('stopped', e);
          // Add logout behavior for stopped event
          toast.error('Connection stopped');
          localStorage.clear();
          // window.location.href = '/webphone/login';
        });

        ua.on('disconnected', (e) => {
          console.error('UA disconnected', e);
          toast.error('Connection lost');
          localStorage.clear();
          // window.location.href = '/webphone/login';
        });

        ua.on('newRTCSession', function (e) {
          console.log('Session Direction:', e.session.direction);

          if (e.session.direction === 'incoming') {
            handleIncomingCall(e.session, e.request);
          } else {
            setSession(e.session);
            e.session.connection.addEventListener('addstream', (event) => {
              audioRef.current.srcObject = event.stream;
            });
          }
        });

        setUa(ua);
      } catch (error) {
        console.error('Error initializing JsSIP:', error);
        toast.error('You Are Logout');
        localStorage.clear();
        // window.location.href = '/webphone/login';
      }
    };

    const handleIncomingCall = (session, request) => {
      const incomingNumber = request.from._uri._user;
      // setInNotification(incomingNumber);
      session.answer(options);
      setSession(session);
      setStatus('calling');
      reset();
      answercall(incomingNumber);

      session.connection.addEventListener('addstream', (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.stream;
        }
      });

      session.once('ended', () => {
        setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: new Date().getTime() }]);
        pause();
        setStatus('start');
        // setPhoneNumber('');
        // setDispositionModal(true);
        // * this is new state added because user callended api was calling after
        // * dispostion done api when auto disposition is done
        setIsCallended(true);
        setConferenceNumber('');
      });

      session.once('failed', () => {
        setHistory((prev) => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], end: new Date().getTime(), status: 'Fail' },
        ]);
        pause();
        setStatus('start');
        // setPhoneNumber('');
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
          localStorage.clear();
          // window.location.href = '/webphone/login';
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

  const handleCall = (formattedNumber) => {
    if (isConnectionLost) {
      return;
    }

    setHistory((prev) => [
      ...prev,
      {
        startTime: new Date(),
        phoneNumber,
      },
    ]);
    localStorage.setItem('dialing', true);

    axios
      .post(
        'https://esamwad.iotcom.io/dialnumber',
        { caller: username, receiver: phoneNumber || formattedNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': `${username}`,
          },
        }
      )
      .then(() => {
        setPhoneNumber(phoneNumber || formattedNumber);
      })
      .catch((error) => {
        console.error('Error dialing:', error);
        toast.error('Failed to initiate the call');
      });
  };

  useEffect(() => {
    const callApi = async () => {
      console.log('calling user/callednde api:', Date.now());
      if (isCallended) {
        try {
          await axios.post(
            `https://esamwad.iotcom.io/user/callended${username}`,
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
  ];
};

export default useJssip;
