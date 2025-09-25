import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import moment from 'moment/moment';
import DataTable from './DataTable';

const SystemFailureMonitors = () => {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [unifiedMonitoringData, setUnifiedMonitoringData] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'live', 'history'
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all', 'success', 'warning', 'critical'

  // Custom hook for localStorage with cross-tab sync
  const useLocalStorageSync = (key, defaultValue) => {
    const [storedValue, setStoredValue] = useState(defaultValue);

    useEffect(() => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item).data);
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
      }
    }, [key]);

    useEffect(() => {
      const handleStorageChange = (e) => {
        if (e.key === key && e.newValue) {
          try {
            setStoredValue(JSON.parse(e.newValue).data);
          } catch (error) {
            console.error('Error parsing storage event:', error);
          }
        }
      };

      const handleBroadcastMessage = (event) => {
        if (event.data.key === key) {
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
    }, [key]);

    return storedValue;
  };

  // Load REAL data from localStorage with cross-tab sync (NO MOCK DATA)
  const uaStatus = useLocalStorageSync('jssip_ua_status', { isConnected: false, isRegistered: false });
  const connectionStatus = useLocalStorageSync('jssip_connection_status', {
    connectionStatus: 'disconnected',
    isConnectionLost: false,
  });
  const callStatus = useLocalStorageSync('jssip_call_status', {
    status: 'start',
    isIncomingRinging: false,
  });
  const monitoringData = useLocalStorageSync('jssip_monitoring_data', {
    timeoutArray: [],
    messageDifference: [],
  });

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());

    // Load existing unified monitoring data
    const existingData = localStorage.getItem('jssip_unified_monitoring');
    if (existingData) {
      try {
        setUnifiedMonitoringData(JSON.parse(existingData));
      } catch (error) {
        console.error('Error loading unified monitoring data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timeUpdateInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());

      // Generate unified monitoring entries from REAL data
      const newEntries = generateUnifiedMonitoringEntries();

      // Update unified monitoring data (keep last 2000 entries)
      setUnifiedMonitoringData((prev) => {
        const updatedData = [...prev, ...newEntries].slice(-2000);
        localStorage.setItem('jssip_unified_monitoring', JSON.stringify(updatedData));
        return updatedData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(timeUpdateInterval);
  }, [mounted, uaStatus, connectionStatus, callStatus, monitoringData]);

  const calculateKeepAliveHealth = () => {
    if (!monitoringData.messageDifference || monitoringData.messageDifference.length === 0) return 0;
    const lastMessage = monitoringData.messageDifference[monitoringData.messageDifference.length - 1];
    if (!lastMessage || !lastMessage.messageTime) return 0;

    const timeSinceLastMessage = Date.now() - lastMessage.messageTime;
    return Math.max(0, 100 - Math.floor(timeSinceLastMessage / 140));
  };

  const calculateSystemHealth = () => {
    const components = buildCurrentComponentStatus();
    const criticalIssues = components.filter((c) => c.status === 'critical').length;
    const warningIssues = components.filter((c) => c.status === 'warning').length;
    return criticalIssues === 0 ? (warningIssues === 0 ? 100 : 85) : 45;
  };

  const getTimeSinceLastKeepAlive = () => {
    if (!monitoringData.messageDifference || monitoringData.messageDifference.length === 0) return '---';
    const lastMessage = monitoringData.messageDifference[monitoringData.messageDifference.length - 1];
    if (!lastMessage || !lastMessage.messageTime) return '---';

    return Math.floor((Date.now() - lastMessage.messageTime) / 1000);
  };

  const isKeepAliveHealthy = () => {
    if (!monitoringData.messageDifference || monitoringData.messageDifference.length === 0) return false;
    const lastMessage = monitoringData.messageDifference[monitoringData.messageDifference.length - 1];
    if (!lastMessage || !lastMessage.messageTime) return false;

    return Date.now() - lastMessage.messageTime < 14000;
  };

  const buildCurrentComponentStatus = () => {
    const timeoutCount = monitoringData.timeoutArray ? monitoringData.timeoutArray.length : 0;

    return [
      {
        component: 'WebSocket Connection',
        status: uaStatus.isConnected ? 'healthy' : 'critical',
        details: uaStatus.isConnected ? 'Active connection' : 'Connection lost',
      },
      {
        component: 'SIP Registration',
        status: uaStatus.isRegistered ? 'healthy' : 'critical',
        details: uaStatus.isRegistered ? 'Registered' : 'Registration failed',
      },
      {
        component: 'Keep-Alive Messages',
        status: isKeepAliveHealthy() ? 'healthy' : 'critical',
        details:
          monitoringData.messageDifference && monitoringData.messageDifference.length > 0
            ? `Last message: ${getTimeSinceLastKeepAlive()}s ago`
            : 'No keep-alive data available',
      },
      {
        component: 'Network Connectivity',
        status: connectionStatus.isConnectionLost ? 'critical' : 'healthy',
        details: connectionStatus.isConnectionLost ? 'Connection lost' : 'Online status monitored',
      },
      {
        component: 'System Timeouts',
        status: timeoutCount > 5 ? 'critical' : timeoutCount > 0 ? 'warning' : 'healthy',
        details: `${timeoutCount} timeout events detected`,
      },
    ];
  };


  const generateUnifiedMonitoringEntries = () => {
    const timestamp = new Date().toISOString();
    const currentComponents = buildCurrentComponentStatus();
    const entries = [];

    // Generate both live status and event entries for each component from REAL data
    currentComponents.forEach((component) => {
      const severity =
        component.status === 'critical'
          ? 'critical'
          : component.status === 'warning'
          ? 'warning'
          : component.status === 'healthy'
          ? 'success'
          : 'info';

      // Live Status Entry
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
        webSocketConnected: uaStatus.isConnected,
        sipRegistered: uaStatus.isRegistered,
        connectionLost: connectionStatus.isConnectionLost,
        timeoutCount: monitoringData.timeoutArray?.length || 0,
        callStatus: callStatus.status,
      });

      // Historical Event Entry
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
        webSocketConnected: uaStatus.isConnected,
        sipRegistered: uaStatus.isRegistered,
        connectionLost: connectionStatus.isConnectionLost,
        timeoutCount: monitoringData.timeoutArray?.length || 0,
        callStatus: callStatus.status,
      });
    });

    return entries;
  };

  // SHADCN CSS VARIABLES COLOR UTILITIES
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

  // SHADCN CSS VARIABLES: Using semantic CSS custom properties
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
    const exportData = {
      unifiedMonitoringData,
      exportTimestamp: new Date().toISOString(),
      totalEntries: unifiedMonitoringData.length,
      summary: {
        totalLiveEntries: unifiedMonitoringData.filter((entry) => entry.entryType === 'Live Status').length,
        totalSuccessEvents: unifiedMonitoringData.filter((entry) => entry.entryType === 'Success Event').length,
        totalWarningEvents: unifiedMonitoringData.filter((entry) => entry.entryType === 'Warning Event').length,
        totalFailureEvents: unifiedMonitoringData.filter((entry) => entry.entryType === 'Failure Event').length,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `jssip-monitoring-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearAllData = () => {
    setUnifiedMonitoringData([]);
    localStorage.removeItem('jssip_unified_monitoring');
  };

  // Filter data based on selected view mode and severity
  const getFilteredData = () => {
    let filtered = [...unifiedMonitoringData];

    // Filter by view mode
    if (viewMode === 'live') {
      filtered = filtered.filter((entry) => entry.entryType === 'Live Status');
    } else if (viewMode === 'history') {
      filtered = filtered.filter((entry) => entry.entryType !== 'Live Status');
    }

    // Filter by severity
    if (filterSeverity !== 'all') {
      filtered = filtered.filter((entry) => entry.severity === filterSeverity);
    }

    return filtered.reverse(); // Most recent first
  };

  // DataTable columns configuration with shadcn colors
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
      header: 'Entry Type',
      accessorKey: 'entryType',
      cell: ({ row }) => <Badge className={getEntryTypeColor(row.original.entryType)}>{row.original.entryType}</Badge>,
    },
    {
      header: 'Component',
      accessorKey: 'component',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.component}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge className={`ml-2 ${getStatusColor(row.original.status)}`}>{row.original.status}</Badge>,
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
      header: 'WebSocket',
      accessorKey: 'webSocketConnected',
      cell: ({ row }) => (
        <Badge
          className={
            row.original.webSocketConnected
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }
        >
          {row.original.webSocketConnected ? 'Connected' : 'Failed'}
        </Badge>
      ),
    },
    {
      header: 'SIP Status',
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
  ];

  if (!mounted) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Loading System Monitor</h2>
            <p className="text-sm text-muted-foreground mt-2">Initializing real-time monitoring system...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentComponents = buildCurrentComponentStatus();
  const criticalIssues = currentComponents.filter((c) => c.status === 'critical').length;
  const warningIssues = currentComponents.filter((c) => c.status === 'warning').length;
  const systemHealthScore = calculateSystemHealth();

  const totalLiveEntries = unifiedMonitoringData.filter((entry) => entry.entryType === 'Live Status').length;
  const totalSuccessEvents = unifiedMonitoringData.filter((entry) => entry.entryType === 'Success Event').length;
  const totalWarningEvents = unifiedMonitoringData.filter((entry) => entry.entryType === 'Warning Event').length;
  const totalFailureEvents = unifiedMonitoringData.filter((entry) => entry.entryType === 'Failure Event').length;

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">System Monitoring Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time system monitoring with live status tracking and comprehensive event history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground">
            <Database className="w-3 h-3 mr-1" />
            {unifiedMonitoringData.length} Total Records
          </Badge>
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {totalSuccessEvents} Success
          </Badge>
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {totalWarningEvents} Warnings
          </Badge>
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {totalFailureEvents} Failures
          </Badge>
        </div>
      </div>

      {/* System Status Cards with SHADCN CSS variables */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">WebSocket Status</p>
                <h2 className="text-2xl font-bold mt-2 text-card-foreground">
                  {uaStatus.isConnected ? 'Connected' : 'FAILED'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Transport Layer</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                {uaStatus.isConnected ? (
                  <Wifi className="h-6 w-6 text-primary" />
                ) : (
                  <WifiOff className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SIP Registration</p>
                <h2 className="text-2xl font-bold mt-2 text-card-foreground">
                  {uaStatus.isRegistered ? 'Active' : 'FAILED'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">SIP Layer</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                {uaStatus.isRegistered ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Live Records</p>
                <h2 className="text-2xl font-bold mt-2 text-card-foreground">{totalLiveEntries}</h2>
                <p className="text-xs text-muted-foreground mt-1">Current Status Entries</p>
              </div>
              <div className="bg-secondary p-3 rounded-lg border border-border">
                <Eye className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <h2 className="text-2xl font-bold mt-2 text-card-foreground">{systemHealthScore}%</h2>
                <p className="text-xs text-muted-foreground mt-1">Overall Health Score</p>
              </div>
              <div className="bg-accent p-3 rounded-lg border border-border">
                {systemHealthScore > 80 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalIssues > 0 && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">CRITICAL SYSTEM FAILURES DETECTED</AlertTitle>
          <AlertDescription className="text-destructive/80">
            {criticalIssues} critical system failures require immediate attention. System functionality may be
            compromised.
          </AlertDescription>
        </Alert>
      )}

      {/* System Components Status */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary">System Component Status</CardTitle>
          <CardDescription>Real-time status of critical JsSIP system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentComponents.map((component, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <h3 className="font-medium text-card-foreground">{component.component}</h3>
                    <p className="text-sm text-muted-foreground">{component.details}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(component.status)}>{component.status}</Badge>
                  <span className="text-xs text-muted-foreground">{currentTime}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DataTable with Dropdown Filters */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-primary">System Monitoring Data</CardTitle>
              <CardDescription>
                All live status updates and historical events - {filteredData.length} entries shown
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportAllData} className="flex items-center gap-2 w-max text-primary">
                <Download className="h-4 w-4" />
                <span className="sm:block hidden"> Export Data</span>
              </Button>
              <Button variant="outline" onClick={clearAllData} className="flex items-center gap-2 w-max text-primary">
                <Trash2 className="h-4 w-4" />
                <span className="sm:block hidden"> Clear History</span>
              </Button>
            </div>
          </div>

          {/* UPDATED: Dropdown Filter Controls */}
          <div className="flex gap-4 mt-4">
            {/* View Mode Select Dropdown */}
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[160px]">
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
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                    Warning ({totalWarningEvents})
                  </div>
                </SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
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
  );
};

export default SystemFailureMonitors;
