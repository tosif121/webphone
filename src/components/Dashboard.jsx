import HistoryContext from '@/context/HistoryContext';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import LeadAndCallInfoPanel from './LeadAndCallInfoPanel';
import Disposition from './Disposition';
import { JssipContext } from '@/context/JssipContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import DropCallsModal from './DropCallsModal';
import ContactCentricWorkspace from './ContactCentricWorkspace';

import {
  Bell,
  PhoneMissed,
  Activity,
  PhoneForwarded,
  ArrowUpRight,
  Clock,
  Users,
  Phone,
  Video,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  NavigationOff,
  Navigation,
  PhoneIncoming,
  List,
  SkipForward,
  RefreshCcw,
  Lock,
} from 'lucide-react';
import CallbackForm from './CallbackForm';
import { useRouter } from 'next/router';
import FollowUpCallsModal from './FollowUpCallsModal';
import moment from 'moment';
import { Button } from './ui/button';
import BreakDropdown from './BreakDropdown';
import { Card, CardContent } from './ui/card';
import SessionTimeoutModal from './SessionTimeoutModal';
import { endCallAudioBase64 } from '../constants/audioData';
import { DEFAULT_AGENT_UI_PREFERENCES, getStoredAgentUiPreferences } from '@/utils/agent-preferences';
import { useAuth } from '@/hooks/useAuth';
import { normalizePhone } from '@/utils/normalizePhone';

function Dashboard() {
  const {
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
    timeoutMessage,
    activeLead,
    setActiveLead,
    leadLockToken,
    setLeadLockToken,
    agentLifecycle,
    setAgentLifecycle,
    activeCallContext,
  } = useContext(JssipContext);

  const {
    username,
    dropCalls,
    setDropCalls,
    selectedBreak,
    setSelectedStatus,
    setInfo,
    info,
    campaignMissedCallsLength,
    setCampaignMissedCallsLength,
    callAlert,
    setCallAlert,
    scheduleCallsLength,
    setScheduleCallsLength,
    selectedStatus,
  } = useContext(HistoryContext);

  const { token, user: authUser } = useAuth();
  const [usermissedCalls, setUsermissedCalls] = useState([]);
  const [leadsData, setLeadsData] = useState([]);
  const [apiCallData, setApiCallData] = useState([]);
  const endCallAudioRef = useRef(null);
  const userCampaign = authUser?.campaign || '';
  const campaignName = authUser?.campaignName || 'N/A';
  const previewLeadMode = useMemo(
    () => String(authUser?.leadDistributionStrategy || 'manual_pull').trim().toLowerCase() === 'manual_pull',
    [authUser?.leadDistributionStrategy],
  );

  const router = useRouter();
  const computedMissedCallsLength = useMemo(() => {
    return Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign).length;
  }, [usermissedCalls, userCampaign]);

  const [leadDashboardLoading, setLeadDashboardLoading] = useState(false);
  const [callDataLoading, setCallDataLoading] = useState(false);
  const [smartLeadLoading, setSmartLeadLoading] = useState(false);
  const [smartLeadError, setSmartLeadError] = useState('');
  const [leadError, setLeadError] = useState('');
  const [callError, setCallError] = useState('');

  const [startDate, setStartDate] = useState(moment().startOf('day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [workspaceDatePreset, setWorkspaceDatePreset] = useState('today');

  const [activeMainTab, setActiveMainTab] = useState(DEFAULT_AGENT_UI_PREFERENCES.defaultWorkspaceTab);
  const [activeMetricFilter, setActiveMetricFilter] = useState('all');
  const [workspaceLayoutState, setWorkspaceLayoutState] = useState({
    shouldReserveSpace: false,
    dialerDockMode: 'right',
    dialerLayoutMode: 'overlay',
  });
  const [leadStats, setLeadStats] = useState({
    assignedLeads: 0,
    contactedLeads: 0,
    pendingLeads: 0,
    completedLeads: 0,
  });

  const [callStats, setCallStats] = useState({
    incomingCalls: 0,
    outgoingCalls: 0,
    totalCalls: 0,
    connectedCalls: 0,
    avgDurationSeconds: 0,
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const dashboardErrorMessage = useMemo(() => {
    return [leadError, callError].filter(Boolean).join(' ');
  }, [callError, leadError]);
  const leadDashboardFetchInFlightRef = useRef(false);
  const queuedLeadDashboardRefreshRef = useRef(false);
  const leadDashboardDebounceRef = useRef(null);
  const callStatsFetchInFlightRef = useRef(false);
  const nextLeadFetchInFlightRef = useRef(false);

  useEffect(() => {
    const storedPreferences = getStoredAgentUiPreferences();
    setActiveMainTab(
      storedPreferences.defaultWorkspaceTab ||
        storedPreferences.defaultMainTab ||
        DEFAULT_AGENT_UI_PREFERENCES.defaultWorkspaceTab,
    );
    setWorkspaceLayoutState((prev) => ({
      ...prev,
      dialerDockMode: storedPreferences.dialerDockMode || DEFAULT_AGENT_UI_PREFERENCES.dialerDockMode,
      dialerLayoutMode: storedPreferences.dialerLayoutMode || DEFAULT_AGENT_UI_PREFERENCES.dialerLayoutMode,
    }));

    const handleProfileUpdated = (event) => {
      const nextPreferences = event?.detail || getStoredAgentUiPreferences();
      setActiveMainTab(
        nextPreferences.defaultWorkspaceTab ||
          nextPreferences.defaultMainTab ||
          DEFAULT_AGENT_UI_PREFERENCES.defaultWorkspaceTab,
      );
      setWorkspaceLayoutState((prev) => ({
        ...prev,
        dialerDockMode: nextPreferences.dialerDockMode || DEFAULT_AGENT_UI_PREFERENCES.dialerDockMode,
        dialerLayoutMode: nextPreferences.dialerLayoutMode || DEFAULT_AGENT_UI_PREFERENCES.dialerLayoutMode,
      }));
    };

    const handleDialerLayoutChange = (event) => {
      const nextLayout = event?.detail || {};
      setWorkspaceLayoutState((prev) => ({
        shouldReserveSpace: Boolean(nextLayout.shouldReserveSpace),
        dialerDockMode: nextLayout.dialerDockMode || prev.dialerDockMode || DEFAULT_AGENT_UI_PREFERENCES.dialerDockMode,
        dialerLayoutMode:
          nextLayout.dialerLayoutMode || prev.dialerLayoutMode || DEFAULT_AGENT_UI_PREFERENCES.dialerLayoutMode,
      }));
    };

    window.addEventListener('agent-profile-updated', handleProfileUpdated);
    window.addEventListener('webphone-layout-change', handleDialerLayoutChange);
    return () => {
      window.removeEventListener('agent-profile-updated', handleProfileUpdated);
      window.removeEventListener('webphone-layout-change', handleDialerLayoutChange);
    };
  }, []);

  const getAuthHeaders = useCallback(
    (extraHeaders = {}) =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            ...extraHeaders,
          }
        : extraHeaders,
    [token],
  );

  const clearLeadSelection = useCallback(
    (nextLifecycle = 'idle') => {
      setActiveLead((prevLead) => (prevLead ? null : prevLead));
      setLeadLockToken((prevLockToken) => (prevLockToken ? '' : prevLockToken));
      setAgentLifecycle((prevLifecycle) => (prevLifecycle === nextLifecycle ? prevLifecycle : nextLifecycle));
    },
    [setActiveLead, setAgentLifecycle, setLeadLockToken],
  );

  const applyLockedLeadState = useCallback(
    (nextLead, nextLifecycle = 'lead_locked') => {
      if (!nextLead) {
        clearLeadSelection(nextLifecycle === 'lead_locked' ? 'idle' : nextLifecycle);
        return;
      }

      setActiveLead((prevLead) => {
        if (prevLead?.leadId === nextLead?.leadId && prevLead?.lockToken === nextLead?.lockToken) {
          return prevLead;
        }
        return nextLead;
      });
      setLeadLockToken((prevLockToken) => {
        const nextLockToken = nextLead?.lockToken || '';
        return prevLockToken === nextLockToken ? prevLockToken : nextLockToken;
      });
      setAgentLifecycle((prevLifecycle) => (prevLifecycle === nextLifecycle ? prevLifecycle : nextLifecycle));
    },
    [clearLeadSelection, setActiveLead, setAgentLifecycle, setLeadLockToken],
  );

  const fetchLeadsWithDateRange = useCallback(async () => {
    if (!token || !username || !userCampaign) {
      setLeadsData([]);
      setLeadStats({ assignedLeads: 0, contactedLeads: 0, pendingLeads: 0, completedLeads: 0 });
      return;
    }

    if (leadDashboardFetchInFlightRef.current) {
      queuedLeadDashboardRefreshRef.current = true;
      return;
    }

    leadDashboardFetchInFlightRef.current = true;
    setLeadDashboardLoading(true);
    setLeadError('');

    try {
      const leadDashboardResponse = await axios.get(`${window.location.origin}/lead/dashboard`, {
        params: {
          limit: 200,
        },
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });

      const leadDashboard = leadDashboardResponse.data?.result || {};
      const leads = Array.isArray(leadDashboard.leads) ? leadDashboard.leads : [];
      const summary = leadDashboard.summary || leadDashboard.stats || {};
      const completedLeads = Number(summary.completedLeads || 0);
      const pendingLeads = Number(summary.pendingLeads || 0);
      const assignedLeads = Number(summary.totalLeads || leads.length || 0);
      const contactedLeads = Math.max(
        Number(summary.contactedLeads || 0),
        assignedLeads - pendingLeads,
      );

      setLeadsData(leads);
      setLeadStats({
        assignedLeads,
        contactedLeads,
        pendingLeads,
        completedLeads,
      });
    } catch (error) {
      console.error('Error fetching lead dashboard:', error.response?.data || error.message);
      setLeadError(error.response?.data?.message || error.message || 'Failed to fetch leads.');
      setLeadsData([]);
      setLeadStats({ assignedLeads: 0, contactedLeads: 0, pendingLeads: 0, completedLeads: 0 });
    } finally {
      leadDashboardFetchInFlightRef.current = false;
      setLeadDashboardLoading(false);

      if (queuedLeadDashboardRefreshRef.current) {
        queuedLeadDashboardRefreshRef.current = false;
        void fetchLeadsWithDateRange();
      }
    }
  }, [getAuthHeaders, token, userCampaign, username]);

  const queueLeadDashboardFetch = useCallback(
    (delay = 300) => {
      if (!token || !username || !userCampaign) {
        return;
      }

      if (leadDashboardDebounceRef.current) {
        clearTimeout(leadDashboardDebounceRef.current);
      }

      leadDashboardDebounceRef.current = setTimeout(() => {
        leadDashboardDebounceRef.current = null;
        void fetchLeadsWithDateRange();
      }, delay);
    },
    [fetchLeadsWithDateRange, token, userCampaign, username],
  );

  const fetchCallDataByAgent = useCallback(async () => {
    if (!username || !token || !startDate || !endDate) {
      setApiCallData([]);
      setCallStats({ incomingCalls: 0, outgoingCalls: 0, totalCalls: 0, connectedCalls: 0, avgDurationSeconds: 0 });
      return;
    }

    if (callStatsFetchInFlightRef.current) {
      return;
    }

    callStatsFetchInFlightRef.current = true;
    setCallDataLoading(true);
    setCallError('');

    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

      const response = await axios.post(
        `${window.location.origin}/reports/calls/byAgent`,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );

      const calls = response.data.result || [];
      const summary = response.data?.summary || null;
      setApiCallData(calls);

      if (summary) {
        setCallStats({
          incomingCalls: Number(summary.incomingCalls || 0),
          outgoingCalls: Number(summary.outgoingCalls || 0),
          totalCalls: Number(summary.totalCalls || calls.length || 0),
          connectedCalls: Number(summary.connectedCalls || 0),
          avgDurationSeconds: Number(summary.avgDurationSeconds || 0),
        });
      } else {
        const incoming = calls.filter((call) => call.Type?.toLowerCase() === 'incoming').length;
        const outgoing = calls.filter((call) => call.Type?.toLowerCase() !== 'incoming').length;
        const connectedCalls = calls.filter((call) => {
          const durationValue = Number(call?.duration || 0);
          return (
            String(call?.Disposition || '').trim().toLowerCase() === 'answered' ||
            durationValue > 0 ||
            Number(call?.anstime || 0) > 0
          );
        });
        const durationTotal = connectedCalls.reduce((total, call) => {
          const durationValue = Number(call?.duration || 0);
          if (Number.isFinite(durationValue) && durationValue > 0) {
            return total + (durationValue > 100000 ? Math.round(durationValue / 1000) : Math.round(durationValue));
          }
          const answerTime = Number(call?.anstime || 0);
          const hangupTime = Number(call?.hanguptime || 0);
          if (answerTime > 0 && hangupTime > answerTime) {
            const diff = hangupTime - answerTime;
            return total + (diff > 100000 ? Math.round(diff / 1000) : Math.round(diff));
          }
          return total;
        }, 0);

        setCallStats({
          incomingCalls: incoming,
          outgoingCalls: outgoing,
          totalCalls: calls.length,
          connectedCalls: connectedCalls.length,
          avgDurationSeconds: connectedCalls.length > 0 ? Math.round(durationTotal / connectedCalls.length) : 0,
        });
      }
    } catch (error) {
      console.error('Error fetching API data for Call Info tab:', error);
      setCallError(error.response?.data?.message || error.message || 'Failed to fetch call stats.');
      setApiCallData([]);
      setCallStats({ incomingCalls: 0, outgoingCalls: 0, totalCalls: 0, connectedCalls: 0, avgDurationSeconds: 0 });
    } finally {
      callStatsFetchInFlightRef.current = false;
      setCallDataLoading(false);
    }
  }, [endDate, getAuthHeaders, startDate, token, username]);

  const fetchUserMissedCalls = useCallback(async () => {
    if (!token || !username) {
      setUsermissedCalls([]);
      return;
    }

    try {
      const response = await axios.post(
        `${window.location.origin}/userMissedCalls/${username}`,
        {},
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );
      if (response.data) {
        setUsermissedCalls(response.data.result || []);
      }
    } catch (error) {
      console.error('Error fetching missed calls:', error);
      setUsermissedCalls([]);
    }
  }, [getAuthHeaders, token, username]);

  useEffect(
    () => () => {
      if (leadDashboardDebounceRef.current) {
        clearTimeout(leadDashboardDebounceRef.current);
      }
    },
    [],
  );

  const fetchNextLead = useCallback(async () => {
    if (!token || !username || !userCampaign) {
      return null;
    }

    if (nextLeadFetchInFlightRef.current) {
      return activeLead || null;
    }

    nextLeadFetchInFlightRef.current = true;
    setSmartLeadLoading(true);
    setSmartLeadError('');
    try {
      const response = await axios.post(
        `${window.location.origin}/lead/next`,
        {},
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );

      const nextLead = response.data?.result || null;
      applyLockedLeadState(nextLead, nextLead ? 'lead_locked' : 'idle');
      return nextLead;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'No lead available right now.';
      setSmartLeadError(message);
      clearLeadSelection('idle');
      return null;
    } finally {
      nextLeadFetchInFlightRef.current = false;
      setSmartLeadLoading(false);
    }
  }, [activeLead, applyLockedLeadState, clearLeadSelection, getAuthHeaders, token, userCampaign, username]);

  const handleSkipLead = useCallback(async () => {
    if (!activeLead?.leadId || !leadLockToken) {
      return;
    }

    try {
      await axios.post(
        `${window.location.origin}/lead/skip`,
        {
          leadId: activeLead.leadId,
          lockToken: leadLockToken,
        },
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );
      clearLeadSelection('idle');
      void fetchNextLead();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to skip lead.');
    }
  }, [activeLead?.leadId, clearLeadSelection, fetchNextLead, getAuthHeaders, leadLockToken]);

  const handleWorkspaceDatePresetChange = useCallback((nextPreset) => {
    const normalizedPreset = String(nextPreset || 'today').trim().toLowerCase();
    const today = moment();
    setWorkspaceDatePreset(normalizedPreset);

    switch (normalizedPreset) {
      case '7d':
        setStartDate(today.clone().subtract(6, 'days').startOf('day').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      case '30d':
        setStartDate(today.clone().subtract(29, 'days').startOf('day').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      case 'all':
        setStartDate(today.clone().subtract(180, 'days').startOf('day').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      case 'today':
      default:
        setStartDate(today.clone().startOf('day').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
    }
  }, []);

  // Listen for refresh leads event from Layout (after disposition submission)
  useEffect(() => {
    const handleRefreshLeads = () => {
      queueLeadDashboardFetch(150);
    };

    window.addEventListener('refreshLeads', handleRefreshLeads);
    return () => window.removeEventListener('refreshLeads', handleRefreshLeads);
  }, [queueLeadDashboardFetch]);

  // Refresh leads when call ends (dispositionModal opens)
  useEffect(() => {
    if (dispositionModal && userCampaign && username && token && startDate && endDate) {
      queueLeadDashboardFetch(200);
    }
  }, [dispositionModal, endDate, queueLeadDashboardFetch, startDate, token, userCampaign, username]);

  useEffect(() => {
    const now = new Date();
    const processed = (followUpDispoes || [])
      .filter((item) => item.date && item.time)
      .map((item) => {
        const dateTimeStr = `${item.date} ${item.time}`;
        const callTime = moment(dateTimeStr, 'YYYY-MM-DD hh:mm A').toDate();
        return {
          ...item,
          callTime,
          id: `${item.date}-${item.time}-${item.comment || 'call'}`,
        };
      });

    // Show all upcoming calls (where call time is in the future or now)
    const upcomingCalls = processed.filter((item) => item.callTime >= now);

    setScheduleCallsLength(upcomingCalls.length);
  }, [followUpDispoes, setScheduleCallsLength]);

  useEffect(() => {
    if (!token || !username || !userCampaign) {
      return;
    }

    if (!previewLeadMode || status !== 'start' || dispositionModal || selectedBreak !== 'Break') {
      return;
    }

    if (activeLead?.leadId || agentLifecycle === 'dialing' || agentLifecycle === 'on_call' || agentLifecycle === 'disposition') {
      return;
    }

    void fetchNextLead();
  }, [
    token,
    username,
    userCampaign,
    previewLeadMode,
    status,
    dispositionModal,
    selectedBreak,
    activeLead?.leadId,
    agentLifecycle,
    fetchNextLead,
  ]);

  useEffect(() => {
    try {
      if (token && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'token',
            token: token,
            timestamp: Date.now(),
          }),
        );
      }
    } catch (e) {
      console.error('Error sending token to React Native:', e);
    }
  }, [token]);

  useEffect(() => {
    const originalAnswerIncomingCall = window.answerIncomingCall;
    const originalRejectIncomingCall = window.rejectIncomingCall;

    window.onReactNativeMessage = (data) => {
      try {
        if (data?.type === 'call_action') {
          if (data.action === 'accept') {
            window.answerIncomingCall?.();
          } else if (data.action === 'decline') {
            window.rejectIncomingCall?.();
          }
        }
      } catch (err) {
        console.error('[Web] Failed to process message:', err);
      }
    };

    window.answerIncomingCall = function () {
      if (answerIncomingCall && typeof answerIncomingCall === 'function' && incomingSession) {
        answerIncomingCall();
      } else if (originalAnswerIncomingCall && typeof originalAnswerIncomingCall === 'function') {
        originalAnswerIncomingCall();
      }
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: 'call_status',
          status: 'accepted',
        }),
      );
    };

    window.rejectIncomingCall = function () {
      if (rejectIncomingCall && typeof rejectIncomingCall === 'function') {
        rejectIncomingCall();
      } else if (originalRejectIncomingCall && typeof originalRejectIncomingCall === 'function') {
        originalRejectIncomingCall();
      }
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: 'call_status',
          status: 'declined',
        }),
      );
    };

    return () => {
      delete window.onReactNativeMessage;
      if (originalAnswerIncomingCall) {
        window.answerIncomingCall = originalAnswerIncomingCall;
      } else {
        delete window.answerIncomingCall;
      }

      if (originalRejectIncomingCall) {
        window.rejectIncomingCall = originalRejectIncomingCall;
      } else {
        delete window.rejectIncomingCall;
      }
    };
  }, [incomingSession, answerIncomingCall, rejectIncomingCall]);

  useEffect(() => {
    const sendRingingState = () => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'isIncomingRinging',
            value: isIncomingRinging,
          }),
        );
      }
    };

    sendRingingState();
  }, [isIncomingRinging]);

  useEffect(() => {
    setCampaignMissedCallsLength(computedMissedCallsLength);
  }, [computedMissedCallsLength, setCampaignMissedCallsLength]);

  useEffect(() => {
    if (token && username) {
      fetchUserMissedCalls();
    }
  }, [fetchUserMissedCalls, token, username]);

  useEffect(() => {
    if ((status == 'start' && username) || dropCalls) {
      fetchUserMissedCalls();
    }
  }, [dropCalls, fetchUserMissedCalls, status, username]);

  useEffect(() => {
    if (selectedBreak !== 'Break' && ringtone.length >= 0) {
      if (username) {
        fetchUserMissedCalls();
      }
    }
  }, [ringtone, username]);

  useEffect(() => {
    const checkUserAvailability = async () => {
      // Check the conditions first
      if (userCampaign === currentCallData?.campaign && connectionStatus === 'NOT_INUSE' && queueDetails?.length > 0) {
        try {
          const { data } = await axios.post(
            `${window.location.origin}/user/agentAvailable/${username}`,
            {},
            {
              headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            },
          );

          if (data.message === 'User is not live.') {
            toast.error('You are not available for calls. Please make yourself available to handle conference calls.');
            return false;
          }
          return true;
        } catch (error) {
          console.error('Error checking user availability:', error);
          toast.error('Failed to check user availability');
          return false;
        }
      }
      return true;
    };

    checkUserAvailability();
  }, [connectionStatus, currentCallData, getAuthHeaders, queueDetails, userCampaign, username]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!token) {
      router.push('/login');
    }
  }, [router, token]);

  useEffect(() => {
    if (!userCampaign || !username || !token) return;
    queueLeadDashboardFetch(100);
  }, [queueLeadDashboardFetch, token, userCampaign, username]);

  useEffect(() => {
    if (!username || !token || !startDate || !endDate) return;
    fetchCallDataByAgent();
  }, [endDate, fetchCallDataByAgent, startDate, token, username]);

  useEffect(() => {
    if (!username || !token || !startDate || !endDate) return;
    if (status !== 'start' || dispositionModal) return;

    const refreshTimer = setTimeout(() => {
      void fetchCallDataByAgent();
      queueLeadDashboardFetch(100);
    }, 200);

    return () => clearTimeout(refreshTimer);
  }, [
    dispositionModal,
    endDate,
    fetchCallDataByAgent,
    formSubmitted,
    queueLeadDashboardFetch,
    startDate,
    status,
    token,
    username,
  ]);

  const mapLeadData = (rawData) => {
    if (!Array.isArray(rawData)) rawData = [rawData];

    return rawData.map((item) => {
      const mapped = {
        name: '',
        email: '',
        phone: '',
        status: 'Pending',
        uploadDate: item.uploadDate || null,
        ...item,
      };

      Object.entries(item).forEach(([key, value]) => {
        if (!value && value !== 0) return;
        const v = String(value).trim();
        const k = key.toLowerCase();

        if (v.includes('@') && v.includes('.')) mapped.email = v;
        else if (/^\d{10}$/.test(v)) mapped.phone = v;
        else if (k.includes('name') && !k.includes('file') && !k.includes('user')) mapped.name = v;
        else if (k.includes('date') || k.includes('time')) mapped.uploadDate = value;
      });

      switch (item.lastDialedStatus) {
        case 1:
        case 9:
          mapped.status = 'Complete';
          break;
        case 0:
        default:
          mapped.status = 'Pending';
      }

      return mapped;
    });
  };

  useEffect(() => {
    if (dispositionModal && endCallAudioRef.current) {
      const playAudio = async () => {
        try {
          endCallAudioRef.current.currentTime = 0;
          endCallAudioRef.current.muted = false;
          await endCallAudioRef.current.play();
        } catch (err) {
          console.error('Audio play failed:', err);
          if (err.name === 'NotAllowedError') {
            try {
              endCallAudioRef.current.muted = true;
              await endCallAudioRef.current.play();
              console.warn('Playing audio muted due to autoplay policy');
            } catch (mutedErr) {
              console.error('Muted playback also failed:', mutedErr);
            }
          }
        }
      };

      playAudio();
    }
  }, [dispositionModal]);

  // In your Dashboard useEffect, replace the complex logging with this simple version:

  useEffect(() => {
    // Simple debug functions
    window.webPhoneDebug = {
      showLogs: () => {
        const logs = JSON.parse(localStorage.getItem('mergeEventLogs') || '[]');
        return logs;
      },

      clear: () => {
        localStorage.removeItem('mergeEventLogs');
      },

      stats: () => {
        const logs = JSON.parse(localStorage.getItem('mergeEventLogs') || '[]');
        const manual = logs.filter((log) => log.eventType === 'manual_merge').length;
        const auto = logs.filter((log) => log.eventType.includes('participant_')).length;
        return { total: logs.length, manual, auto };
      },
    };

    return () => {
      delete window.webPhoneDebug;
    };
  }, []);

  const activeLeadNumber = useMemo(
    () =>
      normalizePhone(
        activeLead?.number || activeLead?.phone || activeLead?.phone_number || activeLead?.contactNumber || '',
      ),
    [activeLead],
  );

  const smartLeadDetailEntries = useMemo(() => {
    if (!activeLead || typeof activeLead !== 'object') {
      return [];
    }

    const normalizedSkipKeys = new Set(
      [
        '_id',
        'id',
        'leadid',
        'number',
        'phone',
        'phone_number',
        'contactnumber',
        'locktoken',
        'lockexpiresat',
        'assignedto',
        'lockedat',
        'leadstate',
        'lastdialattemptat',
        'lastoutcome',
        'lastshowntime',
        'lastdialedstatus',
        'isdeleted',
        'campaignid',
        'campaignname',
        'campaign',
        'filename',
        'uploaddate',
        'retrycount',
        'alreadylocked',
        'locked',
        'islocked',
        'lockstatus',
        'priority',
        'userid',
        'userid',
        'createdat',
        'updatedat',
        'adminuser',
        'database',
      ].map((key) => String(key).toLowerCase()),
    );

    const skipKeys = new Set([
      'name',
      'fullname',
      'patientname',
      'leadname',
      'customername',
      'contactname',
      'city',
      'location',
      'address',
      'addr',
      'source',
      'leadsource',
      'purpose',
      'reason',
      'interest',
      'querytype',
      'remarks',
      'remark',
      'notes',
      'comment',
    ]);

    const preferredLeadEntries = [
      {
        label: 'Lead Name',
        value:
          activeLead?.name ||
          activeLead?.fullName ||
          activeLead?.patientName ||
          activeLead?.leadName ||
          activeLead?.customerName ||
          activeLead?.contactName ||
          '-',
      },
      {
        label: 'City',
        value: activeLead?.city || activeLead?.City || activeLead?.location || activeLead?.Location || '-',
      },
      {
        label: 'Address',
        value: activeLead?.address || activeLead?.Address || activeLead?.addr || activeLead?.residence || '-',
      },
      {
        label: 'Source',
        value: activeLead?.source || activeLead?.Source || activeLead?.leadSource || activeLead?.['Lead Source'] || '-',
      },
      {
        label: 'Purpose',
        value:
          activeLead?.purpose ||
          activeLead?.Purpose ||
          activeLead?.reason ||
          activeLead?.Reason ||
          activeLead?.interest ||
          activeLead?.Interest ||
          activeLead?.queryType ||
          activeLead?.['Call Related To'] ||
          activeLead?.['Call Related to'] ||
          '-',
      },
      {
        label: 'Notes',
        value:
          activeLead?.notes ||
          activeLead?.Notes ||
          activeLead?.remark ||
          activeLead?.remarks ||
          activeLead?.Remarks ||
          activeLead?.comment ||
          '-',
      },
    ];

    const additionalEntries = Object.entries(activeLead)
      .filter(([key, value]) => {
        const normalizedKey = String(key).toLowerCase();
        if (normalizedSkipKeys.has(normalizedKey) || skipKeys.has(normalizedKey)) return false;
        if (value === undefined || value === null || String(value).trim() === '') return false;
        return typeof value !== 'object';
      })
      .map(([key, value]) => ({
        label: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^./, (char) => char.toUpperCase())
          .trim(),
        value: String(value),
      }));

    const filteredPreferredEntries = preferredLeadEntries.filter(
      (entry) => entry.value && String(entry.value).trim() !== '',
    );

    return [...filteredPreferredEntries, ...additionalEntries].slice(0, 12);
  }, [activeLead]);

  const formatDurationLabel = useCallback((secondsValue) => {
    const safeSeconds = Number(secondsValue || 0);
    if (!safeSeconds) return '00:00';
    const hours = Math.floor(safeSeconds / 3600);
    const minutesValue = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;
    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutesValue).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
      : `${String(minutesValue).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  const dashboardCards = useMemo(() => {
    if (activeMainTab === 'leads') {
      return [
        { key: 'all', label: 'Assigned Leads', value: leadStats.assignedLeads, icon: Users },
        { key: 'contacted', label: 'Contacted Leads', value: leadStats.contactedLeads, icon: CheckCircle },
        { key: 'pending', label: 'Pending Leads', value: leadStats.pendingLeads, icon: AlertCircle },
        { key: 'completed', label: 'Completed Leads', value: leadStats.completedLeads, icon: BarChart3 },
      ];
    }

    return [
      { key: 'all', label: 'Total Calls', value: callStats.totalCalls, icon: Phone },
      { key: 'incoming', label: 'Incoming Calls', value: callStats.incomingCalls, icon: PhoneIncoming },
      { key: 'outgoing', label: 'Outgoing Calls', value: callStats.outgoingCalls, icon: PhoneForwarded },
      { key: 'connected', label: 'Avg Duration', value: formatDurationLabel(callStats.avgDurationSeconds), icon: Clock },
    ];
  }, [activeMainTab, callStats.avgDurationSeconds, callStats.incomingCalls, callStats.outgoingCalls, callStats.totalCalls, formatDurationLabel, leadStats.assignedLeads, leadStats.completedLeads, leadStats.contactedLeads, leadStats.pendingLeads]);

  useEffect(() => {
    setActiveMetricFilter('all');
  }, [activeMainTab]);

  const workspaceReservedStyle = useMemo(() => {
    if (!(workspaceLayoutState.shouldReserveSpace && workspaceLayoutState.dialerLayoutMode === 'docked')) {
      return undefined;
    }

    return workspaceLayoutState.dialerDockMode === 'left'
      ? { paddingLeft: '304px' }
      : { paddingRight: '304px' };
  }, [workspaceLayoutState.dialerDockMode, workspaceLayoutState.dialerLayoutMode, workspaceLayoutState.shouldReserveSpace]);

  const workspaceShellRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let animationFrameId = null;

    const emitWorkspaceBounds = () => {
      const target = workspaceShellRef.current;
      if (!target) {
        return;
      }

      const rect = target.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent('webphone-workspace-bounds', {
          detail: {
            top: Math.max(rect.top, 0),
            bottom: Math.max(rect.bottom, 0),
            height: Math.max(rect.height, 0),
          },
        }),
      );
    };

    const scheduleWorkspaceBoundsEmit = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(emitWorkspaceBounds);
    };

    scheduleWorkspaceBoundsEmit();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleWorkspaceBoundsEmit();
          })
        : null;

    if (workspaceShellRef.current && resizeObserver) {
      resizeObserver.observe(workspaceShellRef.current);
    }

    window.addEventListener('resize', scheduleWorkspaceBoundsEmit);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleWorkspaceBoundsEmit);
    };
  }, [
    activeMainTab,
    dispositionModal,
    status,
    workspaceLayoutState.dialerDockMode,
    workspaceLayoutState.dialerLayoutMode,
    workspaceLayoutState.shouldReserveSpace,
  ]);

  const handleDialAction = useCallback(
    async (phoneNumberToDial, sourceLead = null) => {
      const normalizedPhoneNumber = normalizePhone(phoneNumberToDial);
      if (!normalizedPhoneNumber) {
        toast.error('Lead number is missing.');
        return;
      }

      let lockedLead = sourceLead;
      let nextLockToken = leadLockToken;

      if (sourceLead?.leadId && token) {
        try {
          const response = await axios.post(
            `${window.location.origin}/lead/lock`,
            {
              leadId: sourceLead.leadId,
              lockToken: sourceLead.lockToken || leadLockToken || undefined,
            },
            {
              headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            },
          );
          lockedLead = response.data?.result || sourceLead;
          nextLockToken = lockedLead?.lockToken || nextLockToken;
          applyLockedLeadState(
            {
              ...lockedLead,
              lockToken: nextLockToken || lockedLead?.lockToken || '',
            },
            'lead_locked',
          );
        } catch (error) {
          toast.error(error.response?.data?.message || 'Unable to lock this lead.');
          return;
        }
      }

      handleCall(
        normalizedPhoneNumber,
        lockedLead
          ? {
              lead: lockedLead,
              leadLockToken: nextLockToken,
            }
          : undefined,
      );
    },
    [applyLockedLeadState, getAuthHeaders, handleCall, leadLockToken, token],
  );

  return (
    <>
      <audio ref={endCallAudioRef} preload="auto" style={{ display: 'none' }} src={endCallAudioBase64} />

      {(() => {
        // Check if campaign matches - if yes, show ringtone calls
        const shouldShowRingtone = currentCallData?.campaign === userCampaign;
        if (shouldShowRingtone) {
          // Show ringtone calls when campaign matches
          if (ringtone && Array.isArray(ringtone) && ringtone.length > 0) {
            const filteredCalls = ringtone.filter((call) => call.campaign === userCampaign);

            if (filteredCalls.length === 0) return null;

            return (
              <div className="w-full bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-3 text-xs mb-4 rounded-sm">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <PhoneMissed className="w-3 h-3 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-primary">Call Queue: ({filteredCalls.length})</span>
                  <span className="font-medium text-primary">Campaign Queue: {campaignName || 'Unknown'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <marquee
                    behavior="scroll"
                    direction="left"
                    scrollamount="4"
                    className="truncate font-medium text-muted-foreground"
                  >
                    {filteredCalls.map((call) => call.Caller).join(', ')}
                  </marquee>
                </div>
              </div>
            );
          }
          return null;
        }

        // Otherwise, show transferred queues when campaign doesn't match
        if (queueDetails && queueDetails.length > 0 && hasTransfer) {
          // Filter queues that match the user's campaign
          const matchingQueues = queueDetails.filter((queue) => queue.ID === userCampaign);

          // Only show if there are matching queues
          if (matchingQueues.length > 0) {
            const currentQueue = matchingQueues[matchingQueues.length - 1];

            return (
              <div className="w-full bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-3 text-xs mb-4 rounded-sm">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <List className="w-3 h-3 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-primary">Transferred Queues: ({matchingQueues.length})</span>
                  <span className="font-medium text-primary">
                    Campaign Queue: {currentQueue?.queueName || 'Unknown'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <marquee
                    behavior="scroll"
                    direction="left"
                    scrollamount="4"
                    className="truncate font-medium text-muted-foreground"
                  >
                    {currentCallData?.Caller || 'No caller info'}
                  </marquee>
                </div>
              </div>
            );
          }
        }

        // Return null if no matching queues
        return null;
      })()}

      {formSubmitted && dispositionModal && (
        <Disposition
          bridgeID={bridgeID}
          setDispositionModal={setDispositionModal}
          userCall={userCall}
          callType={callType}
          setCallType={setCallType}
          phoneNumber={userCall?.contactNumber}
          formSubmitted={formSubmitted}
          setFormSubmitted={setFormSubmitted}
          fetchLeadsWithDateRange={fetchLeadsWithDateRange}
          setPhoneNumber={setPhoneNumber}
          campaignID={userCampaign}
          user={username}
          activeLead={activeLead}
          leadLockToken={leadLockToken}
          setActiveLead={setActiveLead}
          setLeadLockToken={setLeadLockToken}
          setAgentLifecycle={setAgentLifecycle}
        />
      )}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onClose={closeTimeoutModal}
        onLoginSuccess={handleLoginSuccess}
        userLogin={userLogin}
        customMessage={timeoutMessage}
      />
      {dropCalls && (
        <DropCallsModal
          usermissedCalls={usermissedCalls}
          campaignMissedCallsLength={campaignMissedCallsLength}
          setDropCalls={setDropCalls}
          username={username}
          token={token}
        />
      )}
      {callAlert && (
        <FollowUpCallsModal
          followUpDispoes={followUpDispoes}
          scheduleCallsLength={scheduleCallsLength}
          setCallAlert={setCallAlert}
          username={username}
          token={token}
        />
      )}
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3">
        {dashboardErrorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {dashboardErrorMessage}
          </div>
        )}

        <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeMetricFilter === card.key || (card.key === 'all' && activeMetricFilter === 'all');
            const isCardLoading = activeMainTab === 'leads' ? leadDashboardLoading : callDataLoading;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveMetricFilter((prev) => (prev === card.key ? 'all' : card.key))}
                className={`overflow-hidden rounded-2xl border text-left transition-all ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/20'}`}
              >
                <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    {isCardLoading ? (
                      <div className="mt-3 h-8 w-24 rounded-lg bg-muted animate-pulse" />
                    ) : (
                      <div className="mt-3 text-2xl font-bold text-foreground">{card.value}</div>
                    )}
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {status === 'start' && !dispositionModal ? (
          <div ref={workspaceShellRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden transition-all duration-300" style={workspaceReservedStyle}>
            <ContactCentricWorkspace
              mode={activeMainTab}
              onModeChange={setActiveMainTab}
              callsData={apiCallData}
              leadsData={leadsData}
              token={token}
              previewLeadMode={previewLeadMode}
              activeCardFilter={activeMetricFilter}
              handleDialAction={handleDialAction}
              callLoading={callDataLoading}
              leadLoading={leadDashboardLoading}
              workspaceErrorMessage={dashboardErrorMessage}
              activeLead={activeLead}
              activeLeadNumber={activeLeadNumber}
              smartLeadLoading={smartLeadLoading}
              smartLeadError={smartLeadError}
              smartLeadDetailEntries={smartLeadDetailEntries}
              agentLifecycle={agentLifecycle}
              leadLockToken={leadLockToken}
              datePreset={workspaceDatePreset}
              onDatePresetChange={handleWorkspaceDatePresetChange}
              onSkipLead={handleSkipLead}
              onRefreshLead={() => {
                clearLeadSelection('idle');
                void fetchNextLead();
              }}
            />
          </div>
        ) : (
          <div ref={workspaceShellRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden transition-all duration-300" style={workspaceReservedStyle}>
            <LeadAndCallInfoPanel
              userCall={userCall}
              handleCall={handleDialAction}
              status={status}
              formSubmitted={formSubmitted}
              connectionStatus={connectionStatus}
              dispositionModal={dispositionModal}
              userCampaign={userCampaign}
              username={username}
              token={token}
              callType={callType}
              setFormSubmitted={setFormSubmitted}
              activeCallContext={activeCallContext}
            />
          </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Handled by parent */}
    </>
  );
}

export default Dashboard;
