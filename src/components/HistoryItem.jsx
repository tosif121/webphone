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
    <div className="p-2 flex items-baseline border-b justify-between">
      <div>
        <div className="gap-x-4 flex mb-2">
          <span className="text-sm text-gray-600">{format(new Date(date), 'MM/dd/yyyy')}</span>
          <span className="text-sm text-gray-600">{format(new Date(date), 'hh:mm bbbb')}</span>
        </div>
        <div className="gap-x-4 flex md:mb-2 flex-wrap">
          <span className="phone-numbe text-primary font-semibold">{phone}</span>
          <div>
            <span className="text-gray-600 mr-2">Status:</span>
            <em className={`font-medium ${status === 'Success' ? 'text-green-500' : 'text-red-600'}`}>
              {(status !== 'Success' && 'Failed') || status}
            </em>
          </div>
        </div>
        <div className="flex gap-5 items-center">
          <p className="duration text-gray-600">
            Duration: <em>{duration}</em>
          </p>
          <p className="text-blue">
            {type === 'outgoing' ? (
              <PhoneOutgoing className="w-5 h-5" />
            ) : type === 'incoming' ? (
              <PhoneIncoming className="w-5 h-5" />
            ) : (
              <PhoneMissed className="w-5 h-5 text-red-600" />
            )}
          </p>
        </div>
      </div>

      <div className="hover:text-red-800 cursor-pointer text-red-600" onClick={handleDelete}>
        <Trash2 className="w-5 h-5" />
      </div>
    </div>
  );
};

export default HistoryItem;