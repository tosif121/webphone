'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import WebRTCStats from './WebRTCStats';

export default function IncomingCall({
  incomingNumber,
  callerName,
  incomingSession,
  isIncomingRinging,
  answerIncomingCall,
  rejectIncomingCall,
  session,
}) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (isIncomingRinging) {
      const interval = setInterval(() => {
        setPulseKey((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isIncomingRinging]);

  const handleAnswer = () => {
    if (answerIncomingCall) answerIncomingCall();
  };

  const handleDecline = () => {
    if (rejectIncomingCall) rejectIncomingCall();
  };

  if (!isIncomingRinging) {
    return null;
  }

  const getInitials = (name, number) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (number) return number.slice(-2);
    return 'UC';
  };

  const displayName = callerName || 'Unknown Caller';
  const displayNumber = incomingNumber || 'Unknown Number';
  const initials = getInitials(callerName, incomingNumber);

  return (
    <div className="h-full flex flex-col">
      {session && session.connection && <WebRTCStats peerConnection={session.connection} />}

      {/* Header */}
      <div className="text-center pt-6 pb-3 sm:pt-8 sm:pb-4">
        <Badge
          variant="secondary"
          className="mb-2 animate-pulse bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs sm:text-sm"
        >
          Incoming call
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        {/* Avatar */}
        <div className="relative mb-4 sm:mb-6">
          <div
            key={`outer-pulse-${pulseKey}`}
            className="absolute -inset-6 sm:-inset-8 bg-blue-400/20 rounded-full animate-ping"
          />
          <div
            key={`middle-pulse-${pulseKey}`}
            className="absolute -inset-3 sm:-inset-4 bg-blue-400/30 rounded-full animate-ping animation-delay-300"
          />

          <div className="relative">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white dark:border-gray-700 shadow-xl">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=3b82f6`}
                alt={displayName}
              />
              <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-blue-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Caller Details */}
        <div className="text-center space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words px-2">
            {displayName}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">{displayNumber}</p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Calling...</p>
        </div>
      </div>

      {/* Call Action Buttons */}
      <div className="pb-6 sm:pb-8 px-6">
        <div className="flex justify-center items-center gap-10 sm:gap-20">
          {/* Decline */}
          <div className="relative">
            <Button
              onClick={handleDecline}
              size="lg"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl border-4 border-white dark:border-gray-700"
            >
              <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-white rotate-[133deg]" />
            </Button>
          </div>

          {/* Answer */}
          <div className="relative">
            <div
              key={`answer-pulse-1-${pulseKey}`}
              className="absolute -inset-3 sm:-inset-4 bg-green-400/30 rounded-full animate-ping"
            />
            <div
              key={`answer-pulse-2-${pulseKey}`}
              className="absolute -inset-5 sm:-inset-6 bg-green-400/20 rounded-full animate-ping animation-delay-300"
            />
            <div
              key={`answer-pulse-3-${pulseKey}`}
              className="absolute -inset-7 sm:-inset-8 bg-green-400/10 rounded-full animate-ping animation-delay-600"
            />

            <Button
              onClick={handleAnswer}
              size="lg"
              className="relative w-14 h-14 sm:w-16 sm:h-16 text-white rounded-full p-0 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl border-4 border-white dark:border-gray-700 animate-bounce"
            >
              <Phone className="w-7 h-7 sm:w-8 sm:h-8" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
