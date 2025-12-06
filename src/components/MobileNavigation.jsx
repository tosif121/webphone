import { History, LayoutGrid, BarChart3, PhoneCall, TableOfContents } from 'lucide-react';

export default function MobileNavigation({ activeTab, onTabChange }) {
  const handleTabChange = (tab) => {
    console.log('Tab clicked:', tab);
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          <button
            onClick={() => handleTabChange('recents')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'recents' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <History className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Recents</span>
          </button>

          <button
            onClick={() => handleTabChange('leads')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'leads' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <TableOfContents className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Leads</span>
          </button>

          <button
            onClick={() => handleTabChange('stats')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'stats' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>

          <button
            onClick={() => handleTabChange('dialpad')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'dialpad' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Dialpad</span>
          </button>
        </div>
      </div>
    </>
  );
}
