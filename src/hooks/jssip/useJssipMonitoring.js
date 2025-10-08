// hooks/jssip/useJssipMonitoring.js
import { useEffect, useCallback, useContext } from 'react';
import HistoryContext from '../../context/HistoryContext';

export const useJssipMonitoring = (state, utils) => {
  const { username } = useContext(HistoryContext);
  const {
    ua,
    status,
    connectionStatus,
    messageDifference,
    timeoutArray,
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
    session,
    userLogin,
    showTimeoutModal,
    origin,
    isConnectionLost,
  } = state;

  const { storeInLocalStorage, getFromLocalStorage } = utils;

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

  const logSystemEvent = useCallback(
    (type, category, message, details = {}) => {
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
    },
    [setSystemEvents, setSuccessCount, setErrorCount, setLastError]
  );

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
    setLastLoggedUAState,
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

  return {
    calculateAverageResponseTime,
    calculateConnectionUptime,
    isUARegistered,
    getWebSocketStatus,
    analyzeSystemHealth,
    logSystemEvent,
  };
};
