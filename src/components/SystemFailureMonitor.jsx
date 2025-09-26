import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { JssipContext } from '@/context/JssipContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Signal,
} from 'lucide-react';
import moment from 'moment/moment';
import DataTable from './DataTable';
import SessionTimeoutModal from './SessionTimeoutModal';

const NetworkQualityBars = ({ signalStrength = 4, networkQuality = 'unknown', className = '' }) => {
  const getBarColor = (index, strength, quality) => {
    if (index < strength) {
      switch (quality) {
        case 'excellent':
          return 'bg-green-500';
        case 'good':
          return 'bg-blue-500';
        case 'fair':
          return 'bg-yellow-500';
        case 'poor':
          return 'bg-red-500';
        default:
          return 'bg-gray-400';
      }
    }
    return 'bg-gray-300';
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-end h-6 gap-1">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`w-1.5 rounded-sm transition-all duration-300 ${getBarColor(
              index,
              signalStrength,
              networkQuality
            )}`}
            style={{ height: `${(index + 1) * 25}%` }}
            aria-label={`Signal bar ${index + 1} of 4 ${index < signalStrength ? 'active' : 'inactive'}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground mt-1 capitalize">{networkQuality}</span>
    </div>
  );
};

const SystemFailureMonitors = () => {
  const MAX_DISPLAY_RECORDS = 1000;
  const MAX_STORAGE_RECORDS = 5000;

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [unifiedMonitoringData, setUnifiedMonitoringData] = useState([]);
  const [viewMode, setViewMode] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
 const {
   
    showTimeoutModal,
    setShowTimeoutModal,
    handleLoginSuccess,
    closeTimeoutModal,
    userLogin,
  } = useContext(JssipContext);
  // ADDED: Frozen state to store last data when auto-refresh is OFF
  const [frozenData, setFrozenData] = useState(null);

  const useLocalStorageSync = (key, defaultValue) => {
    const [storedValue, setStoredValue] = useState(defaultValue);

    useEffect(() => {
      // Only sync if auto-refresh is ON
      if (!autoRefresh && frozenData) {
        return; // Don't update from localStorage when auto-refresh is OFF
      }

      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          setStoredValue(parsed.data || parsed);
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
      }
    }, [key, autoRefresh]); // Added autoRefresh dependency

    useEffect(() => {
      // Don't listen to storage changes if auto-refresh is OFF
      if (!autoRefresh) return;

      const handleStorageChange = (e) => {
        if (e.key === key && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setStoredValue(parsed.data || parsed);
          } catch (error) {
            console.error('Error parsing storage event:', error);
          }
        }
      };

      const handleBroadcastMessage = (event) => {
        if (event.data && event.data.key === key) {
          setStoredValue(event.data.value);
        }
      };

      window.addEventListener('storage', handleStorageChange);

      let channel;
      if (window.BroadcastChannel) {
        channel = new BroadcastChannel('jssip-sync');
        channel.onmessage = handleBroadcastMessage;
      }

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        if (channel) {
          channel.close();
        }
      };
    }, [key, autoRefresh]); // Added autoRefresh dependency

    return storedValue;
  };

  // CORRECTED: Use the actual localStorage keys from your working useJssip
  const uaStatus = useLocalStorageSync('jssip_ua_status', {
    isConnected: false,
    isRegistered: false,
    isStarted: false,
    transport: { connected: false, connecting: false, readyState: null },
    registrator: { registered: false, expires: null },
    systemHealth: { overallHealth: 0, signalStrength: 1 },
    signalStrength: 1,
  });

  const connectionStatus = useLocalStorageSync('jssip_connection_status', {
    connectionStatus: 'NOT_INUSE',
    isConnectionLost: false,
    userLogin: false,
    showTimeoutModal: false,
    origin: 'esamwad.iotcom.io',
    networkStatus: true,
    socketState: null,
    lastConnectionCheck: Date.now(),
    systemHealth: { overallHealth: 0, networkQuality: 'unknown' },
    networkHealth: 'unknown',
    signalStrength: 1,
    uaRegistered: false,
  });

  const monitoringData = useLocalStorageSync('jssip_monitoring_data', {
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
      signalStrength: 1,
    },
    systemAnalysis: {
      overallHealth: 0,
      wsHealth: 'unknown',
      sipHealth: 'unknown',
      networkOnline: true,
      networkQuality: 'unknown',
      signalStrength: 1,
      recentTimeouts: 0,
      wsConnected: false,
      isUARegistered: false,
    },
  });

  // ADDED: Store frozen data when auto-refresh is turned OFF
  useEffect(() => {
    if (!autoRefresh && !frozenData) {
      // Store current state when auto-refresh is turned OFF
      setFrozenData({
        uaStatus,
        connectionStatus,
        monitoringData,
        timestamp: new Date().toISOString(),
      });
    } else if (autoRefresh && frozenData) {
      // Clear frozen data when auto-refresh is turned ON
      setFrozenData(null);
    }
  }, [autoRefresh, uaStatus, connectionStatus, monitoringData, frozenData]);

  // MODIFIED: Use frozen data when auto-refresh is OFF
  const getCurrentData = useCallback(() => {
    if (!autoRefresh && frozenData) {
      return frozenData;
    }
    return { uaStatus, connectionStatus, monitoringData };
  }, [autoRefresh, frozenData, uaStatus, connectionStatus, monitoringData]);

  const calculateKeepAliveHealth = useCallback(() => {
    const currentData = getCurrentData();
    const data = currentData.monitoringData;

    if (!data?.messageDifference || !Array.isArray(data.messageDifference) || data.messageDifference.length === 0) {
      return 0;
    }

    const lastMessage = data.messageDifference[data.messageDifference.length - 1];
    if (!lastMessage?.messageTime) return 0;

    const timeSinceLastMessage = Date.now() - lastMessage.messageTime;
    return Math.max(0, 100 - Math.floor(timeSinceLastMessage / 140));
  }, [getCurrentData]);

  const getTimeSinceLastKeepAlive = useCallback(() => {
    const currentData = getCurrentData();
    const data = currentData.monitoringData;

    if (!data?.messageDifference || !Array.isArray(data.messageDifference) || data.messageDifference.length === 0)
      return '---';

    const lastMessage = data.messageDifference[data.messageDifference.length - 1];
    if (!lastMessage || !lastMessage.messageTime) return '---';

    return Math.floor((Date.now() - lastMessage.messageTime) / 1000);
  }, [getCurrentData]);

  const isKeepAliveHealthy = useCallback(() => {
    const currentData = getCurrentData();
    const data = currentData.monitoringData;

    if (!data?.messageDifference || !Array.isArray(data.messageDifference) || data.messageDifference.length === 0)
      return false;

    const lastMessage = data.messageDifference[data.messageDifference.length - 1];
    if (!lastMessage || !lastMessage.messageTime) return false;

    return Date.now() - lastMessage.messageTime < 14000;
  }, [getCurrentData]);

  // MODIFIED: Use current data (frozen or live)
  const getWebSocketReadyState = useCallback(() => {
    const currentData = getCurrentData();
    const monitoring = currentData.monitoringData;
    const ua = currentData.uaStatus;

    if (monitoring.systemAnalysis?.wsConnected) {
      return 'OPEN';
    } else if (monitoring.systemAnalysis?.wsHealth === 'healthy') {
      return 'OPEN';
    } else if (ua.transport?.readyState === 1) {
      return 'OPEN';
    } else if (ua.transport?.readyState === 0) {
      return 'CONNECTING';
    } else if (ua.transport?.readyState === 2) {
      return 'CLOSING';
    } else if (ua.transport?.readyState === 3) {
      return 'CLOSED';
    } else {
      return 'UNKNOWN';
    }
  }, [getCurrentData]);

  const getConnectionUptime = useCallback(() => {
    const currentData = getCurrentData();
    const uptime = currentData.monitoringData.performanceMetrics?.connectionUptime || 0;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [getCurrentData]);

  const getNetworkQuality = useCallback(() => {
    const currentData = getCurrentData();
    const quality = currentData.monitoringData.systemAnalysis?.networkQuality || 'unknown';
    const rtt = currentData.monitoringData.networkInfo?.rtt || 0;

    let color = 'text-gray-600';
    switch (quality) {
      case 'excellent':
        color = 'text-green-600';
        break;
      case 'good':
        color = 'text-blue-600';
        break;
      case 'fair':
        color = 'text-yellow-600';
        break;
      case 'poor':
        color = 'text-red-600';
        break;
    }

    return { quality: quality.charAt(0).toUpperCase() + quality.slice(1), color };
  }, [getCurrentData]);

  // MODIFIED: Use current data for component status
  const buildCurrentComponentStatus = useCallback(() => {
    const currentData = getCurrentData();
    const ua = currentData.uaStatus;
    const monitoring = currentData.monitoringData;
    const timeoutCount = monitoring.timeoutArray ? monitoring.timeoutArray.length : 0;
    const webSocketState = getWebSocketReadyState();
    const networkQuality = getNetworkQuality();
    const systemAnalysis = monitoring.systemAnalysis || {};

    return [
      {
        component: 'WebSocket Connection',
        status:
          systemAnalysis.wsHealth === 'healthy'
            ? 'healthy'
            : systemAnalysis.wsConnected
            ? 'healthy'
            : ua.isConnected
            ? 'healthy'
            : 'critical',
        details:
          systemAnalysis.wsHealth === 'healthy' || systemAnalysis.wsConnected || ua.isConnected
            ? `Active connection (${webSocketState})`
            : `Connection failed (${webSocketState})`,
      },
      {
        component: 'SIP Registration',
        status:
          systemAnalysis.sipHealth === 'healthy'
            ? 'healthy'
            : systemAnalysis.isUARegistered
            ? 'healthy'
            : ua.isRegistered
            ? 'healthy'
            : 'critical',
        details:
          systemAnalysis.sipHealth === 'healthy' || systemAnalysis.isUARegistered || ua.isRegistered
            ? `Registered (expires: ${
                ua.registrator?.expires ? new Date(ua.registrator.expires * 1000).toLocaleTimeString() : 'N/A'
              })`
            : 'Registration failed',
      },
      {
        component: 'UA Transport Layer',
        status: ua.transport?.connected ? 'healthy' : ua.transport?.connecting ? 'warning' : 'critical',
        details: ua.transport?.connected
          ? 'Transport connected'
          : ua.transport?.connecting
          ? 'Transport connecting...'
          : 'Transport disconnected',
      },
      {
        component: 'Keep-Alive Messages',
        status: isKeepAliveHealthy() ? 'healthy' : 'critical',
        details:
          monitoring.messageDifference && monitoring.messageDifference.length > 0
            ? `Last message: ${getTimeSinceLastKeepAlive()}s ago`
            : 'No keep-alive data available',
      },
      {
        component: 'Network Quality',
        status:
          networkQuality.quality === 'Excellent'
            ? 'healthy'
            : networkQuality.quality === 'Good'
            ? 'healthy'
            : networkQuality.quality === 'Fair'
            ? 'warning'
            : 'critical',
        details: `${networkQuality.quality} (${
          monitoring.networkInfo?.effectiveType?.toUpperCase() || 'Unknown'
        }, RTT: ${Math.round(monitoring.networkInfo?.rtt || 0)}ms)`,
      },
      {
        component: 'System Timeouts',
        status: timeoutCount > 5 ? 'critical' : timeoutCount > 0 ? 'warning' : 'healthy',
        details: `${timeoutCount} timeout events detected`,
      },
    ];
  }, [getCurrentData, isKeepAliveHealthy, getTimeSinceLastKeepAlive, getWebSocketReadyState, getNetworkQuality]);

  // MODIFIED: Use current data for system health
  const calculateSystemHealth = useCallback(() => {
    const currentData = getCurrentData();
    return currentData.monitoringData.systemAnalysis?.overallHealth || 0;
  }, [getCurrentData]);

  const generateUnifiedMonitoringEntries = useCallback(() => {
    const timestamp = new Date().toISOString();
    const currentComponents = buildCurrentComponentStatus();
    const entries = [];
    const currentData = getCurrentData();

    currentComponents.forEach((component) => {
      const severity =
        component.status === 'critical'
          ? 'critical'
          : component.status === 'warning'
          ? 'warning'
          : component.status === 'healthy'
          ? 'success'
          : 'info';

      entries.push({
        id: `live_${component.component.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random()}`,
        timestamp,
        entryType: 'Live Status',
        component: component.component,
        status: component.status,
        severity,
        description: `Current status: ${component.details}`,
        systemHealth: calculateSystemHealth(),
        keepAliveHealth: calculateKeepAliveHealth(),
        webSocketConnected: currentData.monitoringData.systemAnalysis?.wsConnected || currentData.uaStatus.isConnected,
        sipRegistered: currentData.monitoringData.systemAnalysis?.isUARegistered || currentData.uaStatus.isRegistered,
        webSocketState: getWebSocketReadyState(),
        timeoutCount: currentData.monitoringData.timeoutArray?.length || 0,
        avgResponseTime: currentData.monitoringData.performanceMetrics?.averageResponseTime || 0,
        networkType: currentData.monitoringData.networkInfo?.effectiveType || 'unknown',
        signalStrength: currentData.monitoringData.systemAnalysis?.signalStrength || 1,
        networkQuality: currentData.monitoringData.systemAnalysis?.networkQuality || 'unknown',
      });

      let eventType, eventDescription;
      switch (component.status) {
        case 'healthy':
          eventType = 'Success Event';
          eventDescription = `SUCCESS: ${component.component} - ${component.details}`;
          break;
        case 'warning':
          eventType = 'Warning Event';
          eventDescription = `WARNING: ${component.component} - ${component.details}`;
          break;
        case 'critical':
          eventType = 'Failure Event';
          eventDescription = `CRITICAL: ${component.component} - ${component.details}`;
          break;
        default:
          eventType = 'Status Event';
          eventDescription = `STATUS: ${component.component} - ${component.details}`;
      }

      entries.push({
        id: `event_${eventType.toLowerCase().replace(/\s+/g, '_')}_${component.component
          .toLowerCase()
          .replace(/\s+/g, '_')}_${Date.now()}_${Math.random()}`,
        timestamp,
        entryType: eventType,
        component: component.component,
        status: component.status,
        severity,
        description: eventDescription,
        systemHealth: calculateSystemHealth(),
        keepAliveHealth: calculateKeepAliveHealth(),
        webSocketConnected: currentData.monitoringData.systemAnalysis?.wsConnected || currentData.uaStatus.isConnected,
        sipRegistered: currentData.monitoringData.systemAnalysis?.isUARegistered || currentData.uaStatus.isRegistered,
        webSocketState: getWebSocketReadyState(),
        timeoutCount: currentData.monitoringData.timeoutArray?.length || 0,
        avgResponseTime: currentData.monitoringData.performanceMetrics?.averageResponseTime || 0,
        networkType: currentData.monitoringData.networkInfo?.effectiveType || 'unknown',
        signalStrength: currentData.monitoringData.systemAnalysis?.signalStrength || 1,
        networkQuality: currentData.monitoringData.systemAnalysis?.networkQuality || 'unknown',
      });
    });

    return entries;
  }, [
    buildCurrentComponentStatus,
    calculateSystemHealth,
    calculateKeepAliveHealth,
    getCurrentData,
    getWebSocketReadyState,
  ]);

  const safelyUpdateMonitoringData = useCallback((updateFn) => {
    try {
      setIsLoading(true);
      setError(null);
      setUnifiedMonitoringData((prev) => {
        const result = updateFn(prev);
        try {
          localStorage.setItem('jssip_unified_monitoring', JSON.stringify(result));
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
          setError('Failed to save monitoring data. Storage may be full.');
        }
        return result;
      });
    } catch (err) {
      setError('Failed to update monitoring data');
      console.error('Monitoring update error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    const newEntries = generateUnifiedMonitoringEntries();
    safelyUpdateMonitoringData((prev) => {
      return [...prev, ...newEntries].slice(-MAX_STORAGE_RECORDS);
    });
    setCurrentTime(new Date().toLocaleTimeString());
  }, [generateUnifiedMonitoringEntries, safelyUpdateMonitoringData]);

  const currentComponents = useMemo(() => buildCurrentComponentStatus(), [buildCurrentComponentStatus]);
  const systemHealthScore = useMemo(() => calculateSystemHealth(), [calculateSystemHealth]);
  const criticalIssues = useMemo(
    () => currentComponents.filter((c) => c.status === 'critical').length,
    [currentComponents]
  );

  const { totalLiveEntries, totalSuccessEvents, totalWarningEvents, totalFailureEvents } = useMemo(
    () => ({
      totalLiveEntries: unifiedMonitoringData.filter((entry) => entry.entryType === 'Live Status').length,
      totalSuccessEvents: unifiedMonitoringData.filter((entry) => entry.entryType === 'Success Event').length,
      totalWarningEvents: unifiedMonitoringData.filter((entry) => entry.entryType === 'Warning Event').length,
      totalFailureEvents: unifiedMonitoringData.filter((entry) => entry.entryType === 'Failure Event').length,
    }),
    [unifiedMonitoringData]
  );

  const getFilteredData = useCallback(() => {
    let filtered = [...unifiedMonitoringData];

    if (viewMode === 'live') {
      filtered = filtered.filter((entry) => entry.entryType === 'Live Status');
    } else if (viewMode === 'history') {
      filtered = filtered.filter((entry) => entry.entryType !== 'Live Status');
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter((entry) => entry.severity === filterSeverity);
    }

    return filtered.reverse().slice(0, MAX_DISPLAY_RECORDS);
  }, [unifiedMonitoringData, viewMode, filterSeverity]);

  const filteredData = useMemo(() => getFilteredData(), [getFilteredData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'info':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEntryTypeColor = (entryType) => {
    switch (entryType) {
      case 'Live Status':
        return 'bg-primary text-primary-foreground border-primary/20';
      case 'Success Event':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Warning Event':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Failure Event':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Status Event':
        return 'bg-secondary text-secondary-foreground border-secondary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const exportAllData = () => {
    const currentData = getCurrentData();
    const exportData = {
      unifiedMonitoringData,
      exportTimestamp: new Date().toISOString(),
      totalEntries: unifiedMonitoringData.length,
      systemStatus: {
        webSocketConnected: currentData.monitoringData.systemAnalysis?.wsConnected || currentData.uaStatus.isConnected,
        sipRegistered: currentData.monitoringData.systemAnalysis?.isUARegistered || currentData.uaStatus.isRegistered,
        systemHealth: systemHealthScore,
        timeoutCount: currentData.monitoringData.timeoutArray?.length || 0,
        signalStrength: currentData.monitoringData.systemAnalysis?.signalStrength || 1,
        networkQuality: currentData.monitoringData.systemAnalysis?.networkQuality || 'unknown',
      },
      summary: {
        totalLiveEntries,
        totalSuccessEvents,
        totalWarningEvents,
        totalFailureEvents,
      },
      frozenState: !autoRefresh ? frozenData : null,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `jssip-network-monitoring-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearAllData = () => {
    setUnifiedMonitoringData([]);
    localStorage.removeItem('jssip_unified_monitoring');
    setError(null);
  };

  const dataTableColumns = [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: ({ row }) => (
        <span className="text-foreground text-sm">
          {moment(row.original.timestamp).format('DD MMM YYYY, hh:mm:ss A')}
        </span>
      ),
    },
    {
      header: 'Event Type',
      accessorKey: 'entryType',
      cell: ({ row }) => <Badge className={getEntryTypeColor(row.original.entryType)}>{row.original.entryType}</Badge>,
    },
    {
      header: 'Network Component',
      accessorKey: 'component',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.component}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="flex items-center">
          {getStatusIcon(row.original.status)}
          <Badge className={`ml-2 ${getStatusColor(row.original.status)}`}>{row.original.status}</Badge>
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
        <span className="text-sm text-muted-foreground max-w-md truncate" title={row.original.description}>
          {row.original.description}
        </span>
      ),
    },
    {
      header: 'System Health',
      accessorKey: 'systemHealth',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Progress value={row.original.systemHealth} className="w-16 h-2 mr-2" />
          <span className={`text-sm ${row.original.systemHealth < 50 ? 'text-destructive' : 'text-green-600'}`}>
            {row.original.systemHealth}%
          </span>
        </div>
      ),
    },
    {
      header: 'Network Signal',
      accessorKey: 'signalStrength',
      cell: ({ row }) => (
        <NetworkQualityBars
          signalStrength={row.original.signalStrength || 1}
          networkQuality={row.original.networkQuality || 'unknown'}
        />
      ),
    },
    {
      header: 'WebSocket Status',
      accessorKey: 'webSocketConnected',
      cell: ({ row }) => (
        <Badge
          className={
            row.original.webSocketConnected
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }
        >
          {row.original.webSocketConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      ),
    },
    {
      header: 'SIP Registration',
      accessorKey: 'sipRegistered',
      cell: ({ row }) => (
        <Badge
          className={
            row.original.sipRegistered
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }
        >
          {row.original.sipRegistered ? 'Registered' : 'Failed'}
        </Badge>
      ),
    },
    {
      header: 'Response Time',
      accessorKey: 'avgResponseTime',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.avgResponseTime ? `${row.original.avgResponseTime.toFixed(0)}ms` : 'N/A'}
        </span>
      ),
    },
  ];

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());

    const existingData = localStorage.getItem('jssip_unified_monitoring');
    if (existingData) {
      try {
        setUnifiedMonitoringData(JSON.parse(existingData));
      } catch (error) {
        console.error('Error loading unified monitoring data:', error);
      }
    }
  }, []);

  // MODIFIED: Only run interval when autoRefresh is ON
  useEffect(() => {
    if (!mounted || !autoRefresh) return;

    const timeUpdateInterval = setInterval(() => {
      handleManualRefresh();
    }, refreshInterval);

    return () => clearInterval(timeUpdateInterval);
  }, [mounted, autoRefresh, refreshInterval, handleManualRefresh]);

  if (!mounted) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Loading Network Monitor</h2>
            <p className="text-sm text-muted-foreground mt-2">Initializing real-time monitoring system...</p>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, icon, value, description, borderColor = 'border-l-primary', subStats }) => {
    return (
      <Card
        className={`shadow border border-l-4 ${borderColor} transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg w-full max-w-full`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs sm:text-sm font-medium text-primary truncate">{title}</CardTitle>
          <span className="shrink-0">{icon}</span>
        </CardHeader>
        <CardContent className="pt-1 pb-2">
          <div className="text-lg sm:text-xl font-bold break-words">{value}</div>
          {description && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words">{description}</p>}
          {subStats && (
            <div className="flex flex-col sm:flex-row flex-wrap items-start gap-1 sm:gap-2 mt-1.5 text-xs sm:text-sm text-muted-foreground">
              {subStats.map((stat, index) => (
                <span key={index} className="flex items-center gap-1 min-w-0">
                  {stat.icon && <span className="shrink-0">{stat.icon}</span>}
                  <span className="font-semibold">{stat.value}</span>
                  <span className="truncate">{stat.label}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Use current data for displaying stats
  const currentData = getCurrentData();
  const currentUA = currentData.uaStatus;
  const currentMonitoring = currentData.monitoringData;

  return (
    <>
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onClose={closeTimeoutModal}
        onLoginSuccess={handleLoginSuccess}
        userLogin={userLogin}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">Network Monitoring Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time JsSIP network monitoring with system analysis</p>
            {!autoRefresh && frozenData && (
              <div className="mt-2">
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  ⏸️ PAUSED - Data frozen at {moment(frozenData.timestamp).format('HH:mm:ss')}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-muted text-muted-foreground">
              <Database className="w-3 h-3 mr-1" />
              {unifiedMonitoringData.length} Records
            </Badge>
            <Badge className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {totalSuccessEvents} Success
            </Badge>
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {totalWarningEvents} Warnings
            </Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              <XCircle className="w-3 h-3 mr-1" />
              {totalFailureEvents} Failures
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="WebSocket Connection"
            value={currentMonitoring.systemAnalysis?.wsConnected || currentUA.isConnected ? 'Connected' : 'FAILED'}
            description={`State: ${getWebSocketReadyState()}`}
            icon={
              currentMonitoring.systemAnalysis?.wsConnected || currentUA.isConnected ? (
                <Wifi className="h-6 w-6 text-blue-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )
            }
            borderColor={
              currentMonitoring.systemAnalysis?.wsConnected || currentUA.isConnected
                ? 'border-l-blue-500'
                : 'border-l-red-500'
            }
          />

          <StatCard
            title="SIP Registration"
            value={currentMonitoring.systemAnalysis?.isUARegistered || currentUA.isRegistered ? 'Active' : 'FAILED'}
            description={`Uptime: ${getConnectionUptime()}`}
            icon={
              currentMonitoring.systemAnalysis?.isUARegistered || currentUA.isRegistered ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )
            }
            borderColor={
              currentMonitoring.systemAnalysis?.isUARegistered || currentUA.isRegistered
                ? 'border-l-green-500'
                : 'border-l-red-500'
            }
            subStats={[
              {
                icon: <span className="h-2 w-2 bg-green-500 rounded-full" />,
                value: getConnectionUptime(),
                label: 'Uptime',
              },
            ]}
          />

          <StatCard
            title="Network Quality"
            value={getNetworkQuality().quality}
            description={`${Math.round(currentMonitoring.networkInfo?.rtt || 0)}ms`}
            icon={
              <NetworkQualityBars
                signalStrength={currentMonitoring.systemAnalysis?.signalStrength || 1}
                networkQuality={currentMonitoring.systemAnalysis?.networkQuality || 'unknown'}
              />
            }
            borderColor={
              getNetworkQuality().quality === 'Good'
                ? 'border-l-green-500'
                : getNetworkQuality().quality === 'Fair'
                ? 'border-l-yellow-500'
                : 'border-l-red-500'
            }
          />

          <StatCard
            title="System Health"
            value={`${systemHealthScore}%`}
            description={`Timeouts: ${currentMonitoring.systemAnalysis?.recentTimeouts || 0}`}
            icon={
              <div className="flex items-center">
                {systemHealthScore > 80 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : systemHealthScore > 50 ? (
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
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

        {criticalIssues > 0 && (
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">CRITICAL NETWORK FAILURES DETECTED</AlertTitle>
            <AlertDescription className="text-destructive/80">
              {criticalIssues} critical network issues require immediate attention. Connection functionality may be
              compromised.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Monitoring Error</AlertTitle>
            <AlertDescription className="text-destructive/80">
              {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Network Component Status */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">Network Component Status</CardTitle>
            <CardDescription>Real-time status of JsSIP network components with signal analysis</CardDescription>
            {!autoRefresh && (
              <div className="mt-2">
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  ⏸️ FROZEN - Auto-refresh is OFF
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentComponents.map((component, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(component.status)}
                    <div>
                      <h3 className="font-medium text-card-foreground">{component.component}</h3>
                      <p className="text-sm text-muted-foreground">{component.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {component.component === 'Network Quality' && (
                      <NetworkQualityBars
                        signalStrength={currentMonitoring.systemAnalysis?.signalStrength || 1}
                        networkQuality={currentMonitoring.systemAnalysis?.networkQuality || 'unknown'}
                      />
                    )}
                    <Badge className={getStatusColor(component.status)}>{component.status}</Badge>
                    <span className="text-xs text-muted-foreground">{!autoRefresh ? 'Frozen' : currentTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-primary">Network Monitoring Data</CardTitle>
                <CardDescription>
                  Live network status updates and events - {filteredData.length} entries shown
                  {filteredData.length >= MAX_DISPLAY_RECORDS && ` (limited to ${MAX_DISPLAY_RECORDS})`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="sm:block hidden">Refresh</span>
                </Button>
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  <span className="sm:block hidden">{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
                </Button>
                <Button variant="outline" onClick={exportAllData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="sm:block hidden">Export</span>
                </Button>
                <Button variant="outline" onClick={clearAllData} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span className="sm:block hidden">Clear</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select view mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      All ({unifiedMonitoringData.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="live">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Live ({totalLiveEntries})
                    </div>
                  </SelectItem>
                  <SelectItem value="history">
                    <div className="flex items-center">
                      <History className="w-4 h-4 mr-2" />
                      History ({totalSuccessEvents + totalWarningEvents + totalFailureEvents})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      All Severity
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Success ({totalSuccessEvents})
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                      Warning ({totalWarningEvents})
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      Critical ({totalFailureEvents})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable data={filteredData} columns={dataTableColumns} />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SystemFailureMonitors;
