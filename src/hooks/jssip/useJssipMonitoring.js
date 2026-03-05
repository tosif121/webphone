import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// Storage keys — single source of truth
// ─────────────────────────────────────────────────────────────
export const MONITORING_KEYS = {
  UA_STATUS: 'jssip_ua_status',
  CONNECTION_STATUS: 'jssip_connection_status',
  MONITORING_DATA: 'jssip_monitoring_data',
  TROUBLESHOOTING_MODE: 'jssip_troubleshooting_mode',
};

// ─────────────────────────────────────────────────────────────
// Helper: derive network quality from RTT
// ─────────────────────────────────────────────────────────────
const deriveNetworkQuality = (rtt) => {
  if (rtt === null || rtt === undefined) return 'unknown';
  if (rtt < 50) return 'excellent';
  if (rtt < 150) return 'good';
  if (rtt < 300) return 'fair';
  return 'poor';
};

// ─────────────────────────────────────────────────────────────
// Helper: derive signal strength (1–4) from network quality
// ─────────────────────────────────────────────────────────────
const deriveSignalStrength = (quality) => {
  switch (quality) {
    case 'excellent':
      return 4;
    case 'good':
      return 3;
    case 'fair':
      return 2;
    case 'poor':
      return 1;
    default:
      return 1;
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: safe localStorage write
// ─────────────────────────────────────────────────────────────
const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Broadcast to other tabs
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('jssip-sync');
      bc.postMessage({ key, value });
      bc.close();
    }
  } catch (e) {
    console.warn('[useJssipMonitoring] localStorage write failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: safe localStorage read
// ─────────────────────────────────────────────────────────────
const readStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// useJssipMonitoring
// Call this hook inside useJssip and pass (state, utils).
// It owns all localStorage writes for the monitoring dashboard.
// ─────────────────────────────────────────────────────────────
export const useJssipMonitoring = (state, utils) => {
  const {
    ua,
    timeoutArray,
    messageDifference,
    systemEvents,
    setSystemEvents,
    networkHealth,
    setNetworkHealth,
    successCount,
    setSuccessCount,
    errorCount,
    setErrorCount,
  } = state;

  // Internal refs — avoid stale closures in interval callbacks
  const connectedAtRef = useRef(null); // timestamp when WS connected
  const uaRef = useRef(null); // latest ua instance
  const timeoutArrayRef = useRef([]);
  const messageDiffRef = useRef([]);
  const systemEventsRef = useRef([]);
  const successCountRef = useRef(0);
  const errorCountRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    uaRef.current = ua;
  }, [ua]);
  useEffect(() => {
    timeoutArrayRef.current = timeoutArray;
  }, [timeoutArray]);
  useEffect(() => {
    messageDiffRef.current = messageDifference;
  }, [messageDifference]);
  useEffect(() => {
    systemEventsRef.current = systemEvents;
  }, [systemEvents]);
  useEffect(() => {
    successCountRef.current = successCount;
  }, [successCount]);
  useEffect(() => {
    errorCountRef.current = errorCount;
  }, [errorCount]);

  // ── Helpers exposed to useJssip ──────────────────────────────────────

  const logSystemEvent = useCallback(
    (type, component, description) => {
      const event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type, // 'error' | 'success' | 'info'
        component,
        description,
        timestamp: Date.now(),
      };
      setSystemEvents((prev) => {
        const updated = [...prev, event].slice(-200); // keep last 200
        systemEventsRef.current = updated;
        return updated;
      });
      return event;
    },
    [setSystemEvents],
  );

  const isUARegistered = useCallback(() => {
    const u = uaRef.current;
    if (!u) return false;
    try {
      return u.isRegistered();
    } catch {
      return false;
    }
  }, []);

  const getWebSocketStatus = useCallback(() => {
    const u = uaRef.current;
    if (!u?.transport) return { connected: false, connecting: false, readyState: null };
    try {
      return {
        connected: u.transport.isConnected(),
        connecting: u.transport.isConnecting(),
        readyState: u.transport.socket?.readyState ?? null,
      };
    } catch {
      return { connected: false, connecting: false, readyState: null };
    }
  }, []);

  const calculateConnectionUptime = useCallback(() => {
    if (!connectedAtRef.current) return 0;
    return Date.now() - connectedAtRef.current;
  }, []);

  const calculateAverageResponseTime = useCallback(() => {
    const msgs = messageDiffRef.current;
    if (msgs.length < 2) return 0;
    const diffs = [];
    for (let i = 1; i < msgs.length; i++) {
      diffs.push(msgs[i].messageTime - msgs[i - 1].messageTime);
    }
    return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  }, []);

  const analyzeSystemHealth = useCallback(() => {
    const wsStatus = getWebSocketStatus();
    const registered = isUARegistered();
    const timeouts = timeoutArrayRef.current;
    const msgs = messageDiffRef.current;
    const navConn = navigator.connection || {};
    const rtt = navConn.rtt ?? null;
    const netQuality = deriveNetworkQuality(rtt);
    const signalStr = deriveSignalStrength(netQuality);

    // Keep-alive freshness
    const lastMsg = msgs[msgs.length - 1];
    const keepAliveOk = lastMsg ? Date.now() - lastMsg.messageTime < 14000 : false;
    const recentTimeouts = timeouts.filter((t) => Date.now() - t.timestamp < 60000).length;

    // Score: each component worth 20 points
    let score = 0;
    if (wsStatus.connected) score += 20;
    if (registered) score += 20;
    if (wsStatus.connected) score += 10; // transport bonus
    if (keepAliveOk) score += 20;
    if (netQuality === 'excellent' || netQuality === 'good') score += 20;
    else if (netQuality === 'fair') score += 10;
    if (recentTimeouts === 0) score += 10;
    else if (recentTimeouts <= 2) score += 5;

    const wsHealth = wsStatus.connected ? 'healthy' : 'critical';
    const sipHealth = registered ? 'healthy' : 'critical';

    return {
      overallHealth: Math.min(100, score),
      wsHealth,
      sipHealth,
      networkOnline: navigator.onLine,
      networkQuality: netQuality,
      signalStrength: signalStr,
      recentTimeouts,
      wsConnected: wsStatus.connected,
      isUARegistered: registered,
    };
  }, [getWebSocketStatus, isUARegistered]);

  // ── Core write function ───────────────────────────────────────────────
  // Called on every meaningful event and also on a 3-second interval
  const flushToStorage = useCallback(() => {
    const u = uaRef.current;
    const wsStatus = getWebSocketStatus();
    const registered = isUARegistered();
    const uptime = calculateConnectionUptime();
    const avgResp = calculateAverageResponseTime();
    const analysis = analyzeSystemHealth();
    const navConn = navigator.connection || {};
    const rtt = navConn.rtt ?? null;
    const timeouts = timeoutArrayRef.current;
    const msgs = messageDiffRef.current;
    const events = systemEventsRef.current;

    // ── jssip_ua_status ──────────────────────────────────────────────
    writeStorage(MONITORING_KEYS.UA_STATUS, {
      isConnected: wsStatus.connected,
      isRegistered: registered,
      isStarted: u ? (u.isStarted?.() ?? false) : false,
      transport: {
        connected: wsStatus.connected,
        connecting: wsStatus.connecting,
        readyState: wsStatus.readyState,
      },
      registrator: {
        registered: registered,
        expires: u?._registrator?._expires ?? null,
      },
      systemHealth: {
        overallHealth: analysis.overallHealth,
        signalStrength: analysis.signalStrength,
      },
      signalStrength: analysis.signalStrength,
    });

    // ── jssip_connection_status ──────────────────────────────────────
    writeStorage(MONITORING_KEYS.CONNECTION_STATUS, {
      isConnectionLost: !wsStatus.connected,
      networkStatus: navigator.onLine,
      socketState: wsStatus.readyState,
      lastConnectionCheck: Date.now(),
      systemHealth: {
        overallHealth: analysis.overallHealth,
        networkQuality: analysis.networkQuality,
      },
      networkHealth: analysis.networkQuality,
      signalStrength: analysis.signalStrength,
      uaRegistered: registered,
      origin: 'esamwad.iotcom.io',
    });

    // ── jssip_monitoring_data ────────────────────────────────────────
    const totalCalls = successCountRef.current + errorCountRef.current;
    const successRate = totalCalls > 0 ? successCountRef.current / totalCalls : 0;
    const errorRate = totalCalls > 0 ? errorCountRef.current / totalCalls : 0;

    writeStorage(MONITORING_KEYS.MONITORING_DATA, {
      timeoutArray: timeouts,
      messageDifference: msgs,
      systemEvents: events,
      performanceMetrics: {
        averageResponseTime: avgResp,
        connectionUptime: uptime,
        timeoutCount: timeouts.length,
        lastKeepAlive: msgs[msgs.length - 1]?.messageTime ?? null,
        systemHealth: analysis.overallHealth,
        errorRate,
        successRate,
      },
      networkInfo: {
        effectiveType: navConn.effectiveType ?? 'unknown',
        downlink: navConn.downlink ?? null,
        rtt,
        online: navigator.onLine,
        quality: analysis.networkQuality,
        signalStrength: analysis.signalStrength,
      },
      systemAnalysis: analysis,
    });
  }, [
    getWebSocketStatus,
    isUARegistered,
    calculateConnectionUptime,
    calculateAverageResponseTime,
    analyzeSystemHealth,
  ]);

  // ── Periodic flush (every 3 seconds) ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(flushToStorage, 3000);
    return () => clearInterval(id);
  }, [flushToStorage]);

  // ── Flush immediately whenever key state changes ──────────────────────
  useEffect(() => {
    flushToStorage();
  }, [ua, timeoutArray, messageDifference, flushToStorage]);

  // ── Track UA events directly to set connectedAt and log events ────────
  useEffect(() => {
    if (!ua) return;

    const onConnected = () => {
      connectedAtRef.current = Date.now();
      setSuccessCount((n) => n + 1);
      logSystemEvent('success', 'WebSocket', 'WebSocket connected to server');
      flushToStorage();
    };

    const onDisconnected = () => {
      setErrorCount((n) => n + 1);
      logSystemEvent('error', 'WebSocket', 'WebSocket disconnected from server');
      flushToStorage();
    };

    const onRegistered = () => {
      setSuccessCount((n) => n + 1);
      logSystemEvent('success', 'SIP Registration', 'UA registered successfully');
      flushToStorage();
    };

    const onUnregistered = () => {
      logSystemEvent('info', 'SIP Registration', 'UA unregistered');
      flushToStorage();
    };

    const onRegistrationFailed = (e) => {
      setErrorCount((n) => n + 1);
      logSystemEvent('error', 'SIP Registration', `Registration failed: ${e?.cause ?? 'unknown'}`);
      flushToStorage();
    };

    const onNewMessage = () => {
      flushToStorage();
    };

    ua.on('connected', onConnected);
    ua.on('disconnected', onDisconnected);
    ua.on('registered', onRegistered);
    ua.on('unregistered', onUnregistered);
    ua.on('registrationFailed', onRegistrationFailed);
    ua.on('newMessage', onNewMessage);

    // Also track transport-level WebSocket events
    if (ua.transport) {
      try {
        ua.transport.on('connected', onConnected);
        ua.transport.on('disconnected', onDisconnected);
      } catch {
        // JsSIP transport may not support .on() in all versions
      }
    }

    return () => {
      try {
        ua.off('connected', onConnected);
        ua.off('disconnected', onDisconnected);
        ua.off('registered', onRegistered);
        ua.off('unregistered', onUnregistered);
        ua.off('registrationFailed', onRegistrationFailed);
        ua.off('newMessage', onNewMessage);
      } catch {
        // ignore cleanup errors on unmount
      }
    };
  }, [ua, flushToStorage, logSystemEvent, setSuccessCount, setErrorCount]);

  // ── Network Information API — flush on change ─────────────────────────
  useEffect(() => {
    const conn = navigator.connection;
    if (!conn) return;
    const onChange = () => flushToStorage();
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener('change', onChange);
  }, [flushToStorage]);

  // ── online / offline events ───────────────────────────────────────────
  useEffect(() => {
    const onOnline = () => {
      logSystemEvent('success', 'Network', 'Browser came online');
      flushToStorage();
    };
    const onOffline = () => {
      logSystemEvent('error', 'Network', 'Browser went offline');
      flushToStorage();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flushToStorage, logSystemEvent]);

  // ── Initial flush on mount ────────────────────────────────────────────
  useEffect(() => {
    flushToStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    calculateAverageResponseTime,
    calculateConnectionUptime,
    isUARegistered,
    getWebSocketStatus,
    analyzeSystemHealth,
    logSystemEvent,
  };
};
