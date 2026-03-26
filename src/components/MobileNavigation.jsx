import { History, LayoutGrid, BarChart3, PhoneCall, TableOfContents } from 'lucide-react';

export default function MobileNavigation({ activeTab, onTabChange, isCallActive = false }) {
  const handleTabChange = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'recents':
        return 'Call History';
      case 'leads':
        return 'Agent Panel';
      case 'stats':
        return 'Agent Dashboard';
      case 'dialpad':
        return 'Dialpad';
      default:
        return 'SAMWAD';
    }
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[1001] border-t border-border bg-card md:hidden">
        <div className="flex items-center justify-around p-1 safe-area-inset-bottom">
          <button
            onClick={() => handleTabChange('recents')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'recents'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <History className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'recents' ? 'scale-110' : ''}`} />
            <span className="text-[10px]">Recents</span>
          </button>

          <button
            onClick={() => handleTabChange('leads')}
            disabled={isCallActive}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'leads'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-muted/50'
            } ${isCallActive ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <TableOfContents
              className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'leads' ? 'scale-110' : ''}`}
            />
            <span className="text-[10px]">Leads</span>
          </button>

          <button
            onClick={() => handleTabChange('stats')}
            disabled={isCallActive}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'stats'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-muted/50'
            } ${isCallActive ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <BarChart3 className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'stats' ? 'scale-110' : ''}`} />
            <span className="text-[10px]">Stats</span>
          </button>

          <button
            onClick={() => handleTabChange('dialpad')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
              activeTab === 'dialpad'
                ? 'text-primary bg-primary/10 font-semibold'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <LayoutGrid
              className={`w-5 h-5 mb-0.5 transition-transform ${activeTab === 'dialpad' ? 'scale-110' : ''}`}
            />
            <span className="text-[10px]">Dialpad</span>
          </button>
        </div>
      </div>
    </>
  );
}
