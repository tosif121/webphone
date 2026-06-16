import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import HistoryContext from '../context/HistoryContext';
import moment from 'moment';
import { useStopwatch } from 'react-timer-hook';
import JsSIP from 'jssip';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useJssipState } from './jssip/useJssipState';
import { useJssipUtils } from './jssip/useJssipUtils';
import { useJssipConference } from './jssip/useJssipConference';
import { useJssipRecording } from './jssip/useJssipRecording';
import { useJssipMonitoring } from './jssip/useJssipMonitoring';
import { normalizePhone } from '../utils/normalizePhone';

const useJssip = (isMobile = false) => {
  const { setHistory, username, password, setSelectedBreak, selectedBreak, setScheduleCallsLength } =
    useContext(HistoryContext);
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
    currentCallqueueCount,
    setCurrentCallqueueCount,
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
    isSticky,
    setIsSticky,
  } = state;

  const {
    playRingtone,
    stopRingtone,
    notifyMe,
    createNotification,
    checkUserReady,
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
    logSessionEvent,
    getSessionStats,
  } = monitoring;

  // useEffect(() => {
  //   const originWithoutProtocol = window.location.origin.replace(/^https?:\/\//, '');
  //   setOrigin(originWithoutProtocol);
  // }, []);

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

  const pendingPostCallRef = useRef(false);
  const activeCallContextLoadedRef = useRef(false);
  const activeCallContextRequestRef = useRef(null);
  const bridgeIDRef = useRef('');
  const incomingSessionRef = useRef(null);
  const isIncomingRingingRef = useRef(false);
  const statusRef = useRef('start');
  const dispositionModalRef = useRef(false);
  const connectionStatusRef = useRef('');
  const agentLifecycleRef = useRef('idle');
  const isAutomationLoadingRef = useRef(false);
  const isCallendedRef = useRef(false);
  const isCustomerAnsweredRef = useRef(false);
  const callConnectedRef = useRef(false);
  const callTypeRef = useRef('');
  const manualHangupRequestedRef = useRef(false);
  const readySyncInFlightRef = useRef(null);
  const readySyncLastSuccessRef = useRef(0);
  const connectioncheckInFlightRef = useRef(false);
  const callendedInFlightRef = useRef(false);
  const connectioncheckRef = useRef(null);
  const connectionFailureCountRef = useRef(0);
  const lastAriMessageAtRef = useRef(0);
  const lastConnectionCheckAtRef = useRef(0);
  const lastConnectionToastAtRef = useRef(0);
  const uaRef = useRef(null);
  const activeCallRef = useRef(null);
  const lastSipHeartbeatAttemptAtRef = useRef(0);
  const sipHeartbeatFailureCountRef = useRef(0);
  const lastRuntimeResyncAttemptAtRef = useRef(0);

  const MESSAGE_HEARTBEAT_STALE_MS = 10000;
  const CONNECTION_CHECK_TIMEOUT_MS = 8000;
  const CONNECTION_CHECK_SCHEDULER_MS = 5000;
  const CONNECTION_CHECK_MIN_REQUEST_GAP_MS = 5000;
  const SIP_HEARTBEAT_SEND_INTERVAL_MS = 4000;
  const SIP_HEARTBEAT_MIN_GAP_MS = 2500;
  const RUNTIME_RESYNC_MIN_GAP_MS = 3000;

  const waitForReadyRetry = useCallback((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)), []);

  useEffect(() => {
    incomingSessionRef.current = incomingSession;
  }, [incomingSession]);

  useEffect(() => {
    isIncomingRingingRef.current = isIncomingRinging;
  }, [isIncomingRinging]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    dispositionModalRef.current = dispositionModal;
  }, [dispositionModal]);

  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    agentLifecycleRef.current = agentLifecycle;
  }, [agentLifecycle]);

  useEffect(() => {}, [agentLifecycle, status]);

  useEffect(() => {
    isAutomationLoadingRef.current = isAutomationLoading;
  }, [isAutomationLoading]);

  useEffect(() => {
    isCallendedRef.current = isCallended;
  }, [isCallended]);

  useEffect(() => {
    isCustomerAnsweredRef.current = isCustomerAnswered;
  }, [isCustomerAnswered]);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  useEffect(() => {
    if (status === 'start' && !isCallended) {
      setDispositionModal(false);
      setShowTimeoutModal(false);
      setIsIncomingRinging(false);
      setCallConference(false);
      setConferenceStatus(false);
    }
  }, [status]);

  useEffect(() => {
    uaRef.current = ua;
    if (ua) {
      console.log('[JsSIP] UA Instance Updated - Registered:', ua.isRegistered(), 'Connected:', ua.isConnected());
    }
  }, [ua]);

  useEffect(() => {
    readySyncLastSuccessRef.current = 0;
    readySyncInFlightRef.current = null;
    connectioncheckInFlightRef.current = false;
    connectionFailureCountRef.current = 0;
    lastAriMessageAtRef.current = 0;
    lastConnectionCheckAtRef.current = 0;
    lastSipHeartbeatAttemptAtRef.current = 0;
    sipHeartbeatFailureCountRef.current = 0;
    lastRuntimeResyncAttemptAtRef.current = 0;
  }, [username]);

  const shouldSkipReadySync = useCallback((source) => {
    const bypassSources = new Set(['sip-registered']);
    if (bypassSources.has(source)) {
      return false;
    }

    // Block if agent is on break
    const currentBreak = localStorage.getItem('selectedBreak');
    const isOnBreak = currentBreak && currentBreak !== 'Break';
    if (isOnBreak) {
      return true;
    }

    const hasProtectedSessionPhase =
      dispositionModalRef.current ||
      connectionStatusRef.current === 'Disposition' ||
      connectionStatusRef.current === 'INUSE' ||
      connectionStatusRef.current === 'Break' ||
      statusRef.current === 'calling' ||
      statusRef.current === 'on_call' ||
      statusRef.current === 'conference' ||
      Boolean(incomingSessionRef.current) ||
      isIncomingRingingRef.current ||
      agentLifecycleRef.current === 'dialing' ||
      agentLifecycleRef.current === 'ringing' ||
      agentLifecycleRef.current === 'on_call' ||
      agentLifecycleRef.current === 'disposition' ||
      isAutomationLoadingRef.current ||
      isCallendedRef.current;

    return hasProtectedSessionPhase;
  }, []);

  const syncAgentReadyState = useCallback(
    async ({ source = 'unknown', attempts = 3, retryDelayMs = 1000 } = {}) => {
      if (!username) {
        return {
          success: false,
          message: 'Missing username for agent ready sync.',
          source,
        };
      }

      if (shouldSkipReadySync(source)) {
        return {
          success: false,
          skipped: true,
          message: 'Agent ready sync skipped because the agent is still in an active or post-call phase.',
          source,
        };
      }

      if (readySyncInFlightRef.current) {
        return readySyncInFlightRef.current;
      }

      readySyncInFlightRef.current = (async () => {
        let lastResult = {
          success: false,
          message: 'Agent ready sync was not attempted.',
          source,
        };

        for (let attempt = 1; attempt <= attempts; attempt += 1) {
          lastResult = await checkUserReady();
          if (lastResult?.success) {
            readySyncLastSuccessRef.current = Date.now();
            logSystemEvent('success', 'Agent Ready Sync', `Agent runtime synced via ${source} on attempt ${attempt}`);
            return {
              ...lastResult,
              attempt,
              source,
            };
          }

          /* Log removed for production */

          if (attempt < attempts) {
            await waitForReadyRetry(retryDelayMs);
          }
        }

        logSystemEvent('error', 'Agent Ready Sync', `Agent runtime sync failed via ${source}`);
        return {
          ...lastResult,
          source,
        };
      })();

      try {
        return await readySyncInFlightRef.current;
      } finally {
        readySyncInFlightRef.current = null;
      }
    },
    [checkUserReady, logSystemEvent, shouldSkipReadySync, username, waitForReadyRetry],
  );

  const finalizePostCallContext = useCallback(() => {
    /* console.log('[WebPhone] Finalizing post-call context. Clearing bridgeID ref.'); */
    activeCallContextLoadedRef.current = false;
    activeCallContextRequestRef.current = null;
    bridgeIDRef.current = '';
    setBridgeID('');
    setActiveCallContext(null);
    setWorkspaceActiveCall(null);
    setIsSticky(false);
    // Note: setUserCall('') intentionally omitted here — userCall is retained
    // for the disposition modal and cleared by LeadAndCallInfoPanel after disposition completes
  }, [setActiveCallContext, setBridgeID, setWorkspaceActiveCall, setIsSticky]);

  const finalizeEndedCallState = useCallback(() => {
    if (pendingPostCallRef.current) {
      return;
    }

    manualHangupRequestedRef.current = false;
    pendingPostCallRef.current = true;
    setIsCustomerAnswered(false);
    callConnectedRef.current = false;
    pause();
    setStatus('start');
    setIsCallended(true);
    setAgentLifecycle('disposition');
    agentLifecycleRef.current = 'disposition';
    setConferenceNumber('');
    setCallConference(false);
    setConferenceStatus(false);
    setHasParticipants(null);
  }, [
    pause,
    setAgentLifecycle,
    setCallConference,
    setConferenceNumber,
    setConferenceStatus,
    setDispositionModal,
    setHasParticipants,
    setIsCallended,
    setIsCustomerAnswered,
    setStatus,
  ]);

  const endCurrentCall = useCallback(() => {
    manualHangupRequestedRef.current = true;
    pendingPostCallRef.current = false;

    try {
      if (session && typeof session.terminate === 'function' && session.status !== 8) {
        session.terminate();
      } else {
        finalizeEndedCallState();
      }
    } catch (error) {
      console.error('Failed to terminate current session cleanly:', error);
      finalizeEndedCallState();
    } finally {
      stopRecording();
    }
  }, [finalizeEndedCallState, session, stopRecording]);

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
          const ts = new Date().toISOString();
          const useroncallTs = Date.now();
          const payload = {
            ...(leadLockToken ? { leadLockToken } : {}),
            phoneNumber: incomingNumber || phoneNumber || '',
          };

          const response = await axios.post(`https://devapp.iotcom.io/useroncall/${username}`, payload, {
            headers: {
              ...getAuthHeaders({ 'Content-Type': 'application/json' }),
            },
          });

          const cc = response.data?.currentcalldata || {};

          if (response.status !== 200) {
            throw new Error('Failed to process call');
          }

          const newBridgeID = response.data.currentcalldata?.bridgeID || '';
          /* console.log('[WebPhone] Context loaded. Setting bridgeID:', newBridgeID); */
          bridgeIDRef.current = newBridgeID;
          setBridgeID(newBridgeID);
          // Backend may return stale contact data when calls arrive simultaneously
          if (incomingNumber && response.data.currentcalldata) {
            const apiCaller =
              response.data.currentcalldata?.Caller || response.data.currentcalldata?.contactNumber || '';
            if (apiCaller && apiCaller !== incomingNumber) {
              console.warn(
                `[CallGuard] currentcalldata — FIXING caller mismatch: API returned ${apiCaller}, actual incoming=${incomingNumber}`,
              );
              response.data.currentcalldata.Caller = incomingNumber;
              response.data.currentcalldata.contactNumber = incomingNumber;
            }
          }
          setActiveCallContext(response.data.currentcalldata || null);
          if (response.data.contactData) {
            const apiContactNum = response.data.contactData?.contactNumber;
            // Backend may return stale/wrong contactNumber when calls arrive simultaneously
            if (incomingNumber && apiContactNum && apiContactNum !== incomingNumber) {
              console.warn(
                `[CallGuard] setUserCall — FIXING contactNumber mismatch: API returned ${apiContactNum}, actual incoming=${incomingNumber}`,
              );
              response.data.contactData.contactNumber = incomingNumber;
            }
            console.log(
              `[CallGuard] setUserCall — contactNumber=${response.data.contactData?.contactNumber || 'unknown'}, incomingNumber=${incomingNumber}`,
            );
            setUserCall(response.data.contactData);
          }
          if (!pendingPostCallRef.current) {
            setAgentLifecycle('on_call');
          } else if (agentLifecycleRef.current === 'idle') {
            pendingPostCallRef.current = false;
          }
          setConferenceStatus(false);

          // Initialize shared sticky state
          const stickyByAgent =
            response.data.currentcalldata?.stickyAgent === username ||
            response.data.contactData?.stickyAgent === username ||
            response.data.currentcalldata?.isSticky === true ||
            response.data.contactData?.isSticky === true;
          setIsSticky(!!stickyByAgent);

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

  const clearRejectedCall = useCallback(
    async (callerNumber) => {
      if (!callerNumber || callerNumber === 'unknown') {
        console.warn('[CallGuard] Skipping clearRejectedCall — invalid caller number');
        return;
      }
      try {
        console.log(`[CallGuard] Requesting clearRejectedCallFromAgent for ${callerNumber}...`);
        const response = await axios.post(
          `https://devapp.iotcom.io/clearRejectedCallFromAgent`,
          { caller: callerNumber },
          {
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          },
        );
        console.log(`[CallGuard] clearRejectedCallFromAgent response:`, response.data);
      } catch (error) {
        console.error(
          `[CallGuard] clearRejectedCallFromAgent failed for ${callerNumber}:`,
          error?.response?.data || error?.message || error,
        );
      }
    },
    [getAuthHeaders],
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const isOnCall = status === 'on_call' || agentLifecycle === 'on_call';

      if (isOnCall) {
        // Mark in sessionStorage so post-reload we know to force logout
        sessionStorage.setItem('was_on_call', 'true');
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, agentLifecycle]);

  const [fupRefreshKey, setFupRefreshKey] = useState(0);

  useEffect(() => {
    // Refresh every minute to update badge as call times approach the 5-min window
    const timer = setInterval(() => {
      setFupRefreshKey((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!followUpDispoes || followUpDispoes.length === 0) {
      setScheduleCallsLength(0);
      return;
    }

    const processed = followUpDispoes
      .map((item, index) => {
        let scheduledAtMs = null;
        const numericValue = Number(item.scheduledAt);

        if (Number.isFinite(numericValue) && numericValue > 0) {
          scheduledAtMs = String(Math.trunc(Math.abs(numericValue))).length <= 10 ? numericValue * 1000 : numericValue;
        } else {
          const parsedMoment = moment(
            `${item.date || ''} ${item.time || ''}`,
            ['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss'],
            true,
          );
          if (parsedMoment.isValid()) {
            scheduledAtMs = parsedMoment.valueOf();
          }
        }

        const callTime = scheduledAtMs ? new Date(scheduledAtMs) : null;

        return {
          ...item,
          callTime,
          id: item._id || item.id || `fup-${index}`,
        };
      })
      .filter((item) => item.callTime !== null);

    const activeFollowUps = processed.filter((item) => {
      const normalizedStatus = String(item.status || item.computedStatus || '')
        .trim()
        .toLowerCase();
      // Exclude completed follow-ups
      if (normalizedStatus === 'completed') return false;

      const callMoment = moment(item.callTime);

      // Match 'today' / 'pending' tab: scheduled for today's date
      return callMoment.isSame(moment(), 'day');
    });

    setScheduleCallsLength(activeFollowUps.length);
  }, [followUpDispoes, setScheduleCallsLength, fupRefreshKey]);

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

  const connectioncheck = useCallback(
    async ({ reason = 'manual', force = false } = {}) => {
      if (connectioncheckInFlightRef.current) {
        return false;
      }

      const now = Date.now();
      const hasRecentAriHeartbeat =
        lastAriMessageAtRef.current > 0 && now - lastAriMessageAtRef.current <= MESSAGE_HEARTBEAT_STALE_MS;
      const hasProtectedSessionPhase =
        dispositionModal ||
        connectionStatus === 'Disposition' ||
        status === 'calling' ||
        status === 'conference' ||
        Boolean(incomingSession) ||
        isIncomingRinging ||
        agentLifecycle === 'dialing' ||
        agentLifecycle === 'ringing' ||
        agentLifecycle === 'on_call' ||
        agentLifecycle === 'disposition' ||
        isAutomationLoading;

      if (!force) {
        if (reason === 'interval' && hasRecentAriHeartbeat) {
          return false;
        }

        if (reason === 'interval' && now - lastConnectionCheckAtRef.current < CONNECTION_CHECK_MIN_REQUEST_GAP_MS) {
          return false;
        }
      }

      try {
        connectioncheckInFlightRef.current = true;
        lastConnectionCheckAtRef.current = now;

        if (readySyncLastSuccessRef.current === 0) {
          if (!isUARegistered()) {
            return false;
          }

          const readySync = await syncAgentReadyState({
            source: `connectioncheck-${reason}`,
            attempts: 2,
            retryDelayMs: 500,
          });

          if (!readySync?.success) {
            return false;
          }
        }

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
          /* console.error('Campaign information missing in token data'); */
          return false;
        }

        const campaign = parsedTokenData.userData.campaign;

        const userconTs = Date.now();
        const response = await withTimeout(
          axios.post(
            `https://devapp.iotcom.io/userconnection`,
            { user: username },
            { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) },
          ),
          CONNECTION_CHECK_TIMEOUT_MS,
        );

        const data = response.data;

        // ✅ 1. Poor connection - don't set userLogin, allow re-connect
        if (data.message === 'poor connection problem ,please login again') {
          /* console.warn('⚠️ Poor connection detected from server'); */

          if (status === 'start' && !dispositionModal) {
            setTimeoutMessage('Poor connection problem. Please login again.');
            setShowTimeoutModal(true);

            return true;
          }
          return false;
        }

        // ✅ 2. Force logout - set userLogin to true
        if (response.status === 401 || !data.isUserLogin) {
          /* console.warn('⚠️ Authentication failure detected'); */

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
        setCurrentCallqueueCount(data.currentCallqueueCount !== undefined ? data.currentCallqueueCount : 0);

        // Update agent lifecycle based on status
        if (data.status === 'Disposition') {
          setAgentLifecycle((prev) => (prev === 'lead_locked' || prev === 'on_call' ? prev : 'disposition'));
        } else if (data.status === 'INUSE') {
          if (!pendingPostCallRef.current && activeCallRef.current) {
            setAgentLifecycle('on_call');
          }
        } else if (data.status === 'NOT_INUSE' || data.status === 'UNAVAILABLE') {
          if (!pendingPostCallRef.current) {
            setAgentLifecycle(leadLockToken ? 'lead_locked' : 'idle');
          }
        }

        // ✅ 4. Handle other connection issues
        if (data.message !== 'ok connection for user') {
          /* console.warn('⚠️ Connection issue:', data.message); */

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

        // ✅ 6. Update queue details (skip if a call is already active to prevent overwriting active call data)
        if (!activeCallRef.current) {
          if (data.currentCallqueue?.length > 0) {
            if (
              Array.isArray(data.currentCallqueue[0].queueDetail) &&
              data.currentCallqueue[0].queueDetail.length > 0
            ) {
              setQueueDetails(data.currentCallqueue[0].queueDetail);
            } else {
              setQueueDetails([]);
            }
            setHasTransfer(data.currentCallqueue[0].queueTransfered === true);
            setCurrentCallData(data.currentCallqueue[0]);
          } else {
            setQueueDetails([]);
            setHasTransfer(false);
            setCurrentCallData(null);
          }
        }

        // ✅ 7. Handle ringtone/incoming calls (always process — call may already be live via SIP)
        if (data.currentCallqueue?.length > 0) {
          if (campaign === data.currentCallqueue[0].campaign) {
            setRingtone(data.currentCallqueue);
            setInNotification(data.currentCallqueue.map((call) => call.Caller || data.currentCallqueue[0].Caller));
          } else {
            setRingtone([]);
          }
        } else {
          setRingtone([]);
        }

        // ✅ 8. Connection successful
        if (status === 'start') {
          setIsConnectionLost(false);
        }
        return false;
      } catch (err) {
        // ✅ 9. Handle errors
        console.error('Connection check error:', err);
        return await handleConnectionError(err, { hasRecentAriHeartbeat, hasProtectedSessionPhase });
      } finally {
        connectioncheckInFlightRef.current = false;
      }
    },
    [
      agentLifecycle,
      connectionStatus,
      dispositionModal,
      getAuthHeaders,
      incomingSession,
      isAutomationLoading,
      isIncomingRinging,
      isUARegistered,
      leadLockToken,
      setAgentLifecycle,
      setConnectionStatus,
      setCurrentCallData,
      setFollowUpDispoes,
      setHasTransfer,
      setInNotification,
      setIsConnectionLost,
      setQueueDetails,
      setRingtone,
      setShowTimeoutModal,
      setTimeoutMessage,
      setUserLogin,
      status,
      syncAgentReadyState,
      username,
    ],
  );

  const sendSipHeartbeat = useCallback(
    async ({ source = 'interval', force = false, minGapMs = SIP_HEARTBEAT_MIN_GAP_MS } = {}) => {
      if (!username) {
        return false;
      }

      const currentUa = uaRef.current;
      if (!currentUa) {
        return false;
      }

      const now = Date.now();
      if (!force && now - lastSipHeartbeatAttemptAtRef.current < minGapMs) {
        return false;
      }

      const wsStatus = getWebSocketStatus();
      if (!wsStatus.connected || !isUARegistered()) {
        return false;
      }

      lastSipHeartbeatAttemptAtRef.current = now;

      return await new Promise((resolve) => {
        let settled = false;
        const finalize = (value) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        };

        const guardId = window.setTimeout(() => finalize(false), 4000);

        try {
          currentUa.sendMessage(
            'heartbeat',
            JSON.stringify({
              body: 'webphone-heartbeat',
              source,
              timestamp: now,
            }),
            {
              contentType: 'application/json',
              eventHandlers: {
                succeeded: () => {
                  window.clearTimeout(guardId);
                  sipHeartbeatFailureCountRef.current = 0;
                  finalize(true);
                },
                failed: () => {
                  window.clearTimeout(guardId);
                  sipHeartbeatFailureCountRef.current += 1;

                  if (now - lastAriMessageAtRef.current > MESSAGE_HEARTBEAT_STALE_MS) {
                    setIsConnectionLost(true);
                  }

                  finalize(false);
                },
              },
            },
          );
        } catch (error) {
          window.clearTimeout(guardId);
          sipHeartbeatFailureCountRef.current += 1;

          if (now - lastAriMessageAtRef.current > MESSAGE_HEARTBEAT_STALE_MS) {
            setIsConnectionLost(true);
          }

          finalize(false);
        }
      });
    },
    [getWebSocketStatus, isUARegistered, setIsConnectionLost, username],
  );

  useEffect(() => {
    connectioncheckRef.current = connectioncheck;
  }, [connectioncheck]);

  const handleLogout = async (token, message) => {
    try {
      if (token) {
        await axios.delete(`https://devapp.iotcom.io/deleteFirebaseToken`, {
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
    setCurrentCallqueueCount(0);
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
    setCurrentCallqueueCount(0);
  };

  // Helper function for error handling
  const handleConnectionError = async (
    err,
    { hasRecentAriHeartbeat = false, hasProtectedSessionPhase = false } = {},
  ) => {
    console.error('Error during connection check:', err);
    setCurrentCallqueueCount(0);

    if (err.response?.status === 401) {
      connectionFailureCountRef.current += 1;
      setIsConnectionLost(true);

      if (!hasProtectedSessionPhase && connectionFailureCountRef.current >= 2) {
        setTimeoutMessage('');
        setShowTimeoutModal(true);
        setUserLogin(true);
        toast.error('Session expired. Please log in again.');
      }

      return false;
    }

    if (err.message === 'Timeout') {
      console.error('Connection timed out');
      addTimeout('timeout');

      if (hasRecentAriHeartbeat) {
        return false;
      }

      connectionFailureCountRef.current += 1;
      setIsConnectionLost(true);

      if (!hasProtectedSessionPhase && Date.now() - lastConnectionToastAtRef.current > 15000) {
        lastConnectionToastAtRef.current = Date.now();
        toast.error('Server appears to be unresponsive. Retrying...');
      }

      if (!hasProtectedSessionPhase && connectionFailureCountRef.current >= 2) {
        setTimeoutMessage('Connection to telephony session was lost. Please reconnect.');
        setShowTimeoutModal(true);
      }
      return false;
    }

    if (err.message.includes('Network')) {
      console.error('Network error:', err.message);
      addTimeout('network');

      if (hasRecentAriHeartbeat) {
        return false;
      }

      connectionFailureCountRef.current += 1;
      setIsConnectionLost(true);

      if (!hasProtectedSessionPhase && Date.now() - lastConnectionToastAtRef.current > 15000) {
        lastConnectionToastAtRef.current = Date.now();
        toast.error('Network error. Please check your connection.');
      }

      if (!hasProtectedSessionPhase && connectionFailureCountRef.current >= 2) {
        setTimeoutMessage('Connection to telephony session was lost. Please reconnect.');
        setShowTimeoutModal(true);
      }
      return false;
    }

    if (!hasRecentAriHeartbeat) {
      setIsConnectionLost(true);

      if (!hasProtectedSessionPhase && Date.now() - lastConnectionToastAtRef.current > 15000) {
        lastConnectionToastAtRef.current = Date.now();
        toast.error('Connection check failed. Please try again.');
      }
    }

    return false;
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
      const remoteUser = e?.session?.remote_identity?.uri?.user || session?.remote_identity?.uri?.user || 'unknown';
      const callId = e?.session?.call_id || session?.call_id || 'unknown';
      logSessionEvent('failed', { sessionId: callId, remoteUser, direction: session?.direction || 'unknown' });
      setStatus('fail');
      setAgentLifecycle(leadLockToken ? 'lead_locked' : 'idle');
      // setPhoneNumber('');
      if (isRecording) {
        stopRecording();
      }
      setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], status: 'Fail', start: 0, end: 0 }]);
    },

    confirmed: function (e) {
      const remoteUser = e?.session?.remote_identity?.uri?.user || session?.remote_identity?.uri?.user || 'unknown';
      const callId = e?.session?.call_id || session?.call_id || 'unknown';
      logSessionEvent('confirmed', { sessionId: callId, remoteUser, direction: session?.direction || 'unknown' });
      pendingPostCallRef.current = false;
      reset(undefined, true);
      startRecording();
      setStatus('on_call');
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
      void connectioncheck({ reason: 'refresh', force: true });
    };

    window.addEventListener('refreshFollowUps', handleRefreshFollowUps);
    return () => {
      window.removeEventListener('refreshFollowUps', handleRefreshFollowUps);
    };
  }, [connectioncheck]);

  useEffect(() => {
    if (!username) {
      return undefined;
    }

    void connectioncheck({ reason: 'initial', force: true });
    const heartbeatInterval = setInterval(() => {
      void connectioncheck({ reason: 'interval' });
    }, CONNECTION_CHECK_SCHEDULER_MS);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [connectioncheck, username]);

  const answerIncomingCall = async () => {
    if (incomingSession) {
      try {
        stopRingtone(); // Stop ringtone when call is answered
        if (incomingSession.isAutoRejected) {
          console.log('[CallGuard] BLOCKED answerIncomingCall — session was auto-rejected');
          setIncomingSession(null);
          setIsIncomingRinging(false);
          return;
        }
        console.log(`[CallGuard] answerIncomingCall for ${incomingSession?.remote_identity?.uri?.user || 'unknown'}`);
        callConnectedRef.current = false;
        activeCallRef.current = incomingSession;
        setCallHandled(true);
        callHandledRef.current = true;
        incomingSession.answer(options);
        setSession(incomingSession);
        setIncomingSession(null);
        setIsIncomingRinging(false);
        pendingPostCallRef.current = false;
        setStatus('calling');
        setAgentLifecycle('on_call');
        setCallType('incoming');
        setSelectedBreak('Break');
        localStorage.removeItem('selectedBreak');
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
    const remoteUser = incomingSession?.remote_identity?.uri?.user || 'unknown';
    const callId = incomingSession?.call_id || incomingSession?.id || 'unknown';
    console.log(
      `[CallGuard] Call MANUAL REJECTED by agent — remoteUser=${remoteUser} | callId=${callId} | releasing lock`,
    );
    activeCallRef.current = null;

    if (incomingSession && incomingSession.status < 6) {
      incomingSession.terminate();
    }
    void clearRejectedCall(remoteUser);
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
    void syncAgentReadyState({ source: 'rejectIncomingCall', attempts: 2, retryDelayMs: 500 });
  };

  useEffect(() => {
    if (!username || !password || !origin) {
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
        console.log('[JsSIP] UA created', {
          configuration: { ...configuration, password: configuration.password ? '***' : undefined },
          uaStatus: ua.isConnected(),
          sessions: ua.sessions,
          ua,
        });
        ua.start();

        ua.on('connected', (e) => {});

        ua.on('disconnected', (e) => {
          console.warn('[JsSIP] Disconnected from WebSocket', e);
        });

        ua.on('registered', async (data) => {
          // If user forcibly reloaded while on call → force logout
          if (sessionStorage.getItem('was_on_call') === 'true') {
            sessionStorage.removeItem('was_on_call');

            if (session && session.status < 6) {
              session.terminate();
            }
            stopRecording();
            localStorage.removeItem('token');
            localStorage.removeItem('savedUsername');
            localStorage.removeItem('savedPassword');
            localStorage.removeItem('call-history');
            localStorage.removeItem('selectedBreak');
            window.location.href = '/webphone/v1/login';
            return;
          }

          const readySync = await syncAgentReadyState({
            source: 'sip-registered',
            attempts: 4,
            retryDelayMs: 1000,
          });

          if (!readySync?.success) {
            console.error('[WebPhone] Agent session sync failed after SIP registration:', readySync?.message);
            setTimeoutMessage('Agent session could not be restored. Please log in again.');
            setShowTimeoutModal(true);
            return;
          }

          void sendSipHeartbeat({ source: 'sip-registered', force: true });

          const storedBreak = localStorage.getItem('selectedBreak');
          if (storedBreak && storedBreak !== 'Break') {
            try {
              await new Promise((resolve) => setTimeout(resolve, 1000));

              const response = await axios.post(
                `https://devapp.iotcom.io/user/breakuser:${username}`,
                { breakType: storedBreak },
                { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) },
              );
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
            localStorage.removeItem('selectedBreak');
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith('breakStartTime_')) {
                localStorage.removeItem(key);
              }
            });
            setSelectedBreak('Break');
          }

          void connectioncheckRef.current?.({ reason: 'post-ready', force: true });
        });

        ua.on('newMessage', (e) => {
          if (e.originator === 'local') {
            return;
          }

          const message = e.request?.body || '';

          lastAriMessageAtRef.current = Date.now();
          connectionFailureCountRef.current = 0;
          sipHeartbeatFailureCountRef.current = 0;
          setIsConnectionLost(false);
          // void sendSipHeartbeat({ source: 'incoming-message' }); // DISABLED as it may interfere with SIP signaling
          /* console.log(message, 'message'); */
          // Always run connection check as per request
          void connectioncheck({ reason: 'sip-message' });
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
            const hasPendingIncomingRingingSession =
              Boolean(incomingSessionRef.current) &&
              isIncomingRingingRef.current &&
              statusRef.current === 'incoming' &&
              !callHandledRef.current;

            if (hasPendingIncomingRingingSession) {
              rejectIncomingCall();
            } else {
              // Ignore
            }
          }
          // ✅ Check if customer/agent channel answered (both enable Add Call button)
          else if (message.includes('customer channel answered') || message.includes('agent channel answered')) {
            callConnectedRef.current = true;
            setIsCustomerAnswered(true);
            // Also update participant status if it's the customer channel
            if (message.includes('customer channel answered')) {
              handleConferenceMessage(message);
            }

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
        });

        ua.on('registrationFailed', (data) => {
          console.error('[JsSIP] Registration failed:', data.cause, data);
          toast.error('Registration failed');
        });

        ua.on('unregistered', (data) => {
          console.warn('[JsSIP] Unregistered:', data.cause);
        });

        ua.on('stopped', () => {
          console.log('[JsSIP] UA Stopped');
          toast.error('Connection stopped');
        });

        ua.on('disconnected', () => {
          toast.error('Connection lost');
        });
        ua.on('newRTCSession', function (e) {
          const session = e.session;
          const remoteUser = session?.remote_identity?.uri?.user || 'unknown';
          const callId = session.call_id || session.id || 'unknown';

          logSessionEvent('created', {
            sessionId: callId,
            remoteUser,
            direction: session.direction || 'unknown',
          });

          // Log all active sessions for debugging
          const allSessions = ua.sessions || {};
          const sessionIds = Object.keys(allSessions);
          console.log(
            `[CallGuard] newRTCSession — new=${remoteUser}, dir=${session.direction}, totalSessions=${sessionIds.length}, activeLock=${!!activeCallRef.current}`,
          );

          // Guard: only one call at a time or agent in post-call disposition
          // Primary: activeCallRef (reliable), Secondary: agentLifecycleRef (blocks during disposition), Tertiary: ua.sessions (JsSIP built-in)
          if (activeCallRef.current || agentLifecycleRef.current === 'disposition' || sessionIds.length > 1) {
            console.log(
              `[CallGuard] AUTO-REJECTING incoming from ${remoteUser} — already on call or in disposition (activeLock=${!!activeCallRef.current}, lifecycle=${agentLifecycleRef.current}, ua.sessions=${sessionIds.length}, sessionId=${callId})`,
            );
            session.isAutoRejected = true;
            session.isAcceptedCall = false;
            session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
            logSessionEvent('failed', {
              sessionId: callId,
              remoteUser,
              direction: session.direction,
              cause: 'auto-rejected',
            });
            void clearRejectedCall(remoteUser);
            return;
          }

          // Assign this session as the active call
          activeCallRef.current = session;
          session.isAcceptedCall = true;
          console.log(
            `[CallGuard] Lock ACQUIRED — ${session.direction} from ${remoteUser}, session=${session.id || session.call_id || 'unknown'}`,
          );

          // Immediately mark agent as busy to prevent PBX from sending more calls
          pendingPostCallRef.current = false;
          setConnectionStatus('INUSE');
          connectionStatusRef.current = 'INUSE';
          setAgentLifecycle('on_call');
          agentLifecycleRef.current = 'on_call';
          // Start stopwatch now so CallScreen shows timer, not "Calling...", while async autodial check runs
          reset(undefined, true);

          // Load active call context (deduplicated) instead of sending a separate notify
          // This uses `ensureActiveCallContextLoaded` which guards against duplicate in-flight requests
          const notifyTs = new Date().toISOString();

          void ensureActiveCallContextLoaded({ incomingNumber: remoteUser, addIncomingHistory: false }).catch((err) =>
            console.error(`[API] useroncall (load) → FAILED | ts=${notifyTs} | error=`, err?.message || err),
          );

          console.log(`[CallGuard] Registered cleanup for accepted session (${remoteUser})`);

          // Register cleanup handlers — skip if this was an auto-rejected session
          session.on('failed', (failData) => {
            if (session.isAutoRejected) {
              console.log(`[CallGuard] Ignored failed from auto-rejected session (${remoteUser})`);
              return;
            }
            console.log(
              `[CallGuard] Session FAILED — releasing lock (${remoteUser}) | callId=${callId} | direction=${session.direction} | cause=${failData?.cause || 'unknown'} | origin=${failData?.origin || 'unknown'}`,
            );
            logSessionEvent('failed', {
              sessionId: callId,
              remoteUser,
              direction: session.direction,
              cause: 'cleanup',
            });
            activeCallRef.current = null;
            finalizeEndedCallState();
          });
          session.once('ended', () => {
            console.log(
              `[CallGuard] Session ENDED — releasing lock (${remoteUser}) | callId=${callId} | direction=${session.direction}`,
            );
            activeCallRef.current = null;
            finalizeEndedCallState();
          });

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
                  await syncAgentReadyState({
                    source: 'autodial-refresh',
                    attempts: 2,
                    retryDelayMs: 500,
                  });
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

                  // SAFETY: Verify this session is still the accepted active call
                  if (activeCallRef.current !== e.session) {
                    console.log(
                      `[CallGuard] SKIPPING .then() — session no longer active (${e.session?.remote_identity?.uri?.user || 'unknown'})`,
                    );
                    return;
                  }

                  // Continue with normal mobile incoming call flow
                  if (isMobile) {
                    // Mobile: Show UI with ringtone
                    const incomingNumber = e.request.from._uri._user;
                    console.log(`[CallGuard] Setting incoming UI for ${incomingNumber}`);
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

                    e.session.once('ended', () => {
                      console.log(
                        `[CallGuard] Mobile incoming session ENDED | remoteUser=${remoteUser} | callId=${callId}`,
                      );
                      logSessionEvent('ended', {
                        sessionId: callId,
                        remoteUser,
                        direction: 'incoming',
                        cause: 'mobile-ended',
                      });
                      stopRingtone();
                      void syncAgentReadyState({
                        source: 'incoming-session-ended',
                        attempts: 2,
                        retryDelayMs: 500,
                      });
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
                      setCallHandled(false);
                      callHandledRef.current = false;
                      setConferenceNumber('');
                    });

                    e.session.on('failed', (failData) => {
                      console.log(
                        `[CallGuard] Mobile incoming session FAILED | remoteUser=${remoteUser} | callId=${callId} | cause=${failData?.cause || 'unknown'} | origin=${failData?.origin || 'unknown'}`,
                      );
                      logSessionEvent('failed', {
                        sessionId: callId,
                        remoteUser,
                        direction: 'incoming',
                        cause: 'mobile-failed',
                      });
                      stopRingtone();
                      const shouldRestoreReadyState = !callHandledRef.current;
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

                      if (shouldRestoreReadyState) {
                        void syncAgentReadyState({
                          source: 'incoming-session-failed',
                          attempts: 2,
                          retryDelayMs: 500,
                        });
                      }
                    });
                  } else {
                    // Desktop: Check if user is away and show notification before auto-answer
                    const incomingNumber = e.request.from._uri._user;

                    // Always trigger notification check (will only show if user is away)
                    setInNotification(incomingNumber);

                    // Auto-answer the call (existing logic)
                    console.log(`[CallGuard] Auto-answering desk call from ${incomingNumber}`);
                    handleIncomingCall(e.session, e.request, { addIncomingHistory: true });
                  }
                })
                .catch((error) => {
                  console.error('Error in autodial check:', error);
                  // Fallback to normal incoming call flow on error
                  if (activeCallRef.current !== e.session) {
                    console.log(
                      `[CallGuard] SKIPPING .catch() — session no longer active (${e.session?.remote_identity?.uri?.user || 'unknown'})`,
                    );
                    return;
                  }
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
            callConnectedRef.current = false;

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
              logSessionEvent('confirmed', { sessionId: callId, remoteUser, direction: 'outgoing' });
              pendingPostCallRef.current = false;
              callConnectedRef.current = true;
              reset(undefined, true);
              startRecording();
              void ensureActiveCallContextLoaded({ incomingNumber: remoteUser });
              setStatus('on_call');
              setAgentLifecycle('on_call');
              setIsCustomerAnswered(true);
              setHistory((prev) => [
                ...prev.slice(0, -1),
                {
                  ...prev[prev.length - 1],
                  status: 'Success',
                  start: new Date().getTime(),
                },
              ]);
            });

            e.session.once('ended', () => {
              console.log(`[CallGuard] Outgoing session ENDED | remoteUser=${remoteUser} | callId=${callId}`);
              logSessionEvent('ended', { sessionId: callId, remoteUser, direction: 'outgoing', cause: 'ended' });
              if (isRecordingRef.current) {
                stopRecording();
              }
              setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: Date.now() }]);
              finalizeEndedCallState();
            });

            e.session.on('failed', (failData) => {
              console.log(
                `[CallGuard] Outgoing session FAILED | remoteUser=${remoteUser} | callId=${callId} | cause=${failData?.cause || 'unknown'} | origin=${failData?.origin || 'unknown'}`,
              );
              logSessionEvent('failed', { sessionId: callId, remoteUser, direction: 'outgoing', cause: 'failed' });
              const manualHangupRequested = manualHangupRequestedRef.current;
              finalizePostCallContext();
              if (isRecording) {
                stopRecording();
              }

              if (manualHangupRequested) {
                setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: Date.now() }]);
                finalizeEndedCallState();
                return;
              }

              manualHangupRequestedRef.current = false;
              setStatus('fail');
              setAgentLifecycle(leadLockToken ? 'lead_locked' : 'idle');
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
      const incomingNumber = normalizePhone(request.from._uri._user);
      const sessionId = session.call_id || session.id || 'unknown';
      // SAFETY: Never process an auto-rejected session
      if (session.isAutoRejected) {
        console.log(`[CallGuard] BLOCKED handleIncomingCall for rejected session (${incomingNumber})`);
        return;
      }
      if (session.isAcceptedCall) {
        console.log(
          `[CallGuard] handleIncomingCall: answering ${incomingNumber}, session=${session.id || session.call_id || 'unknown'}`,
        );
      } else {
        console.log(`[CallGuard] handleIncomingCall: answering ${incomingNumber} (no accepted tag)`);
      }
      callConnectedRef.current = false;
      pendingPostCallRef.current = false;

      session.answer(options); // Auto-answers (good for outgoing)
      setSession(session);
      setStatus('calling');
      setAgentLifecycle('on_call');
      setSelectedBreak('Break');
      localStorage.removeItem('selectedBreak');
      // Show the number immediately while API call populates full contact data
      setPhoneNumber(incomingNumber);
      reset(undefined, startTimerImmediately);
      void ensureActiveCallContextLoaded({ incomingNumber, addIncomingHistory });

      session.once('confirmed', () => {
        logSessionEvent('confirmed', { sessionId, remoteUser: incomingNumber, direction: 'incoming' });
        callConnectedRef.current = true;
        setIsCustomerAnswered(true);
        if (!startTimerImmediately) {
          reset(undefined, true);
        }
        setStatus('on_call');
      });

      session.connection.addEventListener('addstream', (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.stream;
        }
      });

      // Your existing event listeners...
      session.once('ended', () => {
        console.log(
          `[CallGuard] handleIncomingCall session ENDED | remoteUser=${incomingNumber} | sessionId=${sessionId}`,
        );
        if (isRecording) {
          stopRecording();
        }
        logSessionEvent('ended', { sessionId, remoteUser: incomingNumber, direction: 'incoming', cause: 'ended' });
        setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: new Date().getTime() }]);
        finalizeEndedCallState();
      });

      session.once('failed', (failData) => {
        console.log(
          `[CallGuard] handleIncomingCall session FAILED | remoteUser=${incomingNumber} | sessionId=${sessionId} | cause=${failData?.cause || 'unknown'} | origin=${failData?.origin || 'unknown'}`,
        );
        logSessionEvent('failed', { sessionId, remoteUser: incomingNumber, direction: 'incoming', cause: 'failed' });
        const manualHangupRequested = manualHangupRequestedRef.current;
        finalizePostCallContext();
        if (manualHangupRequested) {
          setHistory((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], end: new Date().getTime() }]);
          finalizeEndedCallState();
          return;
        }

        setHistory((prev) => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], end: new Date().getTime(), status: 'Fail' },
        ]);
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
      const currentUa = uaRef.current;
      if (currentUa && currentUa.transport && currentUa.transport.socket) {
        const socketState = currentUa.transport.socket.readyState;

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

      const activeUa = uaRef.current;
      if (activeUa) {
        try {
          activeUa.stop();
        } catch (error) {
          console.error('Error stopping UA:', error);
        }
      }
    };
  }, [origin, password, sendSipHeartbeat, syncAgentReadyState, username]);

  useEffect(() => {
    if (!ua || !username) {
      return undefined;
    }

    void sendSipHeartbeat({ source: 'ua-ready', force: true });

    const heartbeatId = setInterval(() => {
      void sendSipHeartbeat({ source: 'interval' });
    }, SIP_HEARTBEAT_SEND_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendSipHeartbeat({ source: 'visibility', force: true });
      }
    };

    const handleOnline = () => {
      void sendSipHeartbeat({ source: 'online', force: true });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(heartbeatId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [sendSipHeartbeat, ua, username]);

  const handleCall = async (formattedNumber, metadata = {}) => {
    // ✅ 1. Early return - Check connection status
    if (isConnectionLost) {
      toast.error('Connection lost. Please check your internet connection.');
      return;
    }

    const targetNumber = phoneNumber || formattedNumber;
    const nextLead = metadata?.lead;
    const nextLeadLockToken = metadata?.leadLockToken;
    const isOnBreakAtDialStart = selectedBreak && selectedBreak !== 'Break';
    callConnectedRef.current = false;

    try {
      // ✅ 2. Remove break if user is on break and initiating an outgoing call.
      if (isOnBreakAtDialStart) {
        try {
          await axios.post(
            `https://devapp.iotcom.io/user/removebreakuser:${username}`,
            {},
            { headers: getAuthHeaders() },
          );
        } catch (breakErr) {
          console.warn('Failed to remove break on server:', breakErr);
        }
        setSelectedBreak('Break');
        localStorage.removeItem('selectedBreak');
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('breakStartTime_')) {
            localStorage.removeItem(key);
          }
        });
        setConnectionStatus('INUSE');
        setStatus('calling');
        setAgentLifecycle('on_call');
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

      // ✅ 6. Clear any stale channel for this number before dialing
      await clearRejectedCall(targetNumber);

      // ✅ 7. Check if usurped by an incoming call (e.g., queued call dispatched after break removal or during clearRejectedCall await)
      if (
        agentLifecycleRef.current === 'ringing' ||
        agentLifecycleRef.current === 'on_call' ||
        activeCallRef.current != null
      ) {
        console.warn('⚠️ Skipping dial — already handling an incoming call.');
        setStatus('start');
        setPhoneNumber('');
        dialingNumberRef.current = '';
        setCallType('');
        setAgentLifecycle(nextLeadLockToken ? 'lead_locked' : 'idle');
        return;
      }

      const dialPayload = {
        receiver: targetNumber,
        ...(nextLead ? { leadId: nextLead.leadId } : {}),
        ...(nextLeadLockToken ? { leadLockToken: nextLeadLockToken } : {}),
        dialSource: metadata?.dialSource,
        autoLeadDial: metadata?.autoLeadDial,
      };

      const response = await axios.post(`https://devapp.iotcom.io/dialnumber`, dialPayload, {
        headers: {
          ...getAuthHeaders({
            'Content-Type': 'application/json',
            'X-User-ID': username,
          }),
        },
        timeout: 10000,
      });

      // ✅ 7. Check response for errors even if status is 200
      if (response.data && !response.data.success) {
        const isCallUsurped =
          agentLifecycleRef.current === 'ringing' ||
          agentLifecycleRef.current === 'on_call' ||
          activeCallRef.current != null;

        if (isCallUsurped) {
          console.warn('⚠️ handleCall failed, but ignoring because an incoming call is already active.');
          return;
        }

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
      const responseLeadLockToken = response.data?.leadLockToken;
      if (responseLeadLockToken) {
        setLeadLockToken(responseLeadLockToken);
      }
    } catch (error) {
      console.error('❌ Call initiation error:', error);

      const isCallUsurped =
        agentLifecycleRef.current === 'ringing' ||
        agentLifecycleRef.current === 'on_call' ||
        activeCallRef.current != null;

      if (isCallUsurped) {
        console.warn('⚠️ handleCall errored, but ignoring because an incoming call is already active.');
        return;
      }

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
    if (!isCallended) return;
    if (callendedInFlightRef.current) {
      return;
    }

    callendedInFlightRef.current = true;

    const callApi = async () => {
      setIsAutomationLoading(true);
      let keepPostCallContext = false;
      try {
        // 1. Call callended API
        const callendedTs = new Date().toISOString();
        const callendedPayload = {
          ...(leadLockToken ? { leadLockToken } : {}),
          callType: callType || '',
          isMerged: !!isMerged,
        };

        const callendedUrl = `https://devapp.iotcom.io/user/callended${username}`;

        const callendedResponse = await axios.post(callendedUrl, callendedPayload, {
          headers: {
            ...getAuthHeaders({ 'Content-Type': 'application/json' }),
          },
        });

        const tokenPayload = getStoredTokenPayload();
        const isDispositionEnabled = tokenPayload?.userData?.disposition !== false;

        if (isMobile || !isDispositionEnabled) {
          // 2. On Mobile or when disposition is disabled, perform SILENT auto-disposition
          try {
            const dispoUrl = `https://devapp.iotcom.io/user/disposition${username}`;
            const finalBridgeID = bridgeIDRef.current || bridgeID;
            const dispoPayload = {
              bridgeID: finalBridgeID || 'deadCallId',
              Disposition: 'Auto Disposed',
              autoDialDisabled: false,
              leadId: activeCallContext?.leadId || undefined,
              leadLockToken: leadLockToken || undefined,
              contactNumber: phoneNumber || '',
            };

            await axios.post(dispoUrl, dispoPayload, {
              headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            });
          } catch (dispoError) {
            console.error('[autoDispo] FAILED:', dispoError.response?.data || dispoError.message);
          }

          // 3. Reset to IDLE / Home Screen instantly

          setIsHeld(false);
          setIsCallended(false);
          setActiveLead(null);
          setLeadLockToken('');
          setAgentLifecycle('idle');
          setDispositionModal(false);
          setCallType('');
          setPhoneNumber('');
        } else {
          setIsHeld(false);
          setIsCallended(false);
          setAgentLifecycle('disposition');
          keepPostCallContext = true;
          setDispositionModal(true);
        }
      } catch (error) {
        console.error('[WebPhone] Error in post-call automation:', error);
        // Safety reset even on error
        setIsCallended(false);
        setActiveLead(null);
        setLeadLockToken('');
        setAgentLifecycle('idle');
      } finally {
        setIsAutomationLoading(false);
        callendedInFlightRef.current = false;
        // ✅ Clear context ONLY after automation is done or failed
        if (!keepPostCallContext) {
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
    getStoredTokenPayload,
    finalizePostCallContext,
    setAgentLifecycle,
    setCallType,
    setDispositionModal,
    setIsCallended,
    setIsHeld,
    callType,
    isMerged,
  ]);

  return [
    ringtone,
    conferenceStatus,
    setConferenceStatus,
    reqUnHold,
    conferenceNumber,
    setConferenceNumber,
    createConferenceCall,
    toggleHold,
    isHeld,
    seconds,
    minutes,
    status,
    setStatus,
    phoneNumber,
    setPhoneNumber,
    handleCall,
    session,
    isRunning,
    endCurrentCall,
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
    setUserCall,
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
    isSticky,
    setIsSticky,
    state.activeFollowUpData,
    state.setActiveFollowUpData,
    currentCallqueueCount,
    setCurrentCallqueueCount,
  ];
};

export default useJssip;
