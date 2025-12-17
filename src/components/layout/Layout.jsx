import React, { useEffect, useContext, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import { JssipContext } from '@/context/JssipContext';

import { toast } from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';
import Disposition from '../Disposition';
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
    // Add call handling functions
    incomingSession,
    answerIncomingCall,
    rejectIncomingCall,
    isIncomingRinging,
  } = useContext(JssipContext);
  const { username } = useContext(HistoryContext);
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

  // Set up mobile audio routing
  useEffect(() => {
    if (isMobile && audioRef.current) {
      // Configure audio element for mobile earpiece routing
      const configureAudioForMobile = () => {
        if (audioRef.current) {
          // Set audio output to default (earpiece/headset)
          if (audioRef.current.setSinkId) {
            audioRef.current.setSinkId('default').catch(console.warn);
          }

          // Add mobile-specific audio attributes
          audioRef.current.setAttribute('webkit-playsinline', 'true');
          audioRef.current.setAttribute('playsinline', 'true');

          // Ensure audio plays through earpiece on iOS
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            audioRef.current.volume = 1.0;
          }
        }
      };

      configureAudioForMobile();

      // Reconfigure when audio loads
      if (audioRef.current) {
        audioRef.current.addEventListener('loadedmetadata', configureAudioForMobile);
        audioRef.current.addEventListener('canplay', configureAudioForMobile);
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', configureAudioForMobile);
          audioRef.current.removeEventListener('canplay', configureAudioForMobile);
        }
      };
    }
  }, [isMobile, audioRef]);

  // Get user campaign and token from localStorage
  useEffect(() => {
    const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (tokenData) {
      try {
        const parsedData = JSON.parse(tokenData);
        console.log('Layout - Raw token data:', parsedData);

        // Try multiple possible paths for campaign (matching Dashboard.jsx)
        const campaignID =
          parsedData?.userData?.campaign || // Primary path used in Dashboard
          parsedData?.userData?.campaignID ||
          parsedData?.user?.campaignID ||
          parsedData?.campaignID ||
          parsedData?.data?.campaignID;

        // Try multiple possible paths for token
        const accessToken =
          parsedData?.token || // Primary path used in Dashboard
          parsedData?.accessToken ||
          parsedData?.data?.token;

        console.log('Layout - Extracted data:', {
          campaignID,
          hasToken: !!accessToken,
          tokenLength: accessToken?.length,
          userData: parsedData?.userData,
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
  const shouldShowPhone = !hiddenPhoneRoutes.includes(router.pathname);

  // Listen for form submission from LeadAndCallInfoPanel
  useEffect(() => {
    const handleFormSubmitted = () => {
      setFormSubmitted(true);
    };

    window.addEventListener('callInfoFormSubmitted', handleFormSubmitted);
    return () => window.removeEventListener('callInfoFormSubmitted', handleFormSubmitted);
  }, []);

  // Auto-disposition on mobile when call ends
  useEffect(() => {
    const autoDispositionOnMobile = async () => {
      if (isMobile && dispositionModal && bridgeID && username) {
        try {
          console.log('📱 Mobile: Auto-disposing call...');

          const requestBody = {
            bridgeID,
            Disposition: 'Auto Disposed',
            autoDialDisabled: false,
          };

          const response = await axios.post(`${window.location.origin}/user/disposition${username}`, requestBody);

          if (response.data.success) {
            console.log('✅ Mobile: Auto disposition successful');

            // Refresh leads
            fetchLeadsWithDateRange();

            // Close disposition modal and clear state
            setDispositionModal(false);
            setPhoneNumber('');
            setCallType('');
          } else {
            console.error('❌ Mobile: Auto disposition failed:', response.data.message);
            toast.error(response.data.message || 'Auto disposition failed');
          }
        } catch (error) {
          console.error('❌ Mobile: Auto disposition error:', error);

          // If it's a 400 error, just close the modal silently
          if (error.response?.status === 400) {
            setDispositionModal(false);
            setPhoneNumber('');
            setCallType('');
          } else {
            toast.error('Auto disposition failed, please select manually');
          }
        }
      }
    };

    autoDispositionOnMobile();
  }, [
    isMobile,
    dispositionModal,
    bridgeID,
    username,
    fetchLeadsWithDateRange,
    setDispositionModal,
    setPhoneNumber,
    setCallType,
  ]);

  // Expose answerIncomingCall to window object for React Native integration
  useEffect(() => {
    console.log('Layout: Setting up window.answerIncomingCall');
    
    // Store original function if it exists
    const originalAnswerIncomingCall = window.answerIncomingCall;
    const originalRejectIncomingCall = window.rejectIncomingCall;

    // Set up message handler for React Native
    window.onReactNativeMessage = (data) => {
      try {
        console.log('Layout: Received React Native message:', data);
        if (data?.type === 'call_action') {
          if (data.action === 'accept') {
            console.log('Layout: Processing accept action');
            window.answerIncomingCall?.();
          } else if (data.action === 'decline') {
            console.log('Layout: Processing decline action');
            console.log('Layout: About to call window.rejectIncomingCall');
            if (window.rejectIncomingCall) {
              window.rejectIncomingCall();
              console.log('Layout: window.rejectIncomingCall called successfully');
            } else {
              console.error('Layout: window.rejectIncomingCall not available');
            }
          }
        }
      } catch (err) {
        console.error('Layout: Failed to process React Native message:', err);
      }
    };

    // Expose answerIncomingCall function
    window.answerIncomingCall = function () {
      console.log('Layout: window.answerIncomingCall called');
      console.log('Layout: answerIncomingCall available:', typeof answerIncomingCall);
      console.log('Layout: incomingSession available:', !!incomingSession);
      console.log('Layout: isIncomingRinging:', isIncomingRinging);
      
      if (answerIncomingCall && typeof answerIncomingCall === 'function' && incomingSession) {
        console.log('Layout: Executing answerIncomingCall');
        answerIncomingCall();
        
        // Immediately notify React Native that call was answered to stop ringtone
        if (window.ReactNativeWebView?.postMessage) {
          // Send multiple status updates to ensure ringtone stops
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'call_status',
              status: 'accepted',
              timestamp: Date.now(),
            })
          );
          
          // Also send isIncomingRinging false to ensure ringtone stops
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'isIncomingRinging',
                value: false,
                timestamp: Date.now(),
              })
            );
          }, 50);
          
          // Send in_call status after a short delay
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'call_status',
                status: 'in_call',
                timestamp: Date.now(),
              })
            );
          }, 100);
        }
      } else if (originalAnswerIncomingCall && typeof originalAnswerIncomingCall === 'function') {
        console.log('Layout: Executing original answerIncomingCall');
        originalAnswerIncomingCall();
      } else {
        console.warn('Layout: No answerIncomingCall function available or no incoming session');
      }
    };

    // Expose rejectIncomingCall function
    window.rejectIncomingCall = function () {
      console.log('Layout: window.rejectIncomingCall called');
      console.log('Layout: rejectIncomingCall available:', typeof rejectIncomingCall);
      console.log('Layout: incomingSession available:', !!incomingSession);
      console.log('Layout: isIncomingRinging:', isIncomingRinging);
      
      // Try to reject the call - don't require incomingSession for decline
      if (rejectIncomingCall && typeof rejectIncomingCall === 'function') {
        console.log('Layout: Executing rejectIncomingCall');
        try {
          rejectIncomingCall();
          console.log('Layout: rejectIncomingCall executed successfully');
        } catch (error) {
          console.error('Layout: Error executing rejectIncomingCall:', error);
        }
        
        // Immediately notify React Native that call was declined to stop ringtone
        if (window.ReactNativeWebView?.postMessage) {
          // Send multiple status updates to ensure ringtone stops
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'call_status',
              status: 'declined',
              timestamp: Date.now(),
            })
          );
          
          // Also send isIncomingRinging false to ensure ringtone stops
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'isIncomingRinging',
                value: false,
                timestamp: Date.now(),
              })
            );
          }, 50);
          
          // Send idle status after a short delay
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'call_status',
                status: 'idle',
                timestamp: Date.now(),
              })
            );
          }, 100);
        }
      } else if (originalRejectIncomingCall && typeof originalRejectIncomingCall === 'function') {
        console.log('Layout: Executing original rejectIncomingCall');
        try {
          originalRejectIncomingCall();
          console.log('Layout: Original rejectIncomingCall executed successfully');
        } catch (error) {
          console.error('Layout: Error executing original rejectIncomingCall:', error);
        }
        
        // Still report decline status
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'call_status',
              status: 'declined',
              timestamp: Date.now(),
            })
          );
        }
      } else {
        console.warn('Layout: No rejectIncomingCall function available');
        
        // Even if no function is available, report decline to stop ringtone
        if (window.ReactNativeWebView?.postMessage) {
          console.log('Layout: Reporting decline status as fallback');
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'call_status',
              status: 'declined',
              timestamp: Date.now(),
            })
          );
          
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'isIncomingRinging',
                value: false,
                timestamp: Date.now(),
              })
            );
          }, 50);
        }
      }
    };

    console.log('Layout: Window functions set up successfully');

    // Cleanup function
    return () => {
      console.log('Layout: Cleaning up window functions');
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
  }, [incomingSession, answerIncomingCall, rejectIncomingCall, isIncomingRinging]);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex items-center justify-center">
          <div className="w-full containere mx-auto py-4 sm:py-8">{children}</div>
        </main>
        <Footer />
      </div>

      {/* Phone UI - conditionally rendered WITHOUT wrapper */}
      {shouldShowPhone && <DraggableWebPhone />}

      {/* Persistent audio - ALWAYS mounted, never unmounts */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
        onLoadedMetadata={() => {
          // Set audio output to earpiece for mobile devices
          if (isMobile && audioRef.current && audioRef.current.setSinkId) {
            // Try to set to earpiece/headset (default audio output)
            audioRef.current.setSinkId('default').catch(console.warn);
          }
        }}
      />
    </>
  );
}
