import { format } from 'date-fns';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2 } from 'lucide-react';
import HistoryContext from '../context/HistoryContext';
import { useContext } from 'react';

const HistoryItem = ({ date, phone, status, type, start, end, index, handleCall, setPhoneNumber }) => {
  const { setHistory } = useContext(HistoryContext);

  const range = (end - start) / 1000;
  const duration = `${Math.round(range / 60)}m ${Math.round(range % 60)}s`;

  const handleDelete = () => {
    setHistory((prev) => prev.filter((item, idx) => prev.length - 1 - index !== idx));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        {/* Date and Time */}
        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 mb-2">
          <span className="text-xs text-gray-600">{format(new Date(date), 'MM/dd/yyyy')}</span>
          <span className="text-xs text-gray-600">{format(new Date(date), 'hh:mm bbbb')}</span>
        </div>

        {/* Phone and Status */}
        <div className="flex flex-col gap-2 mb-2">
          <span className="text-sm font-semibold text-primary truncate">{phone}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Status:</span>
            <em className={`text-xs font-medium ${status === 'Success' ? 'text-green-500' : 'text-red-600'}`}>
              {(status !== 'Success' && 'Failed') || status}
            </em>
          </div>
        </div>

        {/* Duration and Call Type */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <p className="text-xs text-gray-600">
            Duration: <em className="font-medium">{duration}</em>
          </p>
          <div className="flex items-center gap-1">
            {type === 'outgoing' ? (
              <PhoneOutgoing className="w-4 h-4 text-blue-600" />
            ) : type === 'incoming' ? (
              <PhoneIncoming className="w-4 h-4 text-green-600" />
            ) : (
              <PhoneMissed className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs text-gray-500 capitalize sm:hidden">{type}</span>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="self-end sm:self-start hover:text-red-800 cursor-pointer text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
        aria-label="Delete call"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default HistoryItem;