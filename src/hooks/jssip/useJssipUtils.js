// hooks/jssip/useJssipUtils.js
import { useCallback, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';
import { withWebphoneBasePath } from '../../lib/basePath';

export const useJssipUtils = (state) => {
  const { username, setSelectedBreak } = useContext(HistoryContext);
  const { ringtoneRef, inNotification, setInNotification } = state;

  // Dedupe ring notifications per caller so a single call never triggers
  // repeated vibrations/notifications (e.g. from the 5s connection poll or the
  // FCM + SIP double path). Keyed by the caller's last 10 digits so +91/91/
  // plain 10-digit variants of the same number collapse to one key.
  const lastRingNotificationRef = useRef({ key: '', ts: 0 });
  const RING_NOTIFICATION_DEDUP_MS = 45000;

  const normalizeCallerKey = (value) =>
    String(value || '')
      .replace(/\D/g, '')
      .slice(-10);

  const shouldFireRingNotification = (value) => {
    const key = normalizeCallerKey(value);
    if (!key) return false;
    const now = Date.now();
    const last = lastRingNotificationRef.current;
    if (last.key === key && now - last.ts < RING_NOTIFICATION_DEDUP_MS) {
      return false;
    }
    lastRingNotificationRef.current = { key, ts: now };
    return true;
  };

  const getAuthHeaders = useCallback((extraHeaders = {}) => {
    try {
      const tokenPayload = JSON.parse(localStorage.getItem('token') || 'null');
      return tokenPayload?.token
        ? {
            Authorization: `Bearer ${tokenPayload.token}`,
            ...extraHeaders,
          }
        : extraHeaders;
    } catch (error) {
      console.error('Failed to build auth headers:', error);
      return extraHeaders;
    }
  }, []);

  // Register service worker for reliable background notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(withWebphoneBasePath('/sw.js')).catch((err) => {
        console.error('SW registration failed:', err);
      });

      const handleSWMessage = (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICKED') {
          window.dispatchEvent(new CustomEvent('incomingCallNotificationClicked', { detail: event.data }));
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (_) {}
    }
  }, []);

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      // If ringtone is ALREADY playing, don't interrupt and restart from 0
      if (!ringtoneRef.current.paused && ringtoneRef.current.currentTime > 0) {
        return;
      }
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
      try {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      } catch (_) {}
    }

    if (typeof document !== 'undefined') {
      try {
        const audioElements = document.getElementsByTagName('audio');
        for (let i = 0; i < audioElements.length; i += 1) {
          const audio = audioElements[i];
          if (audio && (audio.src?.includes('ringtone') || !audio.paused)) {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      } catch (_) {}
    }

    // Allow the next call to ring/notify again (dedupe only applies while ringing).
    lastRingNotificationRef.current = { key: '', ts: 0 };
    if (typeof window !== 'undefined') {
      window.pendingIncomingCall = null;
      if (window.FlutterFCMBridge) {
        try {
          window.FlutterFCMBridge.postMessage(JSON.stringify({ action: 'stopRingtone' }));
          window.FlutterFCMBridge.postMessage(JSON.stringify({ action: 'clearNotification' }));
          window.FlutterFCMBridge.postMessage(JSON.stringify({ action: 'clearPendingCall' }));
        } catch (_) {}
      }
    }
  };

  function notifyMe() {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }

    if (!('Notification' in window)) {
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

    // Never re-notify for the same caller while it's still ringing (blocks the
    // repeated 5s poll notifications and the FCM + SIP double path).
    if (!shouldFireRingNotification(notificationValue)) {
      return false;
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

  const showNotificationDirect = useCallback((number) => {
    // Skip if we already notified for this caller within the dedupe window.
    if (!shouldFireRingNotification(number)) return;

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 500]);
      } catch (_) {}
    }

    const showViaSW = () => {
      if (!('serviceWorker' in navigator) || typeof window === 'undefined' || typeof Notification === 'undefined')
        return false;
      if (Notification.permission !== 'granted') return false;

      navigator.serviceWorker.ready
        .then((registration) => {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            return registration
              .showNotification('Incoming Call', {
                body: `Incoming call from ${number}`,
                icon: withWebphoneBasePath('/badge.png'),
                badge: withWebphoneBasePath('/badge.png'),
                vibrate: [200, 100, 200],
                tag: 'incoming-call',
                renotify: true,
                requireInteraction: true,
                silent: false,
                data: { number },
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
      return true;
    };

    const createFallbackNotification = (num) => {
      if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        createRegularNotification(num);
      } else if (Notification.permission !== 'denied') {
        try {
          Notification.requestPermission()
            .then((permission) => {
              if (permission === 'granted') {
                createRegularNotification(num);
              }
            })
            .catch(() => {});
        } catch (_) {}
      }
    };

    if (!showViaSW()) {
      createFallbackNotification(number);
    }
  }, []);

  function createNotification() {
    const notificationValue = Array.isArray(inNotification) ? inNotification.join(', ') : String(inNotification || '');
    const displayNumber = notificationValue.replace('FORCE_TEST:', '').replace('Away Test: ', '').replace('Test:', '');
    showNotificationDirect(displayNumber);
  }

  function createRegularNotification(displayNumber) {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || Notification.permission !== 'granted')
      return;

    const notifiOptions = {
      body: `Incoming call from ${displayNumber}`,
      icon: withWebphoneBasePath('/badge.png'),
      badge: withWebphoneBasePath('/badge.png'),
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

        if (window.parent) {
          window.parent.focus();
        }

        notification.close();
        window.dispatchEvent(new CustomEvent('incomingCallNotificationClicked'));
      };

      notification.onerror = function (event) {
        console.error('Notification error:', event);
      };

      return notification;
    } catch (error) {
      console.error('Error creating regular notification:', error);
    }
  }

  const checkUserReady = useCallback(async () => {
    if (!username) {
      return {
        success: false,
        message: 'Missing username for userready sync.',
        status: null,
      };
    }

    try {
      const url = `${window.location.origin}/userready/${username}/Web`;
      const response = await axios.post(url, {}, { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) });
      const payload = response?.data || {};
      const success = response.status === 200 && payload.message === 'success';

      return {
        success,
        status: response.status,
        payload,
        message: payload.message || (success ? 'success' : 'Userready sync failed.'),
      };
    } catch (error) {
      console.error('Error sending login request:', error);
      return {
        success: false,
        status: error?.response?.status || null,
        payload: error?.response?.data || null,
        message: error?.response?.data?.message || error.message || 'Userready sync failed.',
      };
    }
  }, [getAuthHeaders, username]);

  const removeBreak = async () => {
    try {
      await axios.post(`${window.location.origin}/user/removebreakuser:${username}`, {}, { headers: getAuthHeaders() });
      setSelectedBreak('Break');
      localStorage.removeItem('selectedBreak');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('breakStartTime_')) {
          localStorage.removeItem(key);
        }
      });
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
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try {
          const testNotif = new Notification('Test Notification', {
            body: 'This should play system notification sound',
            icon: withWebphoneBasePath('/badge.png'),
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
        try {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              testNotification(); // Retry after permission granted
            }
          });
        } catch (_) {}
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
    showNotificationDirect,
    isUserAway,
    testNotification,
    checkUserReady,
    removeBreak,
    validatePhoneNumber,
    storeInLocalStorage,
    getFromLocalStorage,
  };
};
