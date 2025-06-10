import HistoryContext from '../context/HistoryContext';
import { useContext } from 'react';
import { ArrowLeft, Trash2, Phone, AlertCircle } from 'lucide-react';
import HistoryItem from './HistoryItem';

const HistoryScreen = ({ setSeeLogs, setPhoneNumber, handleCall }) => {
  const { history, setHistory } = useContext(HistoryContext);

  const handleClearHistory = () => setHistory([]);
  const handleGoBack = () => setSeeLogs(false);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/60">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold text-primary">Call History</h1>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive hover:text-destructive-foreground"
            aria-label="Clear Call Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No call history</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your recent calls will appear here once you start making calls.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...history].reverse().map((item, index) => (
              <div
                key={index}
                className="bg-card/70 hover:bg-accent/80 rounded-xl p-3 transition-all border border-transparent hover:border-accent shadow-sm"
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
        <div className="bg-muted/70 border-t border-border px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Scroll to see more call history</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
