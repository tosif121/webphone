import { useState, useEffect, useContext, useMemo } from 'react';
import CallConference from './CallConference';
import AutoDial from './AutoDial';
import UserCall from './UserCall';
import axios from 'axios';
import toast from 'react-hot-toast';
import DropCallsModal from './DropCallsModal';
import InterModal from './oldcomponents/InterModal';
import HistoryContext from '@/context/HistoryContext';
import CallScreen from './CallScreen';
import Disposition from './Disposition';
import HistoryScreen from './HistoryScreen';
import Home from './Home';
import useJssip from '@/hooks/useJssip';
import { Bell, Phone, PhoneOff } from 'lucide-react';

function Dashboard() {
  const [
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
    setStatus,
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
    // isDialbuttonClicked,
    // setIsDialbuttonClicked,
  ] = useJssip();

  const [seeLogs, setSeeLogs] = useState(false);
  const [callConference, setCallConference] = useState(false);
  const { username, dropCalls, setDropCalls, selectedBreak, setSelectedStatus, setInfo, info } =
    useContext(HistoryContext);
  const [usermissedCalls, setUsermissedCalls] = useState([]);
  const [phoneShow, setPhoneShow] = useState(false);
  const tokenData = localStorage.getItem('token');
  const parsedData = JSON.parse(tokenData);
  const userCampaign = parsedData?.userData?.campaign;
  const adminUser = parsedData?.userData?.adminuser;
  const userId = parsedData?.userData?.userid;
  const token = parsedData?.token;

  const campaignMissedCallsLength = useMemo(() => {
    return Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign).length;
  }, [usermissedCalls, userCampaign]);
  const [adminUserData, setAdminUserData] = useState([]);

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

  useEffect(() => {
    if (status == 'start') {
      fetchUserMissedCalls();
    }
  }, [status]);

  useEffect(() => {
    if (selectedBreak != 'Break' && ringtone.length >= 0) {
      fetchUserMissedCalls();
    }
  }, [ringtone]);

  console.log(username, 'username');
  const fetchUserMissedCalls = async () => {
    if (!username) {
      return;
    }
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/usermissedCalls/${username}`);
      setUsermissedCalls(response.data.result || []);
    } catch (error) {
      console.error('Error fetching missed calls:', error);
      setUsermissedCalls([]);
    }
  };

  const fetchAdminUser = async () => {
    try {
      const response = await axios.get(`https://esamwad.iotcom.io/users/${adminUser}`, {
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
    if (status === 'start') {
      stopRecording();
    }
  }, [status]);

  useEffect(() => {
    if (status) {
      setSelectedStatus(status);
    }
  }, [status]);

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
      const response = await axios.post(`https://esamwad.iotcom.io/addModifyContact`, payload, {
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

  function handleCalls() {
    createConferenceCall();
    setCallConference(false);
  }

  return (
    <>
      {/* Notification badge for missed calls */}
      {campaignMissedCallsLength > 0 && (
        <div className="fixed top-4 right-20 md:right-24 z-50 animate-pulse">
          <div className="relative">
            <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold shadow-lg shadow-red-500/30">
              {campaignMissedCallsLength}
            </div>
            <button
              onClick={() => setDropCalls(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 transition-all"
            >
              <Bell className="h-5 w-5 text-red-500" />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen w-full relative">
        {/* Modals */}
        {dispositionModal && (
          <Disposition
            bridgeID={bridgeID}
            setDispositionModal={setDispositionModal}
            userCall={userCall}
            handleContact={handleContact}
            setFormData={setFormData}
            formData={formData}
          />
        )}

        {info && (
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
        )}

        {dropCalls && (
          <Modal
            isOpen={dropCalls}
            onClose={() => setDropCalls(false)}
            title={`Users Missed Calls (${campaignMissedCallsLength})`}
          >
            <DropCallsModal usermissedCalls={usermissedCalls} setDropCalls={setDropCalls} username={username} />
          </Modal>
        )}

        {/* Call Queue Alert */}
        {ringtone.length > 0 && (
          <div className="fixed top-20 left-0 right-0 mx-auto max-w-lg z-40">
            <div className="backdrop-blur-md bg-blue-50/90 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-xl shadow-lg shadow-blue-500/10 p-3 mx-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 animate-pulse">
                  <FaPhoneAlt className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Call Queue: ({ringtone.length})
                  </p>
                  <div className="mt-1 text-xs font-medium truncate text-blue-600 dark:text-blue-300">
                    {ringtone.map((call) => call.Caller).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phone toggle button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
            onClick={() => setPhoneShow(!phoneShow)}
          >
            {phoneShow ? (
              <PhoneOff className="h-5 w-5" title="Hide phone" />
            ) : (
              <Phone className="h-5 w-5" title="Show phone" />
            )}
          </button>
        </div>

        {/* Main content area */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left panel - Call info or Auto dialer */}
              {status !== 'start' && userCall ? (
                <div className="w-full lg:w-1/2 xl:w-3/5">
                  <div className="h-full backdrop-blur-sm bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/20 p-4 shadow-lg shadow-blue-500/5">
                    <UserCall userCall={userCall} username={username} formData={formData} setFormData={setFormData} />
                  </div>
                </div>
              ) : (
                <div className="w-full lg:w-1/2 xl:w-3/5 relative">
                  <div className="h-full backdrop-blur-sm bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/20 p-4 shadow-lg shadow-blue-500/5">
                    <AutoDial
                      setPhoneNumber={setPhoneNumber}
                      dispositionModal={dispositionModal}
                      handleCall={handleCall}
                      phoneNumber={phoneNumber}
                    />
                  </div>
                </div>
              )}

              {/* Right panel - Call controls, dial pad, history */}
              <div className={`w-full ${status !== 'start' ? 'lg:w-1/2 xl:w-2/5' : ''}`}>
                <div
                  className={`h-full backdrop-blur-sm bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/20 p-4 shadow-lg shadow-blue-500/5 transition-opacity duration-300 ${
                    phoneShow ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {seeLogs ? (
                    <HistoryScreen setSeeLogs={setSeeLogs} />
                  ) : status === 'start' ? (
                    <Home
                      phoneNumber={phoneNumber}
                      setPhoneNumber={setPhoneNumber}
                      handleCall={handleCall}
                      setSeeLogs={setSeeLogs}
                      timeoutArray={timeoutArray}
                      isConnectionLost={isConnectionLost}
                    />
                  ) : status === 'calling' || status === 'conference' ? (
                    callConference ? (
                      <CallConference
                        conferenceNumber={conferenceNumber}
                        setCallConference={setCallConference}
                        setConferenceNumber={setConferenceNumber}
                        handleCall={handleCalls}
                        setSeeLogs={setSeeLogs}
                        phoneNumber={phoneNumber}
                      />
                    ) : (
                      <CallScreen
                        conferenceNumber={conferenceNumber}
                        userCall={userCall}
                        reqUnHold={reqUnHold}
                        setCallConference={setCallConference}
                        toggleHold={toggleHold}
                        isHeld={isHeld}
                        isRecording={isRecording}
                        startRecording={startRecording}
                        stopRecording={stopRecording}
                        phoneNumber={phoneNumber}
                        session={session}
                        seconds={seconds < 10 ? `0${seconds}` : `${seconds}`}
                        minutes={minutes < 10 ? `0${minutes}` : `${minutes}`}
                        isRunning={isRunning}
                        devices={devices}
                        selectedDeviceId={selectedDeviceId}
                        changeAudioDevice={changeAudioDevice}
                        conferenceStatus={conferenceStatus}
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4">
                        <FaPhoneAlt className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">No Active Calls</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Ready to make or receive calls</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

        <audio ref={audioRef} autoPlay hidden />
      </div>
    </>
  );
}

export default Dashboard;
