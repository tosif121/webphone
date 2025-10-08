// hooks/jssip/useJssipUtils.js
import { useCallback, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';

export const useJssipUtils = (state) => {
  const { username, setSelectedBreak } = useContext(HistoryContext);
  const { ringtoneRef, inNotification, setInNotification } = state;

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.volume = 0.5;

      // Handle autoplay policy
      const playPromise = ringtoneRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Ringtone started playing');
          })
          .catch((error) => {
            console.error('Error playing ringtone:', error);
            // Try to play with user interaction
            if (error.name === 'NotAllowedError') {
              console.log('Autoplay prevented. User interaction required.');
            }
          });
      }
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  function notifyMe() {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      createNotification();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          createNotification();
        }
      });
    }
  }

  function createNotification() {
    const notifiOptions = {
      body: `Incoming call from ${inNotification}`,
      icon: '/badge.png',
      badge: '/badge.png',
      vibrate: [5000, 4000, 5000],
      tag: 'notification-tag',
      renotify: true,
      requireInteraction: true,
    };

    const notification = new Notification('Incoming Call', notifiOptions);

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };

    return notification;
  }

  const checkUserReady = async () => {
    try {
      const url = `${window.location.origin}/userready/${username}`;
      const response = await axios.post(url, {}, { headers: { 'Content-Type': 'application/json' } });
      return response.data;
    } catch (error) {
      console.error('Error sending login request:', error);
      return null;
    }
  };

  const removeBreak = async () => {
    try {
      await axios.post(`${window.location.origin}/user/removebreakuser:${username}`);
      setSelectedBreak('Break');
      localStorage.removeItem('selectedBreak');
      toast.success('Break removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing break:', error);
      toast.error('Error removing break');
      return false;
    }
  };

  const validatePhoneNumber = (number) => {
    if (!number) return false;
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 12;
  };

  const storeInLocalStorage = useCallback((key, value) => {
    try {
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
      });

      localStorage.setItem(`jssip_${key}`, serialized);

      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('jssip-sync');
        channel.postMessage({
          key: `jssip_${key}`,
          value,
          timestamp: Date.now(),
          source: 'useJssip',
        });
        channel.close();
      }
    } catch (error) {
      console.error(`Failed to store ${key} in localStorage:`, error);
    }
  }, []);

  const getFromLocalStorage = useCallback((key, defaultValue = null) => {
    try {
      const stored = localStorage.getItem(`jssip_${key}`);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      return parsed.data || defaultValue;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  }, []);

  useEffect(() => {
    if (inNotification != '') {
      notifyMe();
      setInNotification('');
    }
  }, [inNotification]);

  return {
    playRingtone,
    stopRingtone,
    notifyMe,
    createNotification,
    checkUserReady,
    removeBreak,
    validatePhoneNumber,
    storeInLocalStorage,
    getFromLocalStorage,
  };
};
