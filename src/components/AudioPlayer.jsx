'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AudioLines,
  Volume,
  Volume1,
  Volume2,
  Play,
  Pause,
  FileAudio,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AudioPlayer = ({ audioUrl, bridgeId, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);

  const handleSeek = (e) => {
    const time = (e.target.value / 100) * duration;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDialogClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open ? handleDialogClose() : undefined}>
      <DialogContent className="max-w-sm bg-card border border-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground text-left">
            Playing Recording
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center w-full p-4">
          {isPlaying ? (
            <AudioLines className="w-9 h-9 animate-pulse text-primary mb-2" />
          ) : (
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <FileAudio className="w-7 h-7 text-primary" /> {bridgeId}
            </div>
          )}

          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          <div className="flex items-center space-x-3 w-full max-w-xs mt-4">
            <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="flex-grow appearance-none h-1 bg-muted rounded-lg accent-primary"
            />
            <span className="text-xs text-muted-foreground w-10 text-left">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="flex items-center space-x-2">
              {volume === 0 ? (
                <Volume className="w-5 h-5 text-muted-foreground" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Volume2 className="w-5 h-5 text-muted-foreground" />
              )}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 rounded-lg appearance-none bg-muted accent-primary"
              />
            </div>
            <button
              onClick={handlePlayPause}
              className="bg-primary text-primary-foreground p-3 rounded-full hover:bg-accent hover:text-accent-foreground flex justify-center items-center transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudioPlayer;
