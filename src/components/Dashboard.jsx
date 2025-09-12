import HistoryContext from '@/context/HistoryContext';
import React, { useContext, useEffect, useRef, useMemo, useState } from 'react';
import LeadAndCallInfoPanel from './LeadAndCallInfoPanel';
import Disposition from './Disposition';
import { JssipContext } from '@/context/JssipContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import DropCallsModal from './DropCallsModal';
import LeadCallsTable from './LeadCallsTable';

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
} from 'lucide-react';
import CallbackForm from './CallbackForm';
import { useRouter } from 'next/router';
import FollowUpCallsModal from './FollowUpCallsModal';
import moment from 'moment';
import { Button } from './ui/button';
import BreakDropdown from './BreakDropdown';
import { Card, CardContent } from './ui/card';
import SessionTimeoutModal from './SessionTimeoutModal';

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

  const router = useRouter();
  const computedMissedCallsLength = useMemo(() => {
    return Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign).length;
  }, [usermissedCalls, userCampaign]);

  const [selectedDate, setSelectedDate] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(moment().subtract(7, 'days').startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());

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

    const fiveMinEarly = processed.filter((item) => {
      const alertWindowStart = new Date(item.callTime.getTime() - 5 * 60 * 1000);
      return now >= alertWindowStart && now <= item.callTime;
    });

    setScheduleCallsLength(fiveMinEarly.length);
  }, [followUpDispoes, setScheduleCallsLength]);

  useEffect(() => {
    const tokenData = localStorage.getItem('token');
    if (tokenData) {
      try {
        const parsedData = JSON.parse(tokenData);
        setUserCampaign(parsedData?.userData?.campaign);
        setAdminUser(parsedData?.userData?.adminuser);
        setToken(parsedData.token);
      } catch (e) {
        console.error('Invalid token JSON in localStorage:', e);
        localStorage.removeItem('token');
        router.push('/webphone/v1/login');
      }
    }
  }, []);

  useEffect(() => {
    try {
      if (token && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'token',
            token: token,
            timestamp: Date.now(),
          })
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
        })
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
        })
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
          })
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
    try {
      const response = await axios.post(`${window.location.origin}/usermissedCalls/${username}`);
      if (response.data) {
        setUsermissedCalls(response.data.result || []);
      }
    } catch (error) {
      console.error('Error fetching missed calls:', error);
      setUsermissedCalls([]);
    }
  };

  const fetchAdminUser = async () => {
    try {
      const response = await axios.get(`${window.location.origin}/users/${adminUser}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const filteredData = response.data.result?.filter((item) => item.Status === 'NOT_INUSE');
    } catch (error) {
      toast.error('Failed to fetch admin user.');
      console.error('Error fetching admin user:', error);
    }
  };

  useEffect(() => {
    if (info) {
      fetchAdminUser();
    }
  }, [info]);

  useEffect(() => {
    setCampaignMissedCallsLength(campaignMissedCallsLength);
  }, [campaignMissedCallsLength]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    try {
      const parsedToken = JSON.parse(storedToken);
      if (!parsedToken) {
        router.push('/webphone/v1/login');
      }
    } catch (error) {
      router.push('/webphone/v1/login');
    }
  }, [router]);

  useEffect(() => {
    if (!userCampaign || !username || !token || !startDate || !endDate) return;
    fetchLeadsWithDateRange();
    fetchCallDataByAgent();
  }, [startDate, endDate, userCampaign, username, token]);

  const fetchLeadsWithDateRange = async () => {
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
          user: username,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
  };

  const fetchCallDataByAgent = async () => {
    setLoading(true);
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

      const response = await axios.post(
        `${window.location.origin}/callDataByAgent`,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          agentName: username,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
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
  };

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

  const endCallAudioRef = useRef(null);

  useEffect(() => {
    if (dispositionModal) {
      if (endCallAudioRef.current) {
        endCallAudioRef.current.currentTime = 0;
        endCallAudioRef.current.play().catch(console.error);
      }
    }
  }, [dispositionModal]);
  return (
    <>
      {typeof window !== 'undefined' && (
        <audio ref={endCallAudioRef} preload="auto" hidden>
          <source src={`${window.location.origin}/webphone/end-call.mp3`} type="audio/mp3" />
          <source src="/end-call.mp3" type="audio/mp3" />
        </audio>
      )}
      {ringtone && ringtone.length > 0 && (
        <div className="w-full bg-primary/10 border border-primary/20 px-3 py-1 flex items-center gap-3 text-xs mb-4 rounded-sm">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pulse">
            <PhoneMissed className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="font-medium text-primary">Call Queue: ({ringtone.length})</span>
          <div className="flex-1 min-w-0">
            <marquee
              behavior="scroll"
              direction="left"
              scrollamount="4"
              className="truncate font-medium text-muted-foreground"
            >
              {ringtone.map((call) => call.Caller).join(', ')}
            </marquee>
          </div>
        </div>
      )}

      {formSubmitted && dispositionModal && (
        <Disposition
          bridgeID={bridgeID}
          setDispositionModal={setDispositionModal}
          userCall={userCall}
          callType={callType}
          setCallType={setCallType}
          phoneNumber={userCall?.contactNumber}
          setFormSubmitted={setFormSubmitted}
          fetchLeadsWithDateRange={fetchLeadsWithDateRange}
          setPhoneNumber={setPhoneNumber}
          campaignID={userCampaign}
          user={username}
        />
      )}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onClose={closeTimeoutModal}
        onLoginSuccess={handleLoginSuccess}
        userLogin={userLogin}
      />
      {dropCalls && (
        <DropCallsModal
          usermissedCalls={usermissedCalls}
          campaignMissedCallsLength={campaignMissedCallsLength}
          setDropCalls={setDropCalls}
          username={username}
        />
      )}
      {callAlert && (
        <FollowUpCallsModal
          followUpDispoes={followUpDispoes}
          scheduleCallsLength={scheduleCallsLength}
          setCallAlert={setCallAlert}
          username={username}
        />
      )}
      <div className="text-center md:text-start mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Agent Panel</h1>
        <p className="text-sm text-muted-foreground">Real-time performance metrics and activity tracking</p>
      </div>
      <div className="relative">
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-400 ease-in-out ${
            status !== 'start' ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
          }`}
        >
          {activeMainTab === 'allLeads' ? (
            <>
              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Complete Leads</p>
                      <h2 className="text-3xl font-bold mt-2">{leadStats.completeCalls}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                      <h2 className="text-3xl font-bold mt-2">{leadStats.totalCalls}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Leads</p>
                      <h2 className="text-3xl font-bold mt-2">{leadStats.pendingCalls}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                      <h2 className="text-3xl font-bold mt-2">{callStats.totalCalls}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Incoming Calls</p>
                      <h2 className="text-3xl font-bold mt-2">{callStats.incomingCalls}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <PhoneIncoming className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Outgoing Calls</p>
                      <h2 className="text-3xl font-bold mt-2">{callStats.outgoingCalls}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <PhoneForwarded className="h-6 w-6 text-primary" />
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
            handleCall={handleCall}
            status={status}
            formSubmitted={formSubmitted}
            connectionStatus={connectionStatus}
            dispositionModal={dispositionModal}
            userCampaign={userCampaign}
            username={username}
            token={token}
            callType={callType}
            setFormSubmitted={setFormSubmitted}
          />
        </div>

        <div
          className={`w-full transition-opacity duration-400 ${
            status === 'start' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
        >
          <LeadCallsTable
            callDetails={leadsData}
            apiCallData={apiCallData}
            handleCall={handleCall}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            username={username}
            token={token}
            activeMainTab={activeMainTab}
            setActiveMainTab={setActiveMainTab}
          />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
