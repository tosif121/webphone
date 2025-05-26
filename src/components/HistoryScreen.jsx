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
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-slate-600 dark:text-slate-300 hover:text-blue-700"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Call History
          </h1>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-red-500 dark:text-red-400 hover:text-red-600"
            aria-label="Clear Call Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto max-h-[60vh]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-blue-300 dark:text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No call history</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Your recent calls will appear here once you start making calls.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...history].reverse().map((item, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 rounded-xl p-3 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 shadow-sm"
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
        <div className="bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-4 h-4" />
            <span>Scroll to see more call history</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
