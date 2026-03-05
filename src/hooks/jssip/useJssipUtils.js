// hooks/jssip/useJssipUtils.js
import { useCallback, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';

export const useJssipUtils = (state) => {
  const { username, setSelectedBreak } = useContext(HistoryContext);
  const { ringtoneRef, inNotification, setInNotification } = state;

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.volume = 0.5;

      // Handle autoplay policy
      const playPromise = ringtoneRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Ringtone started playing successfully
          })
          .catch((error) => {
            console.error('Error playing ringtone:', error);
            // Try to play with user interaction
            if (error.name === 'NotAllowedError') {
              // Autoplay prevented. User interaction required.
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
    } else {
      toast.error('Notification permission denied');
    }
  }

  // Check if user is away from the website
  function isUserAway() {
    // Check if document is hidden (minimized, different tab, etc.)
    if (document.hidden) {
      return true;
    }

    // Check if window is not focused
    if (!document.hasFocus()) {
      return true;
    }

    // Check visibility state
    if (document.visibilityState === 'hidden') {
      return true;
    }

    return false;
  }

  // Enhanced notification function that checks user presence
  function notifyMeIfAway() {
    // Ensure inNotification is a string for checking
    const notificationValue = Array.isArray(inNotification) ? inNotification.join(', ') : String(inNotification || '');

    // Check if this is a forced test notification
    const isForceTest = notificationValue.startsWith('FORCE_TEST:') || notificationValue.startsWith('Test:');
    if (isForceTest) {
      notifyMe();
      return true;
    }

    // Always show notification if user is away from website
    if (isUserAway()) {
      notifyMe();
      return true;
    }

    // For mobile devices, always show notification regardless of focus
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileDevice) {
      notifyMe();
      return true;
    }

    return false;
  }

  function createNotification() {
    // Ensure inNotification is a string and clean it for display
    const notificationValue = Array.isArray(inNotification) ? inNotification.join(', ') : String(inNotification || '');

    const displayNumber = notificationValue.replace('FORCE_TEST:', '').replace('Away Test: ', '').replace('Test:', '');

    let notificationShown = false;

    // Set a timeout to ensure we always show a notification
    const fallbackTimeout = setTimeout(() => {
      if (!notificationShown) {
        createRegularNotification(displayNumber);
        notificationShown = true;
      }
    }, 2000); // 2 second timeout

    // Try to use Service Worker notification first
    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (notificationShown) return; // Don't show if fallback already triggered

          return registration.showNotification('Incoming Call', {
            body: `Incoming call from ${displayNumber}`,
            icon: '/badge.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200],
            tag: 'incoming-call',
            renotify: true,
            requireInteraction: true,
            silent: false, // Use system notification sound
          });
        })
        .then(() => {
          clearTimeout(fallbackTimeout);
          notificationShown = true;
        })
        .catch((error) => {
          console.error('Service Worker notification failed:', error);
          if (!notificationShown) {
            createRegularNotification(displayNumber);
            notificationShown = true;
          }
          clearTimeout(fallbackTimeout);
        });
    } else {
      clearTimeout(fallbackTimeout);
      createRegularNotification(displayNumber);
      notificationShown = true;
    }
  }

  function createRegularNotification(displayNumber) {
    const notifiOptions = {
      body: `Incoming call from ${displayNumber}`,
      icon: '/badge.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      tag: 'incoming-call',
      renotify: true,
      requireInteraction: true,
      silent: false, // Use system notification sound
    };

    try {
      const notification = new Notification('Incoming Call', notifiOptions);

      notification.onclick = function (event) {
        event.preventDefault();
        window.focus();
        notification.close();

        // Try to bring the window to front
        if (window.parent) {
          window.parent.focus();
        }
      };

      notification.onerror = function (event) {
        console.error('Notification error:', event);
      };

      return notification;
    } catch (error) {
      console.error('Error creating regular notification:', error);
      toast.error('Failed to create notification: ' + error.message);
    }
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
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('breakStartTime_')) {
          localStorage.removeItem(key);
        }
      });
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
    // Check if inNotification has a value (string, array, or other truthy value)
    if (inNotification && inNotification !== '') {
      // Use the enhanced notification function
      notifyMeIfAway();
      setInNotification('');
    }
  }, [inNotification]);

  // Simple test function for notifications (can be called from console)
  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const testNotif = new Notification('Test Notification', {
            body: 'This should play system notification sound',
            icon: '/badge.png',
            tag: 'test-notification',
            requireInteraction: true,
            silent: false, // Use system notification sound
            vibrate: [200, 100, 200],
          });

          testNotif.onclick = () => {
            window.focus();
            testNotif.close();
          };

          setTimeout(() => {
            testNotif.close();
          }, 5000);
        } catch (error) {
          console.error('Error creating test notification:', error);
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            testNotification(); // Retry after permission granted
          }
        });
      } else {
        console.error('Notification permission denied');
      }
    } else {
      console.error('Notifications not supported');
    }
  };

  return {
    playRingtone,
    stopRingtone,
    notifyMe,
    notifyMeIfAway,
    createNotification,
    createRegularNotification,
    isUserAway,
    testNotification,
    checkUserReady,
    removeBreak,
    validatePhoneNumber,
    storeInLocalStorage,
    getFromLocalStorage,
  };
};
