import React, { useEffect, useContext, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import { JssipContext } from '@/context/JssipContext';
import { ConsentRequestModal } from '../ForceLoginModals';
import { toast } from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';
import Disposition from '../Disposition';
import LeadAndCallInfoPanel from '../LeadAndCallInfoPanel';
import axios from 'axios';

export default function Layout({ children }) {
  const router = useRouter();
  const {
    audioRef,
    bridgeID,
    dispositionModal,
    setDispositionModal,
    userCall,
    callType,
    setCallType,
    setPhoneNumber,
    handleCall,
    status,
    connectionStatus,
  } = useContext(JssipContext);
  const { showSecurityAlert, setShowSecurityAlert, username } = useContext(HistoryContext);
  const [isMobile, setIsMobile] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [userCampaign, setUserCampaign] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get user campaign and token from localStorage
  useEffect(() => {
    const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (tokenData) {
      try {
        const parsedData = JSON.parse(tokenData);
        console.log('Layout - Raw token data:', parsedData);
        
        // Try multiple possible paths for campaign (matching Dashboard.jsx)
        const campaignID = 
          parsedData?.userData?.campaign ||      // Primary path used in Dashboard
          parsedData?.userData?.campaignID || 
          parsedData?.user?.campaignID || 
          parsedData?.campaignID ||
          parsedData?.data?.campaignID;
        
        // Try multiple possible paths for token
        const accessToken = 
          parsedData?.token ||                   // Primary path used in Dashboard
          parsedData?.accessToken || 
          parsedData?.data?.token;
        
        console.log('Layout - Extracted data:', { 
          campaignID, 
          hasToken: !!accessToken,
          tokenLength: accessToken?.length,
          userData: parsedData?.userData 
        });
        
        setUserCampaign(campaignID);
        setToken(accessToken);
      } catch (e) {
        console.error('Layout - Error parsing token:', e);
      }
    } else {
      console.warn('Layout - No token found in localStorage');
    }
  }, []);

  // Reset formSubmitted when dispositionModal closes
  useEffect(() => {
    if (!dispositionModal) {
      setFormSubmitted(false);
    }
  }, [dispositionModal]);

  // Function to fetch leads - can be called from Disposition
  const fetchLeadsWithDateRange = async () => {
    // Dispatch custom event to notify Dashboard to refresh leads
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshLeads'));
    }
  };

  const hiddenPhoneRoutes = ['/webphone/v1/agent-dashboard', '/webphone/v1/system-monitoring'];
  const shouldShowPhone = !hiddenPhoneRoutes.includes(router.pathname) && !showSecurityAlert;

  const handleAllowForceLogin = () => {
    // Handle logout and allow force login
    toast.success('Force login allowed. Logging out...');
    setShowSecurityAlert(false);

    // Clear token and redirect to login
    localStorage.removeItem('token');
    localStorage.setItem('userLoggedOut', 'true');
    router.push('/');
  };

  const handleRejectForceLogin = () => {
    // Handle rejection
    toast.error('Force login request rejected');
    setShowSecurityAlert(false);
  };

  // Listen for form submission from LeadAndCallInfoPanel
  useEffect(() => {
    const handleFormSubmitted = () => {
      setFormSubmitted(true);
    };

    window.addEventListener('callInfoFormSubmitted', handleFormSubmitted);
    return () => window.removeEventListener('callInfoFormSubmitted', handleFormSubmitted);
  }, []);

  // Listen for force login request messages from JsSIP
  useEffect(() => {
    const handleForceLoginRequest = (event) => {
      console.log('Force login request received in Layout:', event.detail);
      setShowSecurityAlert(true);
      toast.error('Security Alert: Someone is trying to login from another device!');
    };

    // Listen for custom forceLoginRequest event
    window.addEventListener('forceLoginRequest', handleForceLoginRequest);

    // FOR TESTING: Expose a function to manually trigger the security alert
    // You can call this from browser console: window.testForceLogin()
    window.testForceLogin = () => {
      console.log('Testing force login alert...');
      setShowSecurityAlert(true);
    };

    return () => {
      window.removeEventListener('forceLoginRequest', handleForceLoginRequest);
      delete window.testForceLogin;
    };
  }, [setShowSecurityAlert]);

  return (
    <>
      {/* Security Alert Modal */}
      {showSecurityAlert && <ConsentRequestModal onAllow={handleAllowForceLogin} onReject={handleRejectForceLogin} />}

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-4 sm:py-8">{children}</div>
        </main>
        <Footer />
      </div>

      {/* Phone UI - conditionally rendered WITHOUT wrapper - Hidden when Security Alert is shown */}
      {shouldShowPhone && <DraggableWebPhone />}

      {/* Disposition Modals - Mobile Only */}
      {isMobile && (
        <>
          {/* Active Call Information Modal - Shows first when call ends */}
          {!formSubmitted && dispositionModal && (
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
          )}

          {/* Disposition Modal - Shows after Active Call Information is submitted */}
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
        </>
      )}

      {/* Persistent audio - ALWAYS mounted, never unmounts */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
    </>
  );
}
