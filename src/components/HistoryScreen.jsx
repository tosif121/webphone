import HistoryContext from '../context/HistoryContext';
import { useContext } from 'react';
import { ArrowLeft, Trash2, Phone, AlertCircle } from 'lucide-react';
import HistoryItem from './HistoryItem';

const HistoryScreen = ({ setSeeLogs, setPhoneNumber, handleCall }) => {
  const { history, setHistory } = useContext(HistoryContext);

  const handleClearHistory = () => setHistory([]);
  const handleGoBack = () => setSeeLogs(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/60">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-primary">Call History</h1>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive hover:text-destructive-foreground"
            aria-label="Clear Call Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-y-auto max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Phone className="w-6 h-6 text-primary/40" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 sm:mb-2">No call history</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              Your recent calls will appear here once you start making calls.
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            {[...history].reverse().map((item, index) => (
              <div
                key={index}
                className="bg-card/70 hover:bg-accent/80 rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all border border-transparent hover:border-accent shadow-sm"
              >
                <HistoryItem
                  date={item.startTime}
                  phone={item.phoneNumber}
                  start={item.start}
                  end={item.end}
                  status={item.status}
                  index={index}
                  type={item.type}
                  handleCall={handleCall}
                  setPhoneNumber={setPhoneNumber}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {history.length > 5 && (
        <div className="bg-muted/70 border-t border-border px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Scroll to see more call history</span>
            <span className="sm:hidden">Scroll for more</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
