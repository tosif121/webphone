import { useState, useEffect } from 'react';
import AgentDashboard from './AgentDashboard';
import MobileNavigation from './MobileNavigation';

export default function MobileTabsWrapper() {
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobile, setIsMobile] = useState(false);
  const [dialpadOpen, setDialpadOpen] = useState(false);

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
    console.log('Changing tab to:', tab);
    
    if (tab === 'recents') {
      setActiveTab('recents');
      setDialpadOpen(true);
      // Open dialpad with recents view
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openDialpadRecents'));
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

  // On desktop, always show AgentDashboard (stats)
  if (!isMobile) {
    return <AgentDashboard />;
  }

  // On mobile, show tabs
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Navigation Header - Always visible */}
      <MobileNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Content Area with padding for header and bottom nav */}
      {/* Only show content area for stats tab, dialpad and recents are handled by DraggableWebPhone */}
      {activeTab === 'stats' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <AgentDashboard />
          </div>
        </div>
      )}
    </div>
  );
}
