import React, { useCallback, useMemo } from 'react';
import { FiPhone } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import maskPhoneNumber from '../hooks/maskPhoneNumber';

const DropCallsModal = ({ usermissedCalls, setDropCalls, username }) => {
  const tokenData = localStorage.getItem('token');
  const parsedData = JSON.parse(tokenData);
  const userCampaign = parsedData?.userData?.campaign;
  const adminUser = parsedData?.userData?.adminuser;

  const groupedCalls = useMemo(() => {
    const filteredCalls = Object.values(usermissedCalls || {}).filter((call) => {
      return call?.campaign === userCampaign;
    });

    return filteredCalls.reduce((acc, call) => {
      if (!call?.Caller) return acc;

      if (!acc[call.Caller]) {
        acc[call.Caller] = {
          count: 0,
          calls: [],
          latestTime: 0,
          campaign: call.campaign,
        };
      }

      acc[call.Caller].count += 1;
      acc[call.Caller].calls.push(call);
      acc[call.Caller].latestTime = Math.max(acc[call.Caller].latestTime, parseInt(call.startTime) || 0);

      return acc;
    }, {});
  }, [usermissedCalls, userCampaign]);

  const removeCountryCode = (phoneNumber, countryCode = '+91') => {
    return phoneNumber.startsWith(countryCode) ? phoneNumber.slice(countryCode.length) : phoneNumber;
  };

  const initiateCall = useCallback(
    async (caller) => {
      try {
        const sanitizedCaller = removeCountryCode(caller);
        const response = await axios.post(`${window.location.origin}/dialmissedcall`, {
          caller: username,
          receiver: sanitizedCaller,
        });
        setDropCalls(false);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Request failed. Please try again.');
      }
    },
    [username, userCampaign]
  );

  if (Object.entries(groupedCalls).length === 0) {
    return (
      <div className="p-3">
        <p className="text-gray-500">No missed calls available for campaign: {userCampaign}</p>
      </div>
    );
  }

  const sortedEntries = Object.entries(groupedCalls).sort((a, b) => b[1].latestTime - a[1].latestTime);

  return (
    <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
      {sortedEntries.map(([caller, data]) => (
        <div
          key={caller}
          className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:mb-0"
        >
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              {maskPhoneNumber(caller)}
              <span className="text-sm font-normal text-gray-600">
                ({data.count} missed {data.count === 1 ? 'call' : 'calls'})
              </span>
            </h3>
            <p className="text-sm text-gray-500">Recent call: {new Date(data.latestTime).toLocaleString()}</p>
          </div>
          <button
            onClick={() => initiateCall(caller)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200"
            aria-label={`Call ${caller}`}
          >
            <FiPhone className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default DropCallsModal;
