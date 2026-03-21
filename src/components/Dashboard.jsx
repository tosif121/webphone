import HistoryContext from '@/context/HistoryContext';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import LeadAndCallInfoPanel from './LeadAndCallInfoPanel';
import Disposition from './Disposition';
import { JssipContext } from '@/context/JssipContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import DropCallsModal from './DropCallsModal';
import LeadCallsTable from './LeadCallsTable';
import MobileNavigation from './MobileNavigation';

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

  const [usermissedCalls, setUsermissedCalls] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [userCampaign, setUserCampaign] = useState(null);
  const [leadsData, setLeadsData] = useState([]);
  const [apiCallData, setApiCallData] = useState([]);
  const endCallAudioRef = useRef(null);
  const [campaignName, setCampaignName] = useState('N/A');

  const router = useRouter();
  const computedMissedCallsLength = useMemo(() => {
    return Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign).length;
  }, [usermissedCalls, userCampaign]);

  const [selectedDate, setSelectedDate] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [leadViewMode, setLeadViewMode] = useState('smart');
  const [smartLeadLoading, setSmartLeadLoading] = useState(false);
  const [smartLeadError, setSmartLeadError] = useState('');

  const [startDate, setStartDate] = useState(moment().subtract(24, 'hours').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

  const [activeMainTab, setActiveMainTab] = useState('allLeads');
  const [leadStats, setLeadStats] = useState({
    completeCalls: 0,
    pendingCalls: 0,
    totalCalls: 0,
  });

  const [callStats, setCallStats] = useState({
    incomingCalls: 0,
    outgoingCalls: 0,
    totalCalls: 0,
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

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

  const fetchNextLead = useCallback(async () => {
    if (!token || !username || !userCampaign) {
      return null;
    }

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
      setActiveLead(nextLead);
      setLeadLockToken(nextLead?.lockToken || '');
      setAgentLifecycle(nextLead ? 'lead_locked' : 'idle');
      return nextLead;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'No lead available right now.';
      setSmartLeadError(message);
      setActiveLead(null);
      setLeadLockToken('');
      setAgentLifecycle('idle');
      return null;
    } finally {
      setSmartLeadLoading(false);
    }
  }, [getAuthHeaders, setActiveLead, setAgentLifecycle, setLeadLockToken, token, userCampaign, username]);

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
      setActiveLead(null);
      setLeadLockToken('');
      setAgentLifecycle('idle');
      void fetchNextLead();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to skip lead.');
    }
  }, [activeLead?.leadId, fetchNextLead, getAuthHeaders, leadLockToken, setActiveLead, setAgentLifecycle, setLeadLockToken]);

  // Listen for refresh leads event from Layout (after disposition submission)
  useEffect(() => {
    const handleRefreshLeads = () => {
      fetchLeadsWithDateRange();
    };

    window.addEventListener('refreshLeads', handleRefreshLeads);
    return () => window.removeEventListener('refreshLeads', handleRefreshLeads);
  }, []);

  // Refresh leads when call ends (dispositionModal opens)
  useEffect(() => {
    if (dispositionModal && userCampaign && username && token && startDate && endDate) {
      fetchLeadsWithDateRange();
    }
  }, [dispositionModal]);

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
    const tokenData = localStorage.getItem('token');
    if (tokenData) {
      try {
        const parsedData = JSON.parse(tokenData);
        const newCampaign = parsedData?.userData?.campaign;

        // Only update if actually different
        if (newCampaign !== userCampaign) {
          setUserCampaign(newCampaign);
          setCampaignName(parsedData?.userData?.campaignName || 'N/A');
          setAdminUser(parsedData?.userData?.adminuser);
          setToken(parsedData.token);
        }
      } catch (e) {
        console.error('Invalid token JSON in localStorage:', e);
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  }, []); // Remove router dependency to prevent re-runs

  useEffect(() => {
    if (!token || !username || !userCampaign) {
      return;
    }

    if (leadViewMode !== 'smart' || status !== 'start' || dispositionModal || selectedBreak !== 'Break') {
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
    leadViewMode,
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
    if ((status == 'start' && username) || dropCalls) {
      fetchUserMissedCalls();
    }
  }, [status, username, dropCalls]);

  useEffect(() => {
    if (selectedBreak !== 'Break' && ringtone.length >= 0) {
      if (username) {
        fetchUserMissedCalls();
      }
    }
  }, [ringtone, username]);

  const fetchUserMissedCalls = async () => {
    if (!token || !username) {
      setUsermissedCalls([]);
      return;
    }

    try {
      const response = await axios.post(
        `${window.location.origin}/usermissedCalls/${username}`,
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
  };

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
    const storedToken = localStorage.getItem('token');
    try {
      const parsedToken = JSON.parse(storedToken);
      if (!parsedToken) {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  const fetchLeadsWithDateRange = useCallback(async () => {
    setLoading(true);
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

      const response = await axios.post(
        `${window.location.origin}/leadswithdaterange`,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          campaignID: userCampaign,
        },
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );

      const leads = response.data.data || [];

      const completeCalls = leads.filter((lead) => lead.lastDialedStatus === 1 || lead.lastDialedStatus === 9).length;
      const pendingCalls = leads.filter((lead) => lead.lastDialedStatus === 0).length;
      const totalCalls = leads.length;

      setLeadsData(leads);
      setLeadStats({ completeCalls, pendingCalls, totalCalls });
    } catch (error) {
      console.error('Error fetching leads:', error.response?.data || error.message);
      setLeadsData([]);
      setLeadStats({ completeCalls: 0, pendingCalls: 0, totalCalls: 0 });
    } finally {
      setLoading(false);
    }
  }, [endDate, getAuthHeaders, startDate, userCampaign]);

  const fetchCallDataByAgent = useCallback(async () => {
    setLoading(true);
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

      const response = await axios.post(
        `${window.location.origin}/callDataByAgent`,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );

      const calls = response.data.result || [];
      setApiCallData(calls);

      const incoming = calls.filter((call) => call.Type?.toLowerCase() === 'incoming').length;
      const outgoing = calls.filter((call) => call.Type?.toLowerCase() !== 'incoming').length;
      const total = calls.length;

      setCallStats({ incomingCalls: incoming, outgoingCalls: outgoing, totalCalls: total });
    } catch (error) {
      console.error('Error fetching API data for Call Info tab:', error);
      setApiCallData([]);
      setCallStats({ incomingCalls: 0, outgoingCalls: 0, totalCalls: 0 });
    } finally {
      setLoading(false);
    }
  }, [endDate, getAuthHeaders, startDate]);

  useEffect(() => {
    if (!userCampaign || !username || !token || !startDate || !endDate) return;
    fetchLeadsWithDateRange();
    fetchCallDataByAgent();
  }, [endDate, fetchCallDataByAgent, fetchLeadsWithDateRange, startDate, token, userCampaign, username]);

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
      String(
        activeLead?.number ||
          activeLead?.phone ||
          activeLead?.phone_number ||
          activeLead?.contactNumber ||
          '',
      )
        .replace(/^\+91/, '')
        .trim(),
    [activeLead],
  );

  const smartLeadSummary = useMemo(
    () => [
      {
        label: 'Lead ID',
        value: activeLead?.leadId ?? '-',
      },
      {
        label: 'Retry',
        value: activeLead?.retryCount ?? 0,
      },
      {
        label: 'State',
        value: activeLead?.leadState || 'new',
      },
      {
        label: 'Locked',
        value: leadLockToken ? 'Yes' : 'No',
      },
    ],
    [activeLead, leadLockToken],
  );

  const handleDialAction = useCallback(
    async (phoneNumberToDial, sourceLead = null) => {
      const normalizedPhoneNumber = String(phoneNumberToDial || '').replace(/^\+91/, '').trim();
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
          setActiveLead(lockedLead);
          setLeadLockToken(nextLockToken || '');
          setAgentLifecycle('lead_locked');
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
    [getAuthHeaders, handleCall, leadLockToken, setActiveLead, setAgentLifecycle, setLeadLockToken, token],
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
      <div>
        <div className="text-center md:text-start mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">Agent Panel</h1>
          <p className="text-sm text-muted-foreground">Real-time performance metrics and activity tracking</p>
        </div>
        <div className="relative">
          <div
            className={`grid grid-cols-3 gap-2 sm:gap-6 transition-all duration-400 ease-in-out ${
              status !== 'start' ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
            }`}
          >
            {activeMainTab === 'allLeads' ? (
              <>
                <Card className="overflow-hidden border-l-4 sm:py-6 py-2 border-l-primary">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs whitespace-nowrap sm:text-sm font-medium text-muted-foreground">
                          Complete Leads
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                          {leadStats.completeCalls}
                        </h2>
                      </div>
                      <div className="md:block hidden bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-l-4 sm:py-6 py-2 border-l-primary">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs whitespace-nowrap sm:text-sm font-medium text-muted-foreground">
                          Total Leads
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                          {leadStats.totalCalls}
                        </h2>
                      </div>
                      <div className="md:block hidden bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-l-4 sm:py-6 py-2 border-l-primary">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs whitespace-nowrap sm:text-sm font-medium text-muted-foreground">
                          Pending Leads
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                          {leadStats.pendingCalls}
                        </h2>
                      </div>
                      <div className="md:block hidden bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="overflow-hidden border-l-4 sm:py-6 py-2 border-l-primary">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs whitespace-nowrap sm:text-sm font-medium text-muted-foreground">
                          Total Calls
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                          {callStats.totalCalls}
                        </h2>
                      </div>
                      <div className="md:block hidden bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-l-4 sm:py-6 py-2 border-l-primary">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs whitespace-nowrap sm:text-sm font-medium text-muted-foreground">
                          Incoming Calls
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                          {callStats.incomingCalls}
                        </h2>
                      </div>
                      <div className="md:block hidden bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <PhoneIncoming className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-l-4 sm:py-6 py-2 border-l-primary">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs whitespace-nowrap sm:text-sm font-medium text-muted-foreground">
                          Outgoing Calls
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                          {callStats.outgoingCalls}
                        </h2>
                      </div>
                      <div className="md:block hidden bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <PhoneForwarded className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-6 mt-8 md:flex-row flex-col relative">
          <div
            className={`w-full transition-opacity duration-400 ${
              status !== 'start' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
            }`}
          >
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

          <div
            className={`w-full transition-opacity duration-400 ${
              status === 'start' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
            }`}
          >
            <div className="flex items-center justify-end gap-2 mb-4">
              <Button
                type="button"
                variant={leadViewMode === 'smart' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => setLeadViewMode('smart')}
              >
                <Lock className="w-4 h-4" />
                Smart Dial
              </Button>
              <Button
                type="button"
                variant={leadViewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => setLeadViewMode('list')}
              >
                <List className="w-4 h-4" />
                List Mode
              </Button>
            </div>

            {leadViewMode === 'smart' && activeMainTab === 'allLeads' ? (
              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Lock className="w-4 h-4" />
                        Smart Dial Mode
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {activeLead?.name || activeLead?.fullName || 'Next Lead'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeLeadNumber || smartLeadError || (smartLeadLoading ? 'Fetching the next eligible lead...' : 'No lead available right now.')}
                        </p>
                      </div>

                      {activeLead ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {smartLeadSummary.map((item) => (
                            <div key={item.label} className="rounded-lg border bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">{item.label}</div>
                              <div className="text-sm font-semibold text-foreground mt-1">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-sm text-muted-foreground">
                          {smartLeadLoading ? 'Locking the next lead for this agent...' : smartLeadError || 'No eligible lead is currently available for this campaign.'}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[220px]">
                      <Button
                        type="button"
                        className="gap-2"
                        disabled={!activeLeadNumber || !leadLockToken || smartLeadLoading || !['lead_locked', 'idle'].includes(agentLifecycle)}
                        onClick={() => {
                          if (!activeLeadNumber) return;
                          handleDialAction(activeLeadNumber, activeLead);
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Dial
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={!activeLead?.leadId || !leadLockToken || smartLeadLoading || agentLifecycle !== 'lead_locked'}
                        onClick={handleSkipLead}
                      >
                        <SkipForward className="w-4 h-4" />
                        Skip
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        disabled={smartLeadLoading || !['idle', 'lead_locked'].includes(agentLifecycle)}
                        onClick={() => {
                          setActiveLead(null);
                          setLeadLockToken('');
                          setAgentLifecycle('idle');
                          void fetchNextLead();
                        }}
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh Lead
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LeadCallsTable
                callDetails={leadsData}
                apiCallData={apiCallData}
                handleCall={handleDialAction}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                username={username}
                token={token}
                activeMainTab={activeMainTab}
                setActiveMainTab={setActiveMainTab}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Handled by parent */}
    </>
  );
}

export default Dashboard;
