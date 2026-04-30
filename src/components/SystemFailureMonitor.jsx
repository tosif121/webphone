import React, { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JssipContext } from '@/context/JssipContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  History,
  Filter,
  Trash2,
  Globe,
} from 'lucide-react';
import moment from 'moment/moment';
import DataTable from './DataTable';
import SessionTimeoutModal from './SessionTimeoutModal';

// ── localStorage keys — must match useJssipMonitoring ───────────────────────
const LS_UA_STATUS = 'jssip_ua_status';
const LS_CONNECTION_STATUS = 'jssip_connection_status';
const LS_MONITORING_DATA = 'jssip_monitoring_data';
const LS_TROUBLESHOOT_MODE = 'jssip_troubleshooting_mode';
const LS_LATENCY_HISTORY = 'jssip_latency_history';

const MAX_DISPLAY_RECORDS = 1000;
const MAX_LATENCY_DEFAULT = 30;
const MAX_LATENCY_TROUBLESHOOT = 100;
const PING_INTERVAL_MS = 5000;
const HIGH_LATENCY_MS = 250;
const KEEP_ALIVE_STALE_MS = 14000;
const getPingUrl = () => (typeof window !== 'undefined' ? `${window.location.origin}/` : '/');
const BROADCAST_CHANNEL = 'jssip-sync';

// ── Default shapes ───────────────────────────────────────────────────────────
const DEFAULT_UA = {
  isConnected: false,
  isRegistered: false,
  isStarted: false,
  transport: { connected: false, connecting: false, readyState: null },
  registrator: { registered: false, expires: null },
  systemHealth: { overallHealth: 0, signalStrength: 1 },
  signalStrength: 1,
  networkTier: 'unknown',
};
const DEFAULT_CONN = {
  connectionStatus: 'NOT_INUSE',
  isConnectionLost: false,
  userLogin: false,
  showTimeoutModal: false,
  origin: 'app.samvaad.io',
  networkStatus: true,
  socketState: null,
  lastConnectionCheck: Date.now(),
  systemHealth: { overallHealth: 0, networkQuality: 'unknown', networkTier: 'unknown' },
  networkHealth: 'unknown',
  networkTier: 'unknown',
  signalStrength: 1,
  uaRegistered: false,
};
const DEFAULT_MONITORING = {
  timeoutArray: [],
  messageDifference: [],
  systemEvents: [],
  performanceMetrics: {
    averageResponseTime: 0,
    connectionUptime: 0,
    timeoutCount: 0,
    lastKeepAlive: null,
    systemHealth: 0,
    errorRate: 0,
    successRate: 0,
  },
  networkInfo: {
    effectiveType: 'unknown',
    downlink: null,
    rtt: null,
    online: true,
    quality: 'unknown',
    networkTier: 'unknown',
    signalStrength: 1,
  },
  systemAnalysis: {
    overallHealth: 0,
    wsHealth: 'unknown',
    sipHealth: 'unknown',
    networkOnline: true,
    networkQuality: 'unknown',
    networkTier: 'unknown',
    signalStrength: 1,
    recentTimeouts: 0,
    wsConnected: false,
    isUARegistered: false,
  },
};

// ── useLocalStorageSync — outside component ──────────────────────────────────
function useLocalStorageSync(key, defaultValue, autoRefresh) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const r = localStorage.getItem(key);
      if (r) {
        const p = JSON.parse(r);
        return p.data ?? p;
      }
    } catch {
      /* ignore */
    }
    return defaultValue;
  });
  useEffect(() => {
    if (!autoRefresh) return;
    try {
      const r = localStorage.getItem(key);
      if (r) {
        const p = JSON.parse(r);
        setValue(p.data ?? p);
      }
    } catch {
      /* ignore */
    }
  }, [key, autoRefresh]);
  useEffect(() => {
    if (!autoRefresh) return;
    const onStorage = (e) => {
      if (e.key === key && e.newValue) {
        try {
          const p = JSON.parse(e.newValue);
          setValue(p.data ?? p);
        } catch {
          /* ignore */
        }
      }
    };
    const onBroadcast = (e) => {
      if (e.data?.key === key) setValue(e.data.value);
    };
    window.addEventListener('storage', onStorage);
    let ch = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel(BROADCAST_CHANNEL);
      ch.onmessage = onBroadcast;
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      ch?.close();
    };
  }, [key, autoRefresh]);
  return value;
}

// ── Pure helpers ─────────────────────────────────────────────────────────────
const getStatusIcon = (s) => {
  if (s === 'healthy') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (s === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  if (s === 'critical') return <XCircle className="w-4 h-4 text-red-600" />;
  return <Activity className="w-4 h-4 text-muted-foreground" />;
};
const getStatusColor = (s) => {
  if (s === 'healthy') return 'bg-green-50 text-green-700 border-green-200';
  if (s === 'warning') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (s === 'critical') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-muted text-muted-foreground border-border';
};
const getSeverityColor = (s) => {
  if (s === 'critical') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (s === 'warning') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (s === 'success') return 'bg-green-50 text-green-700 border-green-200';
  if (s === 'info') return 'bg-primary/10 text-primary border-primary/20';
  return 'bg-muted text-muted-foreground border-border';
};
const getEntryTypeColor = (t) => {
  if (t === 'Success Event') return 'bg-green-50 text-green-700 border-green-200';
  if (t === 'Warning Event') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (t === 'Failure Event') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (t === 'Info Event') return 'bg-primary/10 text-primary border-primary/20';
  return 'bg-muted text-muted-foreground border-border';
};

// ── NetworkQualityBars ───────────────────────────────────────────────────────
const QUALITY_COLOR = { excellent: 'bg-green-500', good: 'bg-blue-500', fair: 'bg-yellow-500', poor: 'bg-red-500' };
const NetworkQualityBars = React.memo(
  ({ signalStrength = 1, networkQuality = 'unknown', networkTier = '', className = '' }) => {
    const activeColor = QUALITY_COLOR[networkQuality] ?? 'bg-gray-400';
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="flex items-end h-6 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-1.5 rounded-sm transition-all duration-300 ${i < signalStrength ? activeColor : 'bg-gray-300'}`}
              style={{ height: `${(i + 1) * 25}%` }}
              aria-label={`Signal bar ${i + 1} ${i < signalStrength ? 'active' : 'inactive'}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-1 font-semibold capitalize">
          {networkTier || networkQuality}
        </span>
      </div>
    );
  },
);
NetworkQualityBars.displayName = 'NetworkQualityBars';

// ── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = React.memo(({ title, icon, value, description, borderColor = 'border-l-primary', subStats }) => (
  <Card
    className={`shadow border border-l-4 ${borderColor} transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg w-full`}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
      <CardTitle className="text-xs sm:text-sm font-medium text-primary truncate max-w-[80%]">{title}</CardTitle>
      <span className="shrink-0 scale-90 sm:scale-100">{icon}</span>
    </CardHeader>
    <CardContent className="pt-1 pb-3 px-4">
      <div className="text-xl sm:text-2xl font-bold break-words">{value}</div>
      {description && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{description}</p>
      )}
      {subStats && (
        <div className="flex flex-wrap gap-2 mt-2 text-[10px] sm:text-xs text-muted-foreground">
          {subStats.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-muted/30 px-1.5 py-0.5 rounded">
              {s.icon && <span className="shrink-0 scale-75">{s.icon}</span>}
              <span className="font-semibold">{s.value}</span>
              <span className="truncate opacity-80">{s.label}</span>
            </span>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const SystemFailureMonitors = () => {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [frozenData, setFrozenData] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [icmpLatency, setIcmpLatency] = useState(null);
  const [networkOffsets, setNetworkOffsets] = useState({ transfer: 0, interval: 0 });

  const latencyToastRef = useRef(false);
  const prevAutoRefreshRef = useRef(true);

  const { showTimeoutModal, closeTimeoutModal, handleLoginSuccess, userLogin, timeoutMessage } =
    useContext(JssipContext);

  // ── Live data from localStorage ──────────────────────────────────────────
  const troubleshootRaw = useLocalStorageSync(LS_TROUBLESHOOT_MODE, false, autoRefresh);
  const troubleshootingMode = troubleshootRaw === 'true' || troubleshootRaw === true;

  const uaStatus = useLocalStorageSync(LS_UA_STATUS, DEFAULT_UA, autoRefresh);
  const connectionStatus = useLocalStorageSync(LS_CONNECTION_STATUS, DEFAULT_CONN, autoRefresh);
  const monitoringData = useLocalStorageSync(LS_MONITORING_DATA, DEFAULT_MONITORING, autoRefresh);

  // ── Latency history ──────────────────────────────────────────────────────
  const [latencyHistory, setLatencyHistory] = useState(() => {
    if (typeof window === 'undefined') return [];
    if (localStorage.getItem(LS_TROUBLESHOOT_MODE) !== 'true') return [];
    try {
      const r = localStorage.getItem(LS_LATENCY_HISTORY);
      return r ? JSON.parse(r) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (troubleshootingMode) localStorage.setItem(LS_LATENCY_HISTORY, JSON.stringify(latencyHistory));
  }, [latencyHistory, troubleshootingMode]);
  const clearGraphHistory = useCallback(() => {
    setLatencyHistory([]);
    localStorage.removeItem(LS_LATENCY_HISTORY);
    toast.success('Network graph history cleared.');
  }, []);

  // ── Freeze / unfreeze ────────────────────────────────────────────────────
  useEffect(() => {
    const was = prevAutoRefreshRef.current;
    prevAutoRefreshRef.current = autoRefresh;
    if (!autoRefresh && was) {
      setFrozenData({ uaStatus, connectionStatus, monitoringData, timestamp: new Date().toISOString() });
    } else if (autoRefresh && frozenData) {
      setFrozenData(null);
    }
  }, [autoRefresh]);

  const getCurrentData = useCallback(() => {
    if (!autoRefresh && frozenData) return frozenData;
    return { uaStatus, connectionStatus, monitoringData };
  }, [autoRefresh, frozenData, uaStatus, connectionStatus, monitoringData]);

  // ── ICMP Ping ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh || !troubleshootingMode) return;
    const checkIcmp = async () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const preciseTime = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });
      const maxPts = troubleshootingMode ? MAX_LATENCY_TROUBLESHOOT : MAX_LATENCY_DEFAULT;
      try {
        const start = performance.now();
        await fetch(`${getPingUrl()}?_cb=${Math.random().toString(36).slice(2)}`, {
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors',
        });
        const latency = Math.round(performance.now() - start);
        const rtt = navigator.connection?.rtt ?? null;
        setIcmpLatency(latency);
        setLatencyHistory((prev) => {
          const u = [...prev, { preciseTime, time: timeStr, ping: latency, rtt, isError: false }];
          return u.length > maxPts ? u.slice(-maxPts) : u;
        });
        if (troubleshootingMode && latency > HIGH_LATENCY_MS && !latencyToastRef.current) {
          toast.error(`High Network Latency: ${latency}ms`);
          latencyToastRef.current = true;
          setTimeout(() => {
            latencyToastRef.current = false;
          }, PING_INTERVAL_MS);
        }
      } catch {
        const fb = navigator.connection?.rtt ?? 0;
        setIcmpLatency(fb);
        setLatencyHistory((prev) => {
          const u = [...prev, { preciseTime, time: timeStr, ping: fb, rtt: fb, isError: true }];
          return u.length > maxPts ? u.slice(-maxPts) : u;
        });
        if (troubleshootingMode && !latencyToastRef.current) {
          toast.error(`Ping Failed. RTT Fallback: ${fb}ms`);
          latencyToastRef.current = true;
          setTimeout(() => {
            latencyToastRef.current = false;
          }, PING_INTERVAL_MS);
        }
      }
    };
    const id = setInterval(checkIcmp, PING_INTERVAL_MS);
    checkIcmp();
    return () => clearInterval(id);
  }, [autoRefresh, troubleshootingMode]);

  // ── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getLastKeepAlive = useCallback(() => {
    const msgs = getCurrentData().monitoringData?.messageDifference;
    if (!Array.isArray(msgs) || msgs.length === 0) return null;
    return msgs[msgs.length - 1] ?? null;
  }, [getCurrentData]);

  const isKeepAliveHealthy = useCallback(() => {
    const last = getLastKeepAlive();
    return !!last?.messageTime && Date.now() - last.messageTime < KEEP_ALIVE_STALE_MS;
  }, [getLastKeepAlive]);

  const getTimeSinceLastKeepAlive = useCallback(() => {
    const last = getLastKeepAlive();
    if (!last?.messageTime) return '---';
    return Math.floor((Date.now() - last.messageTime) / 1000);
  }, [getLastKeepAlive]);

  const getWebSocketReadyState = useCallback(() => {
    const { monitoringData: m, uaStatus: ua } = getCurrentData();
    if (m.systemAnalysis?.wsConnected || m.systemAnalysis?.wsHealth === 'healthy' || ua.isConnected) return 'OPEN';
    const map = { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' };
    return map[ua.transport?.readyState] ?? 'UNKNOWN';
  }, [getCurrentData]);

  const getConnectionUptime = useCallback(() => {
    const uptime = getCurrentData().monitoringData.performanceMetrics?.connectionUptime ?? 0;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [getCurrentData]);

  const getNetworkQuality = useCallback(() => {
    const sys = getCurrentData().monitoringData.systemAnalysis ?? {};
    const quality = sys.networkQuality ?? 'unknown';
    const tier = sys.networkTier ?? '';
    const colorMap = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      poor: 'text-red-600',
    };
    return {
      quality: quality.charAt(0).toUpperCase() + quality.slice(1),
      tier,
      color: colorMap[quality] ?? 'text-gray-600',
    };
  }, [getCurrentData]);

  // ── Component status ─────────────────────────────────────────────────────
  const buildCurrentComponentStatus = useCallback(() => {
    const { uaStatus: ua, monitoringData: m } = getCurrentData();
    const sys = m.systemAnalysis ?? {};
    const timeoutCount = m.timeoutArray?.length ?? 0;
    const wsState = getWebSocketReadyState();
    const { quality, tier } = getNetworkQuality();
    const keepAlive = isKeepAliveHealthy();
    const timeSince = getTimeSinceLastKeepAlive();
    const hasKeepAlive = Array.isArray(m.messageDifference) && m.messageDifference.length > 0;

    return [
      {
        component: 'WebSocket Connection',
        status: sys.wsHealth === 'healthy' || sys.wsConnected || ua.isConnected ? 'healthy' : 'critical',
        details:
          sys.wsConnected || ua.isConnected
            ? `Active connection (${wsState}). Server is reachable.`
            : `Connection failed (${wsState}). Possible firewall, DNS, or server issue.`,
      },
      {
        component: 'SIP Registration',
        status: sys.sipHealth === 'healthy' || sys.isUARegistered || ua.isRegistered ? 'healthy' : 'critical',
        details:
          sys.isUARegistered || ua.isRegistered
            ? `Registered (expires: ${ua.registrator?.expires ? new Date(ua.registrator.expires * 1000).toLocaleTimeString() : 'N/A'}). Authenticated successfully.`
            : 'Registration failed. Check campaign credentials or Asterisk status.',
      },
      {
        component: 'UA Transport Layer',
        status: ua.transport?.connected ? 'healthy' : ua.transport?.connecting ? 'warning' : 'critical',
        details: ua.transport?.connected
          ? 'Transport connected. WebRTC channel is open.'
          : ua.transport?.connecting
            ? 'Transport connecting… Waiting for WebRTC bridge.'
            : 'Transport disconnected. Browser may be throttling background tabs.',
      },
      {
        component: 'Keep-Alive Messages',
        status: keepAlive ? 'healthy' : 'critical',
        details: hasKeepAlive
          ? `Last message: ${timeSince}s ago. ${keepAlive ? 'Server responding on time.' : 'Server lagging or dropping packets.'}`
          : 'No keep-alive data. Server heartbeat missing.',
      },
      {
        component: 'Network Quality',
        status: quality === 'Excellent' || quality === 'Good' ? 'healthy' : quality === 'Fair' ? 'warning' : 'critical',
        details: `${quality}${tier ? ` (${tier})` : ''} — RTT: ${Math.round(m.networkInfo?.rtt ?? 0)}ms, Downlink: ${m.networkInfo?.downlink ?? 0} Mbps. ${
          quality === 'Excellent' || quality === 'Good'
            ? 'Network is stable.'
            : 'Weak or congested connection detected.'
        }`,
      },
      {
        component: 'System Timeouts',
        status: timeoutCount > 5 ? 'critical' : timeoutCount > 0 ? 'warning' : 'healthy',
        details: `${timeoutCount} timeout event${timeoutCount !== 1 ? 's' : ''} detected. ${timeoutCount > 0 ? 'Browser failing to reach server in time.' : 'No recent dropped requests.'}`,
      },
      {
        component: 'ICMP Latency (Ping)',
        status:
          icmpLatency === null
            ? 'warning'
            : icmpLatency < 100
              ? 'healthy'
              : icmpLatency < HIGH_LATENCY_MS
                ? 'warning'
                : 'critical',
        details:
          icmpLatency !== null
            ? `${icmpLatency}ms to origin server. ${icmpLatency < HIGH_LATENCY_MS ? 'Speed is optimal.' : 'High congestion or VPN interference.'}`
            : 'Ping unavailable. Network route may be blocked.',
      },
    ];
  }, [
    getCurrentData,
    isKeepAliveHealthy,
    getTimeSinceLastKeepAlive,
    getWebSocketReadyState,
    getNetworkQuality,
    icmpLatency,
  ]);

  const calculateSystemHealth = useCallback(
    () => getCurrentData().monitoringData.systemAnalysis?.overallHealth ?? 0,
    [getCurrentData],
  );

  // ── Table data — derived DIRECTLY from live systemEvents in monitoringData
  // No separate state, no polling. Updates the instant useJssipMonitoring flushes.
  const tableData = useMemo(() => {
    const events = getCurrentData().monitoringData.systemEvents ?? [];
    const mapped = events.map((event) => {
      const entryType =
        event.type === 'error'
          ? 'Failure Event'
          : event.type === 'warning'
            ? 'Warning Event'
            : event.type === 'info'
              ? 'Info Event'
              : 'Success Event';
      return {
        id: event.id ?? `${event.timestamp}_${Math.random()}`,
        timestamp: new Date(event.timestamp).toISOString(),
        entryType,
        component: event.component ?? 'System',
        status: event.type === 'error' ? 'critical' : event.type === 'warning' ? 'warning' : 'healthy',
        severity:
          event.type === 'error'
            ? 'critical'
            : event.type === 'warning'
              ? 'warning'
              : event.type === 'info'
                ? 'info'
                : 'success',
        description: event.description ?? event.message ?? '',
      };
    });

    // Apply filters
    let filtered = mapped.slice().reverse(); // newest first
    if (viewMode === 'live') filtered = filtered.filter((e) => e.entryType === 'Info Event');
    if (viewMode === 'history') filtered = filtered.filter((e) => e.entryType !== 'Info Event');
    if (filterSeverity !== 'all') filtered = filtered.filter((e) => e.severity === filterSeverity);
    return filtered.slice(0, MAX_DISPLAY_RECORDS);
  }, [getCurrentData, viewMode, filterSeverity, monitoringData]); // monitoringData dep ensures re-render on flush

  // ── Event counts for badges ──────────────────────────────────────────────
  const eventCounts = useMemo(() => {
    const events = getCurrentData().monitoringData.systemEvents ?? [];
    return {
      total: events.length,
      success: events.filter((e) => e.type === 'success').length,
      warning: events.filter((e) => e.type === 'warning').length,
      error: events.filter((e) => e.type === 'error').length,
      info: events.filter((e) => e.type === 'info').length,
    };
  }, [getCurrentData, monitoringData]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentComponents = useMemo(() => buildCurrentComponentStatus(), [buildCurrentComponentStatus]);
  const systemHealthScore = useMemo(() => calculateSystemHealth(), [calculateSystemHealth]);
  const criticalIssues = useMemo(
    () => currentComponents.filter((c) => c.status === 'critical').length,
    [currentComponents],
  );

  // ── Table columns ────────────────────────────────────────────────────────
  const dataTableColumns = useMemo(
    () => [
      {
        header: 'Timestamp',
        accessorKey: 'timestamp',
        cell: ({ row }) => (
          <span className="text-foreground text-sm whitespace-nowrap">
            {moment(row.original.timestamp).format('DD MMM YYYY, hh:mm:ss A')}
          </span>
        ),
      },
      {
        header: 'Event Type',
        accessorKey: 'entryType',
        cell: ({ row }) => (
          <Badge className={getEntryTypeColor(row.original.entryType)}>{row.original.entryType}</Badge>
        ),
      },
      {
        header: 'Component',
        accessorKey: 'component',
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.component}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getStatusIcon(row.original.status)}
            <Badge className={getStatusColor(row.original.status)}>{row.original.status}</Badge>
          </div>
        ),
      },
      {
        header: 'Severity',
        accessorKey: 'severity',
        cell: ({ row }) => (
          <Badge className={getSeverityColor(row.original.severity)}>{row.original.severity.toUpperCase()}</Badge>
        ),
      },
      {
        header: 'Description',
        accessorKey: 'description',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-sm truncate block" title={row.original.description}>
            {row.original.description}
          </span>
        ),
      },
    ],
    [],
  );

  // ── Export ───────────────────────────────────────────────────────────────
  const exportAllData = useCallback(() => {
    const d = getCurrentData();
    const out = {
      exportTimestamp: new Date().toISOString(),
      systemStatus: {
        webSocketConnected: d.monitoringData.systemAnalysis?.wsConnected || d.uaStatus.isConnected,
        sipRegistered: d.monitoringData.systemAnalysis?.isUARegistered || d.uaStatus.isRegistered,
        systemHealth: systemHealthScore,
        timeoutCount: d.monitoringData.timeoutArray?.length ?? 0,
        networkQuality: d.monitoringData.systemAnalysis?.networkQuality ?? 'unknown',
        networkTier: d.monitoringData.systemAnalysis?.networkTier ?? 'unknown',
        signalStrength: d.monitoringData.systemAnalysis?.signalStrength ?? 1,
      },
      events: d.monitoringData.systemEvents ?? [],
      latencyHistory,
      frozenState: !autoRefresh ? frozenData : null,
    };
    const a = document.createElement('a');
    a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(out, null, 2)));
    a.setAttribute('download', `jssip-monitoring-${new Date().toISOString().split('T')[0]}.json`);
    a.click();
  }, [getCurrentData, systemHealthScore, latencyHistory, autoRefresh, frozenData]);

  // ── Mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);

  // ── Early renders ────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex w-full items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Loading Network Monitor</h2>
          <p className="text-sm text-muted-foreground mt-2">Initializing real-time monitoring system…</p>
        </div>
      </div>
    );
  }
  if (!troubleshootingMode) {
    return (
      <div className="w-full space-y-6 pt-12 pb-6 px-6 max-w-2xl m-auto">
        <Card className="shadow-lg border-primary/20 bg-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Network Monitoring is Disabled</CardTitle>
            <CardDescription className="text-base">
              Enable <strong>Troubleshoot Mode</strong> from the user profile dropdown to activate real-time monitoring.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  const live = getCurrentData();
  const liveUA = live.uaStatus;
  const liveMonitor = live.monitoringData;
  const liveAnalysis = liveMonitor.systemAnalysis ?? {};
  const networkQ = getNetworkQuality();

  return (
    <>
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onClose={closeTimeoutModal}
        onLoginSuccess={handleLoginSuccess}
        userLogin={userLogin}
        customMessage={timeoutMessage}
      />
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Network Monitoring Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time JsSIP network monitoring</p>
            {!autoRefresh && frozenData && (
              <Badge className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                ⏸️ PAUSED — frozen at {moment(frozenData.timestamp).format('HH:mm:ss')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-muted text-muted-foreground">
              <Database className="w-3 h-3 mr-1" />
              {eventCounts.total} Events
            </Badge>
            <Badge className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {eventCounts.success} Success
            </Badge>
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {eventCounts.warning} Warnings
            </Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              <XCircle className="w-3 h-3 mr-1" />
              {eventCounts.error} Failures
            </Badge>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            title="WebSocket Connection"
            value={liveAnalysis.wsConnected || liveUA.isConnected ? 'Connected' : 'FAILED'}
            description={`State: ${getWebSocketReadyState()}`}
            icon={
              liveAnalysis.wsConnected || liveUA.isConnected ? (
                <Wifi className="h-6 w-6 text-blue-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )
            }
            borderColor={liveAnalysis.wsConnected || liveUA.isConnected ? 'border-l-blue-500' : 'border-l-red-500'}
          />
          <StatCard
            title="SIP Registration"
            value={liveAnalysis.isUARegistered || liveUA.isRegistered ? 'Active' : 'FAILED'}
            description={`Uptime: ${getConnectionUptime()}`}
            icon={
              liveAnalysis.isUARegistered || liveUA.isRegistered ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )
            }
            borderColor={liveAnalysis.isUARegistered || liveUA.isRegistered ? 'border-l-green-500' : 'border-l-red-500'}
            subStats={[
              {
                icon: <span className="h-2 w-2 bg-green-500 rounded-full inline-block" />,
                value: getConnectionUptime(),
                label: 'uptime',
              },
            ]}
          />
          <StatCard
            title="Network Quality"
            value={networkQ.tier ? `${networkQ.quality} (${networkQ.tier})` : networkQ.quality}
            description={`RTT: ${Math.round(liveMonitor.networkInfo?.rtt ?? 0)}ms · ${liveMonitor.networkInfo?.downlink ?? 0} Mbps`}
            icon={
              <NetworkQualityBars
                signalStrength={liveAnalysis.signalStrength ?? 1}
                networkQuality={liveAnalysis.networkQuality ?? 'unknown'}
                networkTier={liveAnalysis.networkTier ?? ''}
              />
            }
            borderColor={
              networkQ.quality === 'Excellent' || networkQ.quality === 'Good'
                ? 'border-l-green-500'
                : networkQ.quality === 'Fair'
                  ? 'border-l-yellow-500'
                  : 'border-l-red-500'
            }
            subStats={[
              {
                icon: <Globe className="h-3 w-3 text-blue-500" />,
                value: `${networkOffsets.transfer}ms`,
                label: 'TS Offset',
              },
              {
                icon: <Activity className="h-3 w-3 text-purple-500" />,
                value: `${networkOffsets.interval}ms`,
                label: 'Arrival Int',
              },
            ]}
          />
          <StatCard
            title="System Health"
            value={`${systemHealthScore}%`}
            description={`Timeouts: ${liveAnalysis.recentTimeouts ?? 0}  ·  Avg RTT: ${Math.round(liveMonitor.performanceMetrics?.averageResponseTime ?? 0)}ms`}
            icon={
              systemHealthScore > 80 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : systemHealthScore > 50 ? (
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )
            }
            borderColor={
              systemHealthScore > 80
                ? 'border-l-green-500'
                : systemHealthScore > 50
                  ? 'border-l-yellow-500'
                  : 'border-l-red-500'
            }
          />
        </div>

        {/* Alerts */}
        {criticalIssues > 0 && (
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">CRITICAL NETWORK FAILURES DETECTED</AlertTitle>
            <AlertDescription className="text-destructive/80">
              {criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} require immediate attention. Connection may
              be compromised.
            </AlertDescription>
          </Alert>
        )}

        {/* Component Status */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">Network Component Status</CardTitle>
            <CardDescription>Real-time status of all JsSIP network components</CardDescription>
            {!autoRefresh && (
              <Badge className="mt-2 w-fit bg-yellow-50 text-yellow-700 border-yellow-200">
                ⏸️ FROZEN — Auto-refresh is OFF
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {currentComponents.map((component, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-xl bg-card hover:bg-accent/5 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 shrink-0">{getStatusIcon(component.status)}</div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-card-foreground">{component.component}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-0.5">
                        {component.details}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto space-x-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    {component.component === 'Network Quality' && (
                      <NetworkQualityBars
                        signalStrength={liveAnalysis.signalStrength ?? 1}
                        networkQuality={liveAnalysis.networkQuality ?? 'unknown'}
                        networkTier={liveAnalysis.networkTier ?? ''}
                        className="scale-90"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(component.status)} px-2 py-0.5 text-[10px]`}>
                        {component.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {!autoRefresh ? 'Frozen' : currentTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latency Chart */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Network Latency History
                </CardTitle>
                <CardDescription>
                  Live ICMP measurements to origin server
                  {icmpLatency !== null && (
                    <span
                      className={`ml-2 font-semibold ${icmpLatency < 100 ? 'text-green-600' : icmpLatency < HIGH_LATENCY_MS ? 'text-yellow-600' : 'text-red-600'}`}
                    >
                      — Current: {icmpLatency}ms
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Chart Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
                {latencyHistory.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearGraphHistory} className="h-8">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {latencyHistory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Collecting ping data… first measurement in {PING_INTERVAL_MS / 1000}s
              </div>
            ) : (
              <div className="h-64 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={latencyHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        minTickGap={20}
                      />
                      <YAxis
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(v) => `${v}ms`}
                        width={50}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        labelFormatter={(label, payload) =>
                          payload?.length ? `Time: ${payload[0].payload.preciseTime ?? label}` : label
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="ping" name="ICMP Ping" radius={[2, 2, 0, 0]}>
                        {latencyHistory.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.isError || entry.ping > HIGH_LATENCY_MS
                                ? '#ef4444'
                                : entry.ping > 100
                                  ? '#f59e0b'
                                  : '#10b981'
                            }
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="rtt" name="Browser RTT" fill="#6366f1" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={latencyHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        minTickGap={20}
                      />
                      <YAxis
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(v) => `${v}ms`}
                        width={50}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        labelFormatter={(label, payload) =>
                          payload?.length ? `Time: ${payload[0].payload.preciseTime ?? label}` : label
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="ping"
                        name="ICMP Ping"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rtt"
                        name="Browser RTT"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Log Table */}
        <Card className="bg-card">
          <CardHeader className="pb-2 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-primary">Real-Time Event Log</CardTitle>
                <CardDescription>
                  Live UA events — {tableData.length} shown
                  {tableData.length >= MAX_DISPLAY_RECORDS && ` (capped at ${MAX_DISPLAY_RECORDS})`}
                  {autoRefresh && <span className="ml-2 text-green-600 font-medium">● Live</span>}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh((v) => !v)}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:block">{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
                </Button>
                <Button variant="outline" onClick={exportAllData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:block">Export</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      All ({eventCounts.total})
                    </div>
                  </SelectItem>
                  <SelectItem value="live">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Info ({eventCounts.info})
                    </div>
                  </SelectItem>
                  <SelectItem value="history">
                    <div className="flex items-center">
                      <History className="w-4 h-4 mr-2" />
                      Non-info ({eventCounts.success + eventCounts.warning + eventCounts.error})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      All ({eventCounts.total})
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Success ({eventCounts.success})
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                      Warning ({eventCounts.warning})
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      Critical ({eventCounts.error})
                    </div>
                  </SelectItem>
                  <SelectItem value="info">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-blue-500" />
                      Info ({eventCounts.info})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {tableData.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No events yet. Events appear here as your JsSIP UA connects, registers, and receives messages.
              </div>
            ) : (
              <DataTable data={tableData} columns={dataTableColumns} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SystemFailureMonitors;
