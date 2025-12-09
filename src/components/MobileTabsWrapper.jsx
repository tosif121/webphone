import { useState, useEffect, useContext } from 'react';
import Dashboard from './Dashboard';
import AgentDashboard from './AgentDashboard';
import MobileNavigation from './MobileNavigation';
import { JssipContext } from '@/context/JssipContext';
import toast from 'react-hot-toast';

export default function MobileTabsWrapper() {
  const [activeTab, setActiveTab] = useState('leads');
  const [isMobile, setIsMobile] = useState(false);
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const { status } = useContext(JssipContext);

  // Check if there's an active call
  const isCallActive = status === 'calling' || status === 'conference' || status === 'incoming';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
    // Prevent switching to Leads or Stats during an active call
    if (isCallActive && (tab === 'leads' || tab === 'stats')) {
      toast.error('Cannot access Leads or Stats during an active call');
      return;
    }

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

  // On desktop, always show Dashboard (leads)
  if (!isMobile) {
    return <Dashboard />;
  }

  // On mobile, show tabs
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Navigation Header - Always visible */}
      <MobileNavigation activeTab={activeTab} onTabChange={handleTabChange} isCallActive={isCallActive} />

      {/* Content Area with padding for header and bottom nav */}
      {/* Only show content area for leads and stats tabs, dialpad and recents are handled by DraggableWebPhone */}
      {(activeTab === 'leads' || activeTab === 'stats') && (
        <div className="flex-1 overflow-y-auto">
          <>
            {activeTab === 'leads' && <Dashboard />}
            {activeTab === 'stats' && <AgentDashboard />}
          </>
        </div>
      )}
    </div>
  );
}
