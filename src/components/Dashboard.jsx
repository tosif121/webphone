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
import { Bell, PhoneMissed } from 'lucide-react';
import CallbackForm from './CallbackForm';
import { useRouter } from 'next/router';
import DynamicForm from './DynamicForm';
import FollowUpCallsModal from './FollowUpCallsModal';
import moment from 'moment';

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
  } = useContext(HistoryContext);
  const [usermissedCalls, setUsermissedCalls] = useState([]);
  const [callConference, setCallConference] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [userCampaign, setUserCampaign] = useState(null);
  const router = useRouter();
  const computedMissedCallsLength = useMemo(() => {
    return Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign).length;
  }, [usermissedCalls, userCampaign]);

  const [selectedDate, setSelectedDate] = useState('');
  const [token, setToken] = useState('');
  const [formState, setFormState] = useState({});
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // In your web app React component:

  useEffect(() => {
    // Expose functions to React Native
    window.answerIncomingCall = function () {
      console.log('answerIncomingCall called from React Native');
      answerIncomingCall();
    };

    window.rejectIncomingCall = function () {
      console.log('rejectIncomingCall called from React Native');
      rejectIncomingCall();
    };

    // Cleanup function
    return () => {
      delete window.answerIncomingCall;
      delete window.rejectIncomingCall;
    };
  }, []);

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
    if (!userCampaign || !token) return;

    async function loadForm() {
      setLoading(true);
      try {
        // Step 1: Get formId from campaign
        const res1 = await fetch(`${window.location.origin}/getDynamicFormDataAgent/${userCampaign}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // if (!res1.ok) throw new Error('Failed to fetch form config');
        const data1 = await res1.json();
        const formId = data1.agentWebForm?.formId;
        // if (!formId) throw new Error('Form ID not found');

        // Step 2: Get full form config by formId
        const res2 = await fetch(`${window.location.origin}/getDynamicFormData/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // if (!res2.ok) throw new Error('Failed to fetch full form');
        const data2 = await res2.json();
        setFormConfig(data2.result);
      } catch (err) {
        toast.error(err.message || 'Failed to load form.');
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
  return (
    <>
      {/* Call Queue Alert */}
      {ringtone && ringtone.length > 0 && (
        <div className="backdrop-blur-md bg-blue-50/90 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-xl shadow-lg shadow-blue-500/10 mb-6 p-4 mx-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md animate-pulse">
              <PhoneMissed className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Call Queue: ({ringtone.length})</p>
              <marquee className="mt-1 text-xs font-medium truncate text-blue-600 dark:text-blue-300">
                {ringtone.map((call) => call.Caller).join(', ')}
              </marquee>
            </div>
          </div>
        </div>
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
          handleContact={handleSubmit}
          setFormData={setFormState}
          formData={formState}
          formConfig={formConfig}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
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

      <div className="max-w-lg">
        {status !== 'start' && userCall ? (
          <>
            {formConfig?.sections.length > 0 ? (
              <DynamicForm {...{ formConfig, formState, setFormState, userCall }} />
            ) : (
              <UserCall userCall={userCall} username={username} formData={formData} setFormData={setFormData} />
            )}
          </>
        ) : (
          <>
            {formConfig?.sections.length > 0 ? (
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
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
