import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Dashboard from './Dashboard';
import AgentDashboard from './AgentDashboard';
import MobileNavigation from './MobileNavigation';
import DropCallsModal from './DropCallsModal';
import FollowUpCallsModal from './FollowUpCallsModal';
import HistoryContext from '@/context/HistoryContext';
import { JssipContext } from '@/context/JssipContext';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MobileTabsWrapper() {
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobile, setIsMobile] = useState(false);
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { status, followUpDispoes, dispositionModal } = useContext(JssipContext);
  const {
    dropCalls,
    setDropCalls,
    callAlert,
    setCallAlert,
    campaignMissedCallsLength,
    setCampaignMissedCallsLength,
    scheduleCallsLength,
    selectedBreak,
  } = useContext(HistoryContext);
  const { token, user: authUser } = useAuth();
  const username = authUser?.userid || authUser?.username || '';
  const userCampaign = authUser?.campaign || '';
  const [usermissedCalls, setUsermissedCalls] = useState([]);

  const isCallActive = status === 'calling' || status === 'conference' || status === 'incoming' || status === 'on_call';

  const getAuthHeaders = useCallback(
    (extra = {}) => {
      const headers = { ...extra };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return headers;
    },
    [token],
  );

  const computedMissedCallsLength = useCallback(() => {
    return Object.values(usermissedCalls || {}).filter(
      (call) => !call?.campaign || (userCampaign && call?.campaign === userCampaign),
    ).length;
  }, [usermissedCalls, userCampaign]);

  const fetchUserMissedCalls = useCallback(async () => {
    if (!token || !username) {
      setUsermissedCalls([]);
      return;
    }
    try {
      const response = await axios.post(
        `${window.location.origin}/userMissedCalls/${username}`,
        {},
        { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) },
      );
      if (response.data) {
        setUsermissedCalls(response.data.result || []);
      }
    } catch (error) {
      console.error('Error fetching missed calls:', error);
      setUsermissedCalls([]);
    }
  }, [getAuthHeaders, token, username]);

  useEffect(() => {
    setCampaignMissedCallsLength(computedMissedCallsLength());
  }, [computedMissedCallsLength, setCampaignMissedCallsLength]);

  useEffect(() => {
    if (token && username) {
      fetchUserMissedCalls();
    }
  }, [fetchUserMissedCalls, token, username]);

  useEffect(() => {
    if (!token || !username) return;
    const intervalId = setInterval(() => {
      fetchUserMissedCalls();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchUserMissedCalls, token, username]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    if ((status === 'start' && username) || dropCalls) {
      fetchUserMissedCalls();
      timeoutId = setTimeout(() => {
        if (isMounted) fetchUserMissedCalls();
      }, 2500);
    }
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dropCalls, fetchUserMissedCalls, status, username]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    if (username && selectedBreak) {
      fetchUserMissedCalls();
      timeoutId = setTimeout(() => {
        if (isMounted) fetchUserMissedCalls();
      }, 2500);
    }
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedBreak, fetchUserMissedCalls, username]);

  const isInitialTabRef = useRef(true);
  useEffect(() => {
    if (isInitialTabRef.current) {
      isInitialTabRef.current = false;
      return;
    }
    if (typeof window === 'undefined') return;
    if (activeTab === 'dialpad') {
      window.dispatchEvent(new CustomEvent('mobileTabShowPhone'));
    } else if (activeTab === 'recents') {
      window.dispatchEvent(new CustomEvent('mobileTabShowPhoneRecents'));
    } else {
      window.dispatchEvent(new CustomEvent('mobileTabHidePhone'));
    }
  }, [activeTab]);

  useEffect(() => {
    if (isCallActive && activeTab !== 'dialpad') {
      setActiveTab('dialpad');
      setDialpadOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openDialpad'));
      }
    }
  }, [isCallActive]);

  // When call ends, force back to dialpad tab
  const prevCallActiveRef = useRef(isCallActive);
  useEffect(() => {
    if (prevCallActiveRef.current && !isCallActive) {
      setActiveTab('dialpad');
      setDialpadOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openDialpad'));
      }
    }
    prevCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    // Set client flag first to prevent hydration mismatch
    setIsClient(true);

    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Listen for dialpad state changes
  useEffect(() => {
    const handleDialpadOpen = () => {
      setDialpadOpen(true);
      setActiveTab('dialpad');
    };

    const handleDialpadClose = () => {
      setDialpadOpen(false);
      // Don't change activeTab here, let user click on tabs
    };

    window.addEventListener('dialpadOpened', handleDialpadOpen);
    window.addEventListener('dialpadClosed', handleDialpadClose);

    return () => {
      window.removeEventListener('dialpadOpened', handleDialpadOpen);
      window.removeEventListener('dialpadClosed', handleDialpadClose);
    };
  }, []);

  const handleTabChange = (tab) => {
    if (tab === 'recents') {
      setActiveTab('recents');
      setDialpadOpen(true);
      // Open dialpad with recents view
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openDialpadRecents'));
      }
    } else if (tab === 'leads') {
      setActiveTab('leads');
      setDialpadOpen(false);
      // Close dialpad if open
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('closeDialpad'));
      }
    } else if (tab === 'stats') {
      setActiveTab('stats');
      setDialpadOpen(false);
      // Close dialpad if open
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('closeDialpad'));
      }
    } else if (tab === 'dialpad') {
      setActiveTab('dialpad');
      setDialpadOpen(true);
      // Open dialpad
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openDialpad'));
      }
    }
  };

  // Show loading state during SSR and initial hydration
  if (!isClient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // On desktop, always show Dashboard (leads)
  if (!isMobile) {
    return <Dashboard />;
  }

  // On mobile, show tabs
  return (
    <div className="flex flex-col h-screen w-full">
      {/* Mobile Navigation Header - Always visible */}
      <MobileNavigation activeTab={activeTab} onTabChange={handleTabChange} isCallActive={isCallActive} />

      {/* Missed Calls & Follow-up Calls Modals - Always available on mobile */}
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

      {/* Content Area - always show Dashboard when dispositionModal is open */}
      {(activeTab === 'leads' || activeTab === 'stats' || dispositionModal) && (
        <div className="flex-1 overflow-y-auto">
          <>
            {(activeTab === 'leads' || dispositionModal) && <Dashboard hideModals />}
            {activeTab === 'stats' && !dispositionModal && <AgentDashboard />}
          </>
        </div>
      )}
    </div>
  );
}
