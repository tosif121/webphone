import React from 'react';

const CircularLoader = ({ timer, message, isVisible }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const progress = circumference - (timer / (timer + 1)) * circumference;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 bg-opacity-95 flex flex-col justify-center items-center z-50">
      <h2 className="text-gray-800 text-xl mb-4">{message}</h2>
      <p className="text-gray-600">You will be redirected soon. </p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} className="fill-none stroke-gray-200 stroke-[8]" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="fill-none stroke-blue-500 stroke-[8]"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-800 text-2xl font-semibold">{timer}s</span>
        </div>
      </div>
    </div>
  );
};

export default CircularLoader;
