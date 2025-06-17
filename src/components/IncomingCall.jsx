import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, UserCheck, Volume2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Props: session (SIP/WebRTC session), onAnswer, onDecline, onHangup, onMute
export default function IncomingCall({
  caller = {
    name: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    initials: 'SJ',
  },
  callStatus = 'incoming', // 'incoming' | 'active' | 'ended'
  onAnswer,
  onDecline,
  onHangup,
  isMuted = false,
  onMute,
  callDuration = 0,
}) {
  // Local state for animation/UX
  const [localStatus, setLocalStatus] = useState(callStatus);
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [duration, setDuration] = useState(callDuration);

  // Sync props/state
  useEffect(() => setLocalStatus(callStatus), [callStatus]);
  useEffect(() => setLocalMuted(isMuted), [isMuted]);
  useEffect(() => setDuration(callDuration), [callDuration]);

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (localStatus === 'active') {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [localStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Button handlers
  const handleAnswer = () => {
    setLocalStatus('active');
    if (onAnswer) onAnswer();
  };
  const handleDecline = () => {
    setLocalStatus('ended');
    if (onDecline) onDecline();
  };
  const handleHangup = () => {
    setLocalStatus('ended');
    if (onHangup) onHangup();
  };
  const handleMute = () => {
    setLocalMuted((m) => !m);
    if (onMute) onMute(!localMuted);
  };

  if (localStatus === 'ended') {
    return (
      <Card className="max-w-sm mx-auto shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl">
                <Phone className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold mb-2">Call Ended</h2>
            <p className="text-muted-foreground">Duration: {formatDuration(duration)}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="rounded-full px-6">
            New Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`max-w-sm mx-auto shadow-2xl ${localStatus === 'incoming' ? 'animate-pulse' : ''}`}>
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2">
            {localStatus === 'incoming' ? 'Incoming call' : 'Call in progress'}
          </Badge>
          {localStatus === 'active' && (
            <p className="text-green-600 dark:text-green-400 font-mono text-lg font-semibold">
              {formatDuration(duration)}
            </p>
          )}
        </div>

        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <Avatar className="w-32 h-32 border-4 border-border">
              <AvatarImage src={caller.avatar} alt={caller.name} />
              <AvatarFallback className="text-3xl font-semibold">{caller.initials}</AvatarFallback>
            </Avatar>
            {localStatus === 'active' && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1">{caller.name}</h1>
          <p className="text-muted-foreground mb-1">{caller.phone}</p>
        </div>

        {/* Call Actions */}
        {localStatus === 'incoming' ? (
          <div className="flex justify-center items-center space-x-6">
            {/* Decline Button */}
            <Button
              onClick={handleDecline}
              size="lg"
              variant="destructive"
              className="w-16 h-16 rounded-full p-0 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            {/* Answer Button */}
            <Button
              onClick={handleAnswer}
              size="lg"
              className="w-16 h-16 rounded-full p-0 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 hover:scale-110 active:scale-95 transition-all duration-200 animate-bounce"
            >
              <Phone className="w-8 h-8" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center items-center space-x-6">
            {/* Mute Button */}
            <Button
              onClick={handleMute}
              size="lg"
              variant={localMuted ? 'destructive' : 'outline'}
              className="w-14 h-14 rounded-full p-0 hover:scale-110 transition-all duration-200"
            >
              {localMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            {/* End Call Button */}
            <Button
              onClick={handleHangup}
              size="lg"
              variant="destructive"
              className="w-16 h-16 rounded-full p-0 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            {/* Add Contact Button */}
            <Button
              size="lg"
              variant="outline"
              className="w-14 h-14 rounded-full p-0 hover:scale-110 transition-all duration-200"
            >
              <UserCheck className="w-6 h-6" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
