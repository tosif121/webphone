import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import HistoryContext from '../context/HistoryContext';
import { useStopwatch } from 'react-timer-hook';
import JsSIP from 'jssip';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useJssipState } from './jssip/useJssipState';
import { useJssipUtils } from './jssip/useJssipUtils';
import { useJssipConference } from './jssip/useJssipConference';
import { useJssipRecording } from './jssip/useJssipRecording';
import { useJssipMonitoring } from './jssip/useJssipMonitoring';

const useJssip = (isMobile = false) => {
  const { setHistory, username, password, setSelectedBreak, selectedBreak } = useContext(HistoryContext);
  const state = useJssipState();
  const utils = useJssipUtils(state);
  const conference = useJssipConference(state, utils);
  const recording = useJssipRecording(state, utils);
  const monitoring = useJssipMonitoring(state, utils);
  const {
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
    devices,
    setDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    mediaRecorder,
    setMediaRecorder,
    isRecording,
    setIsRecording,
    userCall,
    setUserCall,
    ringtone,
    setRingtone,
    inNotification,
    setInNotification,
    dispositionModal,
    setDispositionModal,
    isConnectionLost,
    setIsConnectionLost,
    connectionStatus,
    setConnectionStatus,
    timeoutArray,
    setTimeoutArray,
    messageDifference,
    setMessageDifference,
    avergaeMessageTimePerMinute,
    setAvergaeMessageTimePerMinute,
    isCallended,
    setIsCallended,
    callHandled,
    setCallHandled,
    showTimeoutModal,
    setShowTimeoutModal,
    incomingSession,
    setIncomingSession,
    incomingNumber,
    setIncomingNumber,
    isIncomingRinging,
    setIsIncomingRinging,
    followUpDispoes,
    setFollowUpDispoes,
    activeLead,
    setActiveLead,
    leadLockToken,
    setLeadLockToken,
    agentLifecycle,
    setAgentLifecycle,
    activeCallContext,
    setActiveCallContext,
    workspaceActiveCall,
    setWorkspaceActiveCall,
    conferenceCalls,
    setConferenceCalls,
    callConference,
    setCallConference,
    hasParticipants,
    setHasParticipants,
    userLogin,
    setUserLogin,
    queueDetails,
    setQueueDetails,
    hasTransfer,
    setHasTransfer,
    currentCallData,
    setCurrentCallData,
    offlineToastIdRef,
    agentSocketRef,
    customerSocketRef,
    agentMediaRecorderRef,
    customerMediaRecorderRef,
    dialingNumberRef,
    ringtoneRef,
    audioRef,
    callHandledRef,
    chunks,
    seconds,
    minutes,
    isRunning,
    pause,
    reset,
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
    isAutomationLoading,
    setIsAutomationLoading,
  } = state;

  const {
    playRingtone,
    stopRingtone,
    notifyMe,
    createNotification,
    checkUserReady,
    removeBreak,
    validatePhoneNumber,
    storeInLocalStorage,
    getFromLocalStorage,
  } = utils;

  const { createConferenceCall, reqUnHold, toggleHold, handleConferenceMessage } = conference;
  const { startRecording, stopRecording, changeAudioDevice } = recording;
  const {
    calculateAverageResponseTime,
    calculateConnectionUptime,
    isUARegistered,
    getWebSocketStatus,
    analyzeSystemHealth,
    logSystemEvent,
  } = monitoring;

  useEffect(() => {
    const originWithoutProtocol = window.location.origin.replace(/^https?:\/\//, '');
    setOrigin(originWithoutProtocol);
  }, []);

  const getStoredTokenPayload = useCallback(() => {
    try {
      const rawToken = localStorage.getItem('token');
      return rawToken ? JSON.parse(rawToken) : null;
    } catch (error) {
      console.error('Failed to parse stored token payload:', error);
      return null;
    }
  }, []);

  const getAuthHeaders = useCallback(
    (extraHeaders = {}) => {
      const tokenPayload = getStoredTokenPayload();
      const token = tokenPayload?.token;
      return token
        ? {
            Authorization: `Bearer ${token}`,
            ...extraHeaders,
          }
        : extraHeaders;
    },
    [getStoredTokenPayload],
  );

  const activeCallContextLoadedRef = useRef(false);
  const activeCallContextRequestRef = useRef(null);
  const bridgeIDRef = useRef('');

  const finalizePostCallContext = useCallback(() => {
    console.log('[WebPhone] Finalizing post-call context. Clearing bridgeID ref.');
    activeCallContextLoadedRef.current = false;
    activeCallContextRequestRef.current = null;
    bridgeIDRef.current = '';
    setBridgeID('');
    setActiveCallContext(null);
    setUserCall('');
    setWorkspaceActiveCall(null);
  }, [setActiveCallContext, setBridgeID, setUserCall, setWorkspaceActiveCall]);

  const ensureActiveCallContextLoaded = useCallback(
    async ({ incomingNumber = null, addIncomingHistory = false } = {}) => {
      if (activeCallContextLoadedRef.current) {
        return;
      }

      if (activeCallContextRequestRef.current) {
        return activeCallContextRequestRef.current;
      }

      activeCallContextRequestRef.current = (async () => {
        try {
          const response = await axios.post(
            `${window.location.origin}/useroncall/${username}`,
            leadLockToken ? { leadLockToken } : {},
            {
              headers: {
                ...getAuthHeaders({ 'Content-Type': 'application/json' }),
              },
            },
          );

          if (response.status !== 200) {
            throw new Error('Failed to process call');
          }

          const newBridgeID = response.data.currentcalldata?.bridgeID || '';
          console.log('[WebPhone] Context loaded. Setting bridgeID:', newBridgeID);
          bridgeIDRef.current = newBridgeID;
          setBridgeID(newBridgeID);
          setActiveCallContext(response.data.currentcalldata || null);
          if (response.data.contactData) {
            setUserCall(response.data.contactData);
          }
          setAgentLifecycle('on_call');
          setConferenceStatus(false);
          activeCallContextLoadedRef.current = true;

          if (addIncomingHistory && incomingNumber) {
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
        } catch (error) {
          activeCallContextLoadedRef.current = false;
          console.error('Error processing call:', error);
          throw error;
        } finally {
          activeCallContextRequestRef.current = null;
        }
      })();

      return activeCallContextRequestRef.current;
    },
    [
      getAuthHeaders,
      leadLockToken,
      setActiveCallContext,
      setAgentLifecycle,
      setBridgeID,
      setConferenceStatus,
      setHistory,
      setUserCall,
      username,
    ],
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasActiveCall =
        connectionStatus === 'Disposition' ||
        incomingSession ||
        status === 'calling' ||
        status === 'conference' ||
        isIncomingRinging;

      // ✅ Check if agent is on break (selectedBreak is not 'Break')
      const isOnBreak = selectedBreak && selectedBreak !== 'Break';

      // ✅ Prevent close if active call OR on break
      if (hasActiveCall || isOnBreak) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [connectionStatus, incomingSession, status, isIncomingRinging, selectedBreak]);

  // In useJssip.js

  const handleLoginSuccess = async () => {
    // Close the modal
    setShowTimeoutModal(false);

    // Clear connection lost flag
    setIsConnectionLost(false);

    // Clear timeout message
    setTimeoutMessage('');

    // Show success message
    toast.success('Re-login successful. Reconnecting...', {
      duration: 2000,
    });

    // ✅ Full page reload to re-initialize everything
    setTimeout(() => {
      window.location.reload();
    }, 500);
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
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('breakStartTime_')) {
        localStorage.removeItem(key);
      }
    });

    window.location.href = '/webphone/v1/login';
  };

  const withTimeout = (promise, timeoutMs) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))]);

  const addTimeout = (type) => {
    setTimeoutArray((prev) => {
      const updated = [...prev, { type, timestamp: new Date().getTime() }];
      return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
    });
  };

  // In useJssip.js

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
          {
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          },
        ),
        3000,
      );

      const data = response.data;

      // In connectioncheck function

      // ✅ 1. Poor connection - don't set userLogin, allow re-connect
      if (data.message === 'poor connection problem ,please login again') {
        console.warn('⚠️ Poor connection detected from server');

        if (status === 'start' && !dispositionModal) {
          setTimeoutMessage('Poor connection problem. Please login again.');
          setShowTimeoutModal(true);

          return true;
        }
        return false;
      }

      // ✅ 2. Force logout - set userLogin to true
      if (response.status === 401 || !data.isUserLogin) {
        console.warn('⚠️ Authentication failure detected');

        if (status === 'start' && !dispositionModal) {
          setTimeoutMessage('');
          await handleLogout(token, 'Force logout. Please log in again.');

          // ✅ SET userLogin to true - force to login page
          setUserLogin(true);

          return true;
        }
        return false;
      }

      // ✅ 3. Set follow-up dispositions and connection status
      setFollowUpDispoes(data.followUpDispoes || []);
      setConnectionStatus(data.status);
      if (data.status === 'Disposition') {
        setAgentLifecycle('disposition');
      } else if (data.status === 'INUSE') {
        setAgentLifecycle('on_call');
      } else if (data.status === 'NOT_INUSE' || data.status === 'UNAVAILABLE') {
        setAgentLifecycle(leadLockToken ? 'lead_locked' : 'idle');
      }

      // ✅ 4. Handle other connection issues
      if (data.message !== 'ok connection for user') {
        console.warn('⚠️ Connection issue:', data.message);

        if (status === 'start' && !dispositionModal) {
          // Clear custom timeout message
          setTimeoutMessage('');

          await handleConnectionLost();
          return true;
        }
        return false;
      }

      // ✅ 5. Update conference calls
      setConferenceCalls(data.conferenceCalls || []);

      // ✅ 6. Update queue details
      if (data.currentCallqueue?.length > 0 && data.currentCallqueue[0].queueDetail) {
        setQueueDetails(data.currentCallqueue[0].queueDetail);
        setHasTransfer(data.currentCallqueue[0].queueTransfered === true);
        setCurrentCallData(data.currentCallqueue[0]);
      } else {
        setQueueDetails([]);
        setHasTransfer(false);
        setCurrentCallData(null);
      }

      // ✅ 7. Handle ringtone/incoming calls
      if (data.currentCallqueue?.length > 0) {
        // Check if campaign matches
        if (campaign === data.currentCallqueue[0].campaign) {
          setRingtone(data.currentCallqueue);
          setInNotification(data.currentCallqueue.map((call) => call.Caller));
        } else {
          // Campaign mismatch - clear ringtone
          setRingtone([]);
        }
      } else {
        // No calls in queue - clear ringtone
        setRingtone([]);
      }

      // ✅ 8. Connection successful
      setIsConnectionLost(false);
      return false;
    } catch (err) {
      // ✅ 9. Handle errors
      console.error('Connection check error:', err);
      return await handleConnectionError(err);
    }
  };

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

  const eventHandlers = {
    failed: function (e) {
      setStatus('fail');
      setAgentLifecycle(leadLockToken ? 'lead_locked' : 'idle');
      // setPhoneNumber('');
      if (isRecording) {
        stopRecording();
      }
      setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], status: 'Fail', start: 0, end: 0 }]);
    },

    confirmed: function (e) {
      reset(undefined, true);
      startRecording();
      setAgentLifecycle('on_call');
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

  useEffect(() => {
    const handleRefreshFollowUps = () => {
      void connectioncheck();
    };

    window.addEventListener('refreshFollowUps', handleRefreshFollowUps);
    return () => {
      window.removeEventListener('refreshFollowUps', handleRefreshFollowUps);
    };
  }, [connectioncheck]);

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
        setAgentLifecycle('on_call');
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

        await ensureActiveCallContextLoaded();
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
    // finalizePostCallContext(); // REMOVED: Don't clear bridgeID yet, we need it for automation
    // Update history as rejected
    setHistory((prev) => [
      ...prev.slice(0, -1),
      { ...prev[prev.length - 1], status: 'Rejected', end: new Date().getTime() },
    ]);

    setDispositionModal(false);
  };

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
          }
        };

        socket.onerror = function (error) {
          console.error('WebSocket error:', error);
          toast.error('Connection failed');
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
          checkUserReady();
          const storedBreak = localStorage.getItem('selectedBreak');
          if (storedBreak && storedBreak !== 'Break') {
            try {
              await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay

              const response = await axios.post(`${window.location.origin}/user/breakuser:${username}`, {
                breakType: storedBreak,
              });
              if (response.status === 200) {
                setSelectedBreak(storedBreak);
              } else {
                console.error(
                  `[Re-apply Break] Backend responded with status ${response.status} for break re-application.`,
                  response.data,
                );
                localStorage.removeItem('selectedBreak');
                Object.keys(localStorage).forEach((key) => {
                  if (key.startsWith('breakStartTime_')) {
                    localStorage.removeItem(key);
                  }
                });
                setSelectedBreak('Break');
              }
            } catch (error) {
              console.error('Error re-applying break from localStorage after registration:', error);
              toast.error(`Failed to re-apply previous break (${storedBreak}).`);
              localStorage.removeItem('selectedBreak');
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith('breakStartTime_')) {
                  localStorage.removeItem(key);
                }
              });
              setSelectedBreak('Break');
            }
          } else {
            // console.log('[Re-apply Break] No valid break found in localStorage to re-apply.');
          }
        });

        ua.on('newMessage', (e) => {
          const message = e.request.body;
          console.log(message, 'message');
          // ✅ Check for force login request
          if (message.includes('force_login_request') || message.includes('Force Login Request')) {
            // Dispatch custom event that Layout can listen to
            window.dispatchEvent(new CustomEvent('forceLoginRequest', { detail: { message } }));
          }
          // ✅ Check for conference messages (connected/disconnected)
          else if (/customer host channel (connected|di[s]?connected)/i.test(message)) {
            handleConferenceMessage(message);
          }
          // ✅ Check for customer channel disconnection (auto-reject if ringing)
          else if (message.includes('customer channel disconnected')) {
            console.log('[WebPhone] Customer channel disconnected while ringing - auto-rejecting');
            rejectIncomingCall();
          }
          // ✅ Check if customer/agent channel answered (both enable Add Call button)
          else if (message.includes('customer channel answered') || message.includes('agent channel answered')) {
            setIsCustomerAnswered(true);

            const objectToPush = {
              messageTime: Date.now(),
              messageType: message.includes('customer') ? 'customer_answered' : 'agent_answered',
              message: message,
            };

            setMessageDifference((prev) => {
              const updatedDifferences = [...prev, objectToPush];
              if (updatedDifferences.length > 10) {
                updatedDifferences.shift();
              }
              return updatedDifferences;
            });
          } else {
            // Handle non-conference messages (keepalive)
            const objectToPush = {
              messageTime: Date.now(),
              messageType: 'keepalive',
              message: undefined,
            };

            setMessageDifference((prev) => {
              const updatedDifferences = [...prev, objectToPush];
              if (updatedDifferences.length > 10) {
                updatedDifferences.shift();
              }
              return updatedDifferences;
            });
          }

          // Always run connection check
          connectioncheck();
        });

        ua.on('registrationFailed', (data) => {
          console.error('Registration failed:', data);
          toast.error('Registration failed');
        });

        ua.on('stopped', (e) => {
          console.error('stopped', e);
          // Add logout behavior for stopped event
          toast.error('Connection stopped');
        });

        ua.on('disconnected', (e) => {
          console.error('UA disconnected', e);
          toast.error('Connection lost');
        });
        ua.on('newRTCSession', function (e) {
          if (e.session.direction === 'incoming') {
            const remoteNumber = e.session.remote_identity.uri.user;
            const isActuallyOutgoing = dialingNumberRef.current && remoteNumber === dialingNumberRef.current;

            if (isActuallyOutgoing) {
              dialingNumberRef.current = '';

              // Even for outgoing calls, check if user is away and show notification
              const incomingNumber = e.request.from._uri._user;
              setInNotification(incomingNumber);

              handleIncomingCall(e.session, e.request, {
                addIncomingHistory: false,
                startTimerImmediately: false,
              }); // Outgoing leg should start timer only after answer
            } else {
              // Check if this is an autodial call
              const checkAutodialAndHandle = async () => {
                // Try multiple sources for call data
                let callData = currentCallData;

                // If currentCallData is null, try to get it from ringtone state
                if (!callData && ringtone && ringtone.length > 0) {
                  callData = ringtone[0];
                }

                // If still no data, refresh and wait briefly
                if (!callData) {
                  await checkUserReady();
                  // Wait a bit for the data to be available
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  callData = currentCallData || (ringtone && ringtone.length > 0 ? ringtone[0] : null);
                }

                const isAutodialCall = callData?.Type === 'autodial';

                if (isMobile && isAutodialCall) {
                  // Stop any ringtone and clear UI
                  stopRingtone();
                  setIsIncomingRinging(false);
                  setIncomingSession(null);

                  const incomingNumber = e.request.from._uri._user;

                  // Always trigger notification check (will only show if user is away)
                  setInNotification(incomingNumber);

                  // Auto-answer the call
                  handleIncomingCall(e.session, e.request, { addIncomingHistory: false });
                  return true; // Indicate autodial was handled
                }

                return false; // Not autodial or not mobile
              };

              // Check for autodial first
              checkAutodialAndHandle()
                .then((wasAutodial) => {
                  if (wasAutodial) return; // Exit if autodial was handled

                  // Continue with normal mobile incoming call flow
                  if (isMobile) {
                    // Mobile: Show UI with ringtone
                    const incomingNumber = e.request.from._uri._user;
                    setIncomingSession(e.session);
                    setIncomingNumber(incomingNumber);
                    setIsIncomingRinging(true);
                    setStatus('incoming');
                    setAgentLifecycle('ringing');

                    // Trigger web notification (will check if user is away)
                    setInNotification(incomingNumber);

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
                      setIsCustomerAnswered(false);
                      setHistory((prev) => [
                        ...prev.slice(0, -1),
                        { ...prev[prev.length - 1], status: 'Ended', end: Date.now() },
                      ]);
                      pause();
                      setStatus('start');
                      setIsCallended(true);
                      setAgentLifecycle('disposition');
                      setDispositionModal(true);
                      setCallHandled(false);
                      callHandledRef.current = false;
                      setConferenceNumber('');
                    });

                    e.session.on('failed', () => {
                      stopRingtone();
                      checkUserReady();
                      setIncomingSession(null);
                      setIsIncomingRinging(false);
                      setStatus('start');
                      setAgentLifecycle(callHandledRef.current ? 'disposition' : 'idle');
                      setHistory((prev) => [
                        ...prev.slice(0, -1),
                        { ...prev[prev.length - 1], status: 'Failed', end: new Date().getTime() },
                      ]);
                      setDispositionModal(callHandledRef.current);
                      setCallHandled(false);
                      callHandledRef.current = false;
                    });
                  } else {
                    // Desktop: Check if user is away and show notification before auto-answer
                    const incomingNumber = e.request.from._uri._user;

                    // Always trigger notification check (will only show if user is away)
                    setInNotification(incomingNumber);

                    // Auto-answer the call (existing logic)
                    handleIncomingCall(e.session, e.request, { addIncomingHistory: true });
                  }
                })
                .catch((error) => {
                  console.error('Error in autodial check:', error);
                  // Fallback to normal incoming call flow on error
                  if (isMobile) {
                    const incomingNumber = e.request.from._uri._user;
                    setIncomingSession(e.session);
                    setIncomingNumber(incomingNumber);
                    setIsIncomingRinging(true);
                    setStatus('incoming');
                    setAgentLifecycle('ringing');

                    // Trigger web notification (will check if user is away)
                    setInNotification(incomingNumber);

                    playRingtone();
                  }
                });
            }
          } else {
            // Handle normal outgoing calls (when direction is actually "outgoing")
            setSession(e.session);
            setStatus('calling');
            setAgentLifecycle('dialing');

            // Set up audio stream
            e.session.connection.addEventListener('addstream', (event) => {
              if (audioRef.current) {
                audioRef.current.srcObject = event.stream;
              }
            });

            // Add event listeners for outgoing calls
            e.session.on('confirmed', () => {
              reset(undefined, true);
              startRecording();
              void ensureActiveCallContextLoaded();
              setAgentLifecycle('on_call');
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
              if (isRecordingRef.current) {
                stopRecording();
              }
              setIsCustomerAnswered(false);
              setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: Date.now() }]);
              pause();
              setStatus('start');
              setIsCallended(true);
              setAgentLifecycle('disposition');
              setDispositionModal(true);
              setConferenceNumber('');
            });

            e.session.on('failed', () => {
              finalizePostCallContext();
              setStatus('fail');
              setAgentLifecycle(leadLockToken ? 'lead_locked' : 'idle');
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

    const handleIncomingCall = (
      session,
      request,
      { addIncomingHistory = false, startTimerImmediately = true } = {},
    ) => {
      const incomingNumber = request.from._uri._user;
      session.answer(options); // Auto-answers (good for outgoing)
      setSession(session);
      setStatus('calling');
      setAgentLifecycle('on_call');
      reset(undefined, startTimerImmediately);
      void ensureActiveCallContextLoaded({ incomingNumber, addIncomingHistory });

      session.once('confirmed', () => {
        if (!startTimerImmediately) {
          reset(undefined, true);
        }
      });

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
        setAgentLifecycle('disposition');
        setIsCallended(true);
        setConferenceNumber('');
        setDispositionModal(true);
      });

      session.once('failed', () => {
        finalizePostCallContext();
        setHistory((prev) => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], end: new Date().getTime(), status: 'Fail' },
        ]);
        pause();
        setStatus('start');
        setAgentLifecycle('idle');
        setDispositionModal(false);
      });
    };
    const enumerateDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not available (possibly insecure context)');
        return;
      }
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

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    }

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
      }
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

  const handleCall = async (formattedNumber, metadata = {}) => {
    // ✅ 1. Early return - Check connection status
    if (isConnectionLost) {
      toast.error('Connection lost. Please check your internet connection.');
      return;
    }

    const targetNumber = phoneNumber || formattedNumber;
    const nextLead = metadata?.lead || activeLead;
    const nextLeadLockToken = metadata?.leadLockToken || leadLockToken;

    try {
      // ✅ 2. Handle break removal if needed
      if (selectedBreak !== 'Break') {
        const breakRemoved = await removeBreak();
        if (!breakRemoved) {
          console.warn('Break removal failed');
          return; // Stop if break removal failed
        }
      }

      // ✅ 3. Clean and store the number
      const cleanedNumber = targetNumber.replace(/\D/g, '');
      dialingNumberRef.current = cleanedNumber;
      setPhoneNumber(targetNumber);
      setCallType('outgoing');
      pause();
      reset(undefined, false);
      if (nextLead) {
        setActiveLead(nextLead);
      }
      if (nextLeadLockToken) {
        setLeadLockToken(nextLeadLockToken);
        setAgentLifecycle('dialing');
      }

      // ✅ 4. Add to call history
      const callRecord = {
        startTime: new Date(),
        phoneNumber: targetNumber,
        type: 'outgoing',
      };
      setHistory((prev) => [...prev, callRecord]);

      // ✅ 5. Set dialing state in localStorage
      try {
        localStorage.setItem('dialing', 'true');
      } catch (storageError) {
        console.warn('Failed to set localStorage:', storageError);
        // Continue anyway, localStorage isn't critical for the call
      }

      // ✅ 6. Make the API call to dial number
      const response = await axios.post(
        `${window.location.origin}/dialnumber`,
        {
          receiver: targetNumber,
          leadLockToken: nextLeadLockToken || undefined,
          leadId: nextLead?.leadId || undefined,
        },
        {
          headers: {
            ...getAuthHeaders({
              'Content-Type': 'application/json',
              'X-User-ID': username,
            }),
          },
          timeout: 10000, // 10 second timeout
        },
      );

      // ✅ 7. Check response for errors even if status is 200
      if (response.data && !response.data.success) {
        const errorMessage = response.data.message || response.data.cause;
        console.warn('API returned error:', errorMessage);

        // ✅ 7a. Check if it's the "agent not ready" error
        if (errorMessage?.includes('Agent is not in a ready state') || errorMessage?.includes('Please Login again')) {
          console.warn('⚠️ Agent not in ready state');

          // Set custom timeout message
          setTimeoutMessage('Agent is not in a ready state. Please login again.');

          // Show modal (don't set userLogin to allow re-connect)
          setShowTimeoutModal(true);

          // Reset call state
          setStatus('start');
          setPhoneNumber('');
          dialingNumberRef.current = '';
          setCallType('');
          setAgentLifecycle(nextLeadLockToken ? 'lead_locked' : 'idle');

          return;
        }

        // ✅ 7b. Other API errors
        toast.error(errorMessage || 'Failed to initiate call');
        setStatus('start');
        setPhoneNumber('');
        dialingNumberRef.current = '';
        setCallType('');
        setAgentLifecycle(nextLeadLockToken ? 'lead_locked' : 'idle');
        return;
      }

      // ✅ 8. Success - call initiated
    } catch (error) {
      console.error('❌ Call initiation error:', error);

      // ✅ 9. Reset state on error
      setStatus('start');
      setPhoneNumber('');
      dialingNumberRef.current = '';
      setCallType('');
      setAgentLifecycle(nextLeadLockToken ? 'lead_locked' : 'idle');

      // ✅ 10. Check if error response contains "agent not ready" message
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorMessage = errorData.message || errorData.cause;

        // ✅ 10a. Agent not ready error from error response
        if (errorMessage?.includes('Agent is not in a ready state') || errorMessage?.includes('Please Login again')) {
          console.warn('⚠️ Agent not in ready state (from error response)');

          // Set custom timeout message
          setTimeoutMessage('Agent is not in a ready state. Please login again.');

          // Show modal (don't set userLogin to allow re-connect)
          setShowTimeoutModal(true);

          return;
        }
      }

      // ✅ 11. Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout');
        toast.error('Call request timed out. Please try again.');
      } else if (error.response?.status === 400) {
        console.error('Bad request (400)');
        toast.error('Invalid phone number or user not found');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        // ✅ 11a. Authentication errors - force logout
        console.error('Authentication error (401/403)');

        const tokenDataString = localStorage.getItem('token');
        const parsedTokenData = tokenDataString ? JSON.parse(tokenDataString) : null;
        const token = parsedTokenData?.token;

        // Clear custom message (use default)
        setTimeoutMessage('');

        // Trigger logout
        await handleLogout(token, 'Session expired. Please log in again.');

        // Force to login page
        setUserLogin(true);
      } else if (error.response?.status >= 500) {
        console.error('Server error (5xx)');
        toast.error('Server error. Please try again later.');
      } else {
        console.error('Unknown error');
        toast.error('Failed to initiate the call. Please try again.');
      }
    }
  };

  useEffect(() => {
    const callApi = async () => {
      if (isCallended) {
        console.log('[WebPhone] Call Ended. Starting automation for:', username);
        setIsAutomationLoading(true);
        try {
          // 1. Call callended API
          const callendedUrl = `${window.location.origin}/user/callended${username}`;
          console.log('[WebPhone] Triggering callended API:', callendedUrl, { leadLockToken });

          await axios.post(callendedUrl, leadLockToken ? { leadLockToken } : {}, {
            headers: {
              ...getAuthHeaders({ 'Content-Type': 'application/json' }),
            },
          });

          if (isMobile) {
            // 2. On Mobile, perform SILENT auto-disposition
            try {
              const dispoUrl = `${window.location.origin}/user/disposition${username}`;
              const finalBridgeID = bridgeIDRef.current || bridgeID;
              const dispoPayload = {
                bridgeID: finalBridgeID,
                Disposition: 'Auto Disposed',
                autoDialDisabled: false,
              };
              console.log('[WebPhone] Triggering silent disposition:', dispoUrl, dispoPayload, {
                refValue: bridgeIDRef.current,
                stateValue: bridgeID,
              });

              const response = await axios.post(dispoUrl, dispoPayload, {
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
              });
              console.log('[WebPhone] Disposition response:', response.data);
            } catch (dispoError) {
              console.error('[WebPhone] Silent disposition failed:', dispoError.response?.data || dispoError.message);
            }

            // 3. Reset to IDLE / Home Screen instantly on mobile
            setIsHeld(false);
            setIsCallended(false);
            setAgentLifecycle('idle');
            setDispositionModal(false);
            setCallType('');
            setPhoneNumber('');
          } else {
            // 4. On Desktop, show the Disposition Modal as usual
            setIsHeld(false);
            setIsCallended(false);
            setAgentLifecycle('disposition');
            setDispositionModal(true);
          }
        } catch (error) {
          console.error('[WebPhone] Error in post-call automation:', error);
          // Safety reset even on error
          setIsCallended(false);
          setAgentLifecycle('idle');
        } finally {
          setIsAutomationLoading(false);
          // ✅ Clear context ONLY after automation is done or failed
          finalizePostCallContext();
        }
      }
    };

    callApi();
  }, [
    isCallended,
    username,
    leadLockToken,
    getAuthHeaders,
    isMobile,
    setPhoneNumber,
    bridgeID,
    phoneNumber,
    setIsAutomationLoading,
  ]);

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
    queueDetails,
    hasTransfer,
    currentCallData,
    hasParticipants,
    muted,
    setMuted,
    timeoutMessage,
    setTimeoutMessage,
    isCustomerAnswered,
    setHasParticipants,
    isMerged,
    setIsMerged,
    activeLead,
    setActiveLead,
    leadLockToken,
    setLeadLockToken,
    agentLifecycle,
    setAgentLifecycle,
    activeCallContext,
    setActiveCallContext,
    workspaceActiveCall,
    setWorkspaceActiveCall,
    finalizePostCallContext,
    isAutomationLoading,
    setIsAutomationLoading,
  ];
};

export default useJssip;
