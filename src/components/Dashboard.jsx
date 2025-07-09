import HistoryContext from '@/context/HistoryContext';
import useJssip from '@/hooks/useJssip';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import UserCall from './UserCall';
import AutoDial from './AutoDial';
import AutoDialDynamicForm from './AutoDialDynamicForm';
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
} from 'lucide-react';
import CallbackForm from './CallbackForm';
import { useRouter } from 'next/router';
import DynamicForm from './DynamicForm';
import FollowUpCallsModal from './FollowUpCallsModal';
import moment from 'moment';
import { Button } from './ui/button';
import BreakDropdown from './BreakDropdown';
import { Card, CardContent } from './ui/card';

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
  const [callConference, setCallConference] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [userCampaign, setUserCampaign] = useState(null);
  const [contactShow, setContactShow] = useState(false);
  const [leadsData, setLeadsData] = useState([]);

  const router = useRouter();
  const computedMissedCallsLength = useMemo(() => {
    return Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign).length;
  }, [usermissedCalls, userCampaign]);

  const [selectedDate, setSelectedDate] = useState('');
  const [token, setToken] = useState('');
  const [formState, setFormState] = useState({});
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(moment().subtract(24, 'hours').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [callStats, setCallStats] = useState({
    completeCalls: 0,
    pendingCalls: 0,
    totalCalls: 0,
  });

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
      const parsedData = JSON.parse(tokenData);
      setUserCampaign(parsedData?.userData?.campaign);
      setAdminUser(parsedData?.userData?.adminuser);
      setToken(parsedData.token);
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
      console.error('Invalid token JSON in localStorage:', e);
    }
  }, []);

  useEffect(() => {
    const originalAnswerIncomingCall = window.answerIncomingCall;
    const originalRejectIncomingCall = window.rejectIncomingCall;

    // Define handler called from React Native
    window.onReactNativeMessage = (data) => {
      try {
        console.log('[Web] Received from React Native:', data);
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

    // Expose unified functions on window
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

    // Cleanup on unmount
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
  }, [incomingSession]);

  useEffect(() => {
    const sendRingingState = () => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        console.log('Sending isIncomingRinging to React Native:', isIncomingRinging);
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    number: '',
    alternateNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    district: '',
    comment: '',
  });

  const handleContact = async () => {
    const payload = {
      user: username,
      isFresh: userCall?.isFresh,
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailId: formData.email,
        contactNumber: formData.number,
        alternateNumber: formData.alternateNumber,
        comment: formData.comment,
        Contactaddress: formData.address,
        ContactDistrict: formData.district,
        ContactCity: formData.city,
        ContactState: formData.state,
        ContactPincode: formData.postalCode,
      },
    };

    try {
      const response = await axios.post(`${window.location.origin}/addModifyContact`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Contact saved successfully.');
      } else {
        toast.error(response.data.message || 'Failed to save contact.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred.');
      console.error('Add/Modify contact error:', err);
    }
  };

  useEffect(() => {
    if (status == 'start' && username) {
      fetchUserMissedCalls();
    }
  }, [status, username]);

  useEffect(() => {
    if (status !== 'start' && userCall) {
      setContactShow(true);
    }
  }, [status, userCall]);

  useEffect(() => {
    if (selectedBreak != 'Break' && ringtone.length >= 0) {
      fetchUserMissedCalls();
    }
  }, [ringtone]);

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

  function handleCalls() {
    createConferenceCall();
    setCallConference(false);
  }

  const fetchAdminUser = async () => {
    try {
      const response = await axios.get(`${window.location.origin}/users/${adminUser}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const filteredData = response.data.result?.filter((item) => item.Status === 'NOT_INUSE' && item.user !== userId);

      setAdminUserData(filteredData || []);
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
    if (userCall) {
      setFormData({
        firstName: userCall.firstName || '',
        lastName: userCall.lastName || '',
        number: userCall.contactNumber || '',
        alternateNumber: userCall.alternateNumber || '',
        address: userCall.Contactaddress || '',
        state: userCall.ContactState || '',
        district: userCall.ContactDistrict || '',
        city: userCall.ContactCity || '',
        postalCode: userCall.ContactPincode || '',
        email: userCall.emailId || '',
        comment: userCall.comment || '',
      });
    }
  }, [userCall]);

  useEffect(() => {
    setCampaignMissedCallsLength(campaignMissedCallsLength);
  }, [campaignMissedCallsLength]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    try {
      const parsedToken = JSON.parse(token);
      if (!parsedToken) {
        router.push('/webphone/login');
      } else {
        router.push('/webphone');
      }
    } catch (error) {
      // Invalid JSON, treat as no token
      router.push('/webphone/login');
    }
  }, []);

  useEffect(() => {
    if ((userCampaign, username)) {
      fetchLeadsWithDateRange();
    }
  }, [startDate, endDate, userCampaign, username, token]);

  const fetchLeadsWithDateRange = async () => {
    try {
      const response = await axios.post(
        `${window.location.origin}/leadswithdaterange`,
        {
          startDate,
          endDate,
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

      //  Calculate stats
      const completeCalls = leads.filter((lead) => lead.lastDialedStatus === 1 || lead.lastDialedStatus === 9).length;
      const pendingCalls = leads.filter((lead) => lead.lastDialedStatus === 0).length;
      const totalCalls = leads.length;

      setLeadsData(leads);
      setCallStats({ completeCalls, pendingCalls, totalCalls }); // Store in state
    } catch (error) {
      console.error('Error fetching leads:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (!userCampaign || !token) return;

    async function loadForm() {
      setLoading(true);
      try {
        // Step 1: Get formId from campaign
        const res1 = await axios.get(`${window.location.origin}/getDynamicFormDataAgent/${userCampaign}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formId = res1.data.agentWebForm?.formId;
        // if (!formId) throw new Error('Form ID not found');

        // Step 2: Get full form config by formId
        const res2 = await axios.get(`${window.location.origin}/getDynamicFormData/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormConfig(res2.data.result);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to load form.');
        setFormConfig(null);
      }
      setLoading(false);
    }

    loadForm();
  }, [userCampaign, token]);

  const handleSubmit = async () => {
    if (!formConfig) return;

    const payload = {
      user: username,
      isFresh: userCall?.isFresh,
      data: {
        ...formState,
        formId: formConfig.formId,
      },
    };

    try {
      const response = await axios.post(`${window.location.origin}/addModifyContact`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Contact saved successfully.');
      } else {
        toast.error(response.data.message || 'Failed to save contact.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred.');
      console.error('Add/Modify contact error:', err);
    }
  };

  // Show loader while loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-muted rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Call Queue Alert */}

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
      {status !== 'start' && userCall ? (
        <div className="fixed bottom-2 right-8 z-[51]">
          <Button
            type="button"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => setContactShow((prev) => !prev)}
            aria-label={contactShow ? 'Hide contact form' : 'Show contact form'}
          >
            {contactShow ? <Navigation className="h-8 w-8" /> : <NavigationOff className="h-8 w-8" />}
          </Button>
        </div>
      ) : (
        ''
      )}
      {/* {info && (
        <Modal isOpen={info} onClose={() => setInfo(false)} title={`Users Not In Use (${adminUserData.length})`}>
          <InterModal
            adminUserData={adminUserData}
            handleCall={handleCall}
            handleCalls={handleCalls}
            setPhoneNumber={setPhoneNumber}
            setInfo={setInfo}
            status={status}
            setConferenceNumber={setConferenceNumber}
          />
        </Modal>
      )} */}
      {dispositionModal && (
        <Disposition
          bridgeID={bridgeID}
          setDispositionModal={setDispositionModal}
          userCall={userCall}
          handleContact={
            Array.isArray(formConfig?.sections) && formConfig.sections.length > 0 ? handleSubmit : handleContact
          }
          setFormData={setFormState}
          formData={formState}
          formConfig={formConfig}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          fetchLeadsWithDateRange={fetchLeadsWithDateRange}
        />
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complete Calls</p>
                <h2 className="text-3xl font-bold mt-2">{callStats.completeCalls}</h2>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <h2 className="text-3xl font-bold mt-2">{callStats.totalCalls}</h2>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Calls</p>
                <h2 className="text-3xl font-bold mt-2">{callStats.pendingCalls}</h2>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-6 mt-8 md:flex-row flex-col">
        {status !== 'start' && userCall && contactShow && (
          <div className="max-w-lg w-full relative">
            <div className="absolute z-10 w-full">
              {Array.isArray(formConfig?.sections) && formConfig.sections.length > 0 ? (
                <DynamicForm
                  formConfig={formConfig}
                  formState={formState}
                  setFormState={setFormState}
                  userCall={userCall}
                />
              ) : (
                <UserCall userCall={userCall} username={username} formData={formData} setFormData={setFormData} />
              )}
            </div>
          </div>
        )}

        {/* <>
            {Array.isArray(formConfig?.sections) && formConfig.sections.length > 0 ? (
              <AutoDialDynamicForm
                formConfig={formConfig}
                setPhoneNumber={setPhoneNumber}
                dispositionModal={dispositionModal}
                handleCall={handleCall}
                phoneNumber={phoneNumber}
              />
            ) : (
              <AutoDial
                setPhoneNumber={setPhoneNumber}
                dispositionModal={dispositionModal}
                handleCall={handleCall}
                phoneNumber={phoneNumber}
              />
            )}
          </> */}
        <div className="w-full">
          <LeadCallsTable
            callDetails={leadsData}
            handleCall={handleCall}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            formConfig={formConfig}
          />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
