import React from 'react';

const NetworkMonitor = ({ timeoutArray, timeWindow = 30000 }) => {
  const signalStrength = React.useMemo(() => {
    if (!Array.isArray(timeoutArray)) return 4;

    const recentTimeouts = timeoutArray.filter((timeout) => {
      if (!timeout.timestamp) return false;
      const timeoutTime = new Date(timeout.timestamp);
      const windowStart = new Date(Date.now() - timeWindow);
      return timeoutTime > windowStart;
    });

    const count = recentTimeouts.length;
    if (count >= 3) return 1;
    if (count === 2) return 2;
    if (count === 1) return 3;
    return 4;
  }, [timeoutArray, timeWindow]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end h-4 gap-1">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`w-1 rounded-sm transition-all duration-300 ${
              index < signalStrength ? 'bg-green-500' : 'bg-gray-300'
            }`}
            style={{ height: `${(index + 1) * 25}%` }}
            aria-label={`Signal bar ${index + 1} of 4 ${index < signalStrength ? 'active' : 'inactive'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NetworkMonitor;
