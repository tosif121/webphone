import { Phone } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const InterModal = ({
  adminUserData,
  handleCall,
  setPhoneNumber,
  setInfo,
  status,
  setConferenceNumber,
  handleCalls,
}) => {
  const [pendingCall, setPendingCall] = useState(null);

  useEffect(() => {
    if (pendingCall) {
      if (status !== 'start') {
        handleCalls();
      } else {
        handleCall();
      }
      setInfo(false);
      setPendingCall(null);
    }
  }, [pendingCall, handleCall, setInfo]);

  const handleUserCall = (user) => {
    const trimmedUser = user.split('@')[0];
    if (status !== 'start') {
      setConferenceNumber(trimmedUser);
    } else {
      setPhoneNumber(trimmedUser);
    }
    setPendingCall(true);
  };

  return (
    <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
      {adminUserData.length > 0 ? (
        <div className="space-y-3">
          {adminUserData.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:mb-0"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  {item.user}
                </h3>
                <span className="text-sm font-normal text-gray-600">
                  Last Updated: {new Date(item.Time).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleUserCall(item.user)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200"
              >
                <Phone className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No available users found</p>
          <p className="text-sm mt-1">All users are currently in use or offline</p>
        </div>
      )}
    </div>
  );
};

export default InterModal;
