import React, { useState, useRef, useEffect } from 'react';
import { FcAudioFile } from 'react-icons/fc';
import { FiVolume, FiVolume1, FiVolume2, FiPlay, FiPause } from 'react-icons/fi';
import { LuAudioLines } from 'react-icons/lu';
import { Modal } from 'rsuite';

const AudioPlayer = ({ audioUrl, bridgeId, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  // Reset and cleanup when modal closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  // Cleanup on unmount
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
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

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

  const handleModalClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleModalClose} onBackdropClick={handleModalClose} size="xs">
      <Modal.Header>
        <Modal.Title className="text-lg font-semibold dark:text-gray-200 text-gray-800 text-left">
          Playing Recording
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="flex flex-col items-center justify-center w-full p-4 text-center">
        {/* Bridge ID */}
        {(isPlaying && <LuAudioLines className="w-9 h-9 animate-pulse text-primary" />) || (
          <div className="text-gray-600 dark:text-gray-300 text-sm mb-2 flex items-center">
            <FcAudioFile className="w-7 h-7" /> {bridgeId}
          </div>
        )}

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Seek Bar */}
        <div className="flex items-center space-x-3 w-full max-w-xs mt-4">
          <span className="text-xs dark:text-gray-300 text-gray-600 w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSeek}
            className="flex-grow appearance-none h-1 bg-gray-300 dark:bg-gray-600 rounded-lg accent-primary"
          />
          <span className="text-xs dark:text-gray-300 text-gray-600 w-10 text-left">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mt-6">
          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            {volume === 0 ? (
              <FiVolume className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : volume < 0.5 ? (
              <FiVolume1 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <FiVolume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 rounded-lg appearance-none bg-gray-300 dark:bg-gray-600 accent-primary"
            />
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="bg-primary text-white p-3 rounded-full hover:bg-transparent hover:text-primary flex justify-center items-center transition-all shadow-md"
          >
            {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6" />}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AudioPlayer;