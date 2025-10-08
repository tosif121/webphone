// hooks/jssip/useJssipConference.js
import { useEffect, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import HistoryContext from '../../context/HistoryContext';

export const useJssipConference = (state, utils) => {
  const { username } = useContext(HistoryContext);
  const {
    conferenceNumber,
    setConferenceNumber,
    bridgeID,
    setBridgeID,
    conferenceStatus,
    setConferenceStatus,
    status,
    setStatus,
    isHeld,
    setIsHeld,
    session,
    audioRef,
    conferenceCalls,
    hasParticipants,
    setHasParticipants,
    callConference,
    setCallConference,
    isCallended,
    setIsCallended,
    messageDifference,
    setMessageDifference,
  } = state;

  // ✅ Add ref to prevent infinite loops
  const conferenceEndTimeoutRef = useRef(null);
  const lastConferenceStateRef = useRef({
    hasParticipants: false,
    conferenceStatus: false,
    conferenceCalls: 0,
  });

  const createConferenceCall = async () => {
    try {
      const response = await fetch(`${window.location.origin}/reqConf/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confNumber: conferenceNumber.replace(/\s+/g, ''),
        }),
      });

      const data = await response.json();

      if (data.message === 'conferance call dialed' || data.message === 'conference call dialed') {
        if (data.result) {
          setBridgeID(data.result);
          setConferenceStatus(true);
          setStatus('conference');
          toast.success('Conference call initiated successfully');
        } else {
          console.warn('Conference call response without result:', data);
          toast.warning('Conference call initiated but no bridge ID received');
        }
      } else if (
        data.message === 'error dialing conference call' ||
        data.message === 'error dialing conferance call' ||
        (data.message?.includes('error') && data.message?.includes('conference'))
      ) {
        console.error('Conference call dialing failed:', data);
        setStatus('calling');
        toast.error(`Failed to create conference call: ${data.message || 'Unknown error'}`);

        // Reset conference states on error
        resetConferenceStates();
      } else {
        console.log('Unexpected conference response:', data);
        setStatus('calling');
        toast.warning(`Unexpected response: ${data.message || 'Unknown response'}`);
      }
    } catch (error) {
      console.error('Error creating conference call:', error);
      setStatus('calling');
      resetConferenceStates();

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Unable to create conference call');
      } else if (error.name === 'SyntaxError') {
        toast.error('Server response error: Invalid data received');
      } else {
        toast.error(`Conference call failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // ✅ Centralized function to reset all conference states
  const resetConferenceStates = () => {
    console.log('🔄 Resetting all conference states');
    setCallConference(false);
    setConferenceNumber('');
    setConferenceStatus(false);
    setHasParticipants(false);

    // Clear any pending timeouts
    if (conferenceEndTimeoutRef.current) {
      clearTimeout(conferenceEndTimeoutRef.current);
      conferenceEndTimeoutRef.current = null;
    }
  };

  // ✅ Enhanced function to end conference gracefully
  const endConference = async () => {
    console.log('📞 Conference ended - resetting all states');

    try {
      // Unhold the main call if it was held
      if (session && isHeld) {
        console.log('🔓 Unholding main call...');
        await reqUnHold();
      }

      // Reset all conference-related states
      resetConferenceStates();

      // Return to main call state
      if (status === 'conference' || status === 'ringing') {
        setStatus('calling');
      }
    } catch (error) {
      console.error('Error ending conference:', error);
      // Still reset states even if unhold fails
      resetConferenceStates();
      setStatus('calling');
      toast.warning('Conference ended (with some errors)');
    }
  };

  const reqUnHold = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${window.location.origin}/reqUnHold/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bridgeID: session.bridgeID,
        }),
      });

      if (response.ok) {
        if (audioRef.current) {
          audioRef.current.play();
        }
        setIsHeld(false);
        setConferenceStatus(false);
        toast.success('Call resumed successfully');
      } else {
        console.error('Failed to unhold call:', response.status);
        toast.error(`Failed to resume call: ${response.status}`);
      }
    } catch (error) {
      console.error('Error unholding call:', error);
      toast.error(`Error resuming call: ${error.message}`);
    }
  };

  const toggleHold = async () => {
    if (!session) return;

    try {
      if (!isHeld) {
        const response = await fetch(`${window.location.origin}/reqHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: session.bridgeID,
          }),
        });

        if (response.ok) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsHeld(true);
          toast.success('Call placed on hold');
        } else {
          console.error('Failed to hold call:', response.status);
          toast.error(`Failed to hold call: ${response.status}`);
        }
      } else {
        const response = await fetch(`${window.location.origin}/reqUnHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: session.bridgeID,
          }),
        });

        if (response.ok) {
          if (audioRef.current) {
            audioRef.current.play();
          }
          setIsHeld(false);
          toast.success('Call resumed');
        } else {
          console.error('Failed to unhold call:', response.status);
          toast.error(`Failed to resume call: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error toggling hold:', error);
      toast.error(`Error ${isHeld ? 'resuming' : 'holding'} call: ${error.message}`);
    }
  };

  const handleConferenceMessage = (message) => {
    console.log('Conference message received:', message);

    if (message.includes('customer host channel connected')) {
      console.log('🟢 Participant connected');
      setHasParticipants(true);
      toast.success('Conference participant joined');

      // Clear any pending end timeout when participant joins
      if (conferenceEndTimeoutRef.current) {
        clearTimeout(conferenceEndTimeoutRef.current);
        conferenceEndTimeoutRef.current = null;
      }
    }

    if (message.includes('customer host channel diconnected')) {
      console.log('🔴 Participant disconnected');

      // Don't immediately set to false, wait a bit to see if it's the last participant
      setTimeout(() => {
        // Check if this was the last participant
        if (conferenceCalls && conferenceCalls.length === 0) {
          setHasParticipants(false);

          // Set a timeout to end conference if no new participants join
          conferenceEndTimeoutRef.current = setTimeout(() => {
            endConference();
          }, 3000); // 3 second grace period
        } else {
          console.log('Conference participant left');
        }
      }, 1000); // 1 second delay to check updated state
    }

    // Update message difference tracking
    const objectToPush = {
      messageTime: Date.now(),
      messageType: 'conference',
      message: message,
    };

    setMessageDifference((prev) => {
      const updatedDifferences = [...prev, objectToPush];
      if (updatedDifferences.length > 10) {
        updatedDifferences.shift();
      }
      return updatedDifferences;
    });
  };

  // ✅ Original useEffect - but improved to avoid conflicts
  useEffect(() => {
    if (conferenceCalls && conferenceCalls.length > 0 && (status === 'conference' || status === 'ringing')) {
      if (!hasParticipants) {
        setHasParticipants(true);
      }
    } else {
      // Only trigger reset if we actually had participants before
      if (hasParticipants && conferenceCalls && conferenceCalls.length === 0) {
        console.log('🔚 Conference calls array empty - ending conference');

        // Use timeout to avoid immediate state conflicts
        conferenceEndTimeoutRef.current = setTimeout(() => {
          endConference();
        }, 2000); // 2 second delay
      }
    }
  }, [conferenceCalls, status]);

  // ✅ IMPROVED: Smart conference ending logic (replaces your infinite loop useEffect)
  useEffect(() => {
    const currentState = {
      hasParticipants,
      conferenceStatus,
      conferenceCalls: conferenceCalls?.length || 0,
    };

    // Only act if state actually changed
    const stateChanged =
      currentState.hasParticipants !== lastConferenceStateRef.current.hasParticipants ||
      currentState.conferenceStatus !== lastConferenceStateRef.current.conferenceStatus ||
      currentState.conferenceCalls !== lastConferenceStateRef.current.conferenceCalls;

    if (stateChanged) {
      lastConferenceStateRef.current = currentState;

      // End conference if: no participants AND (no conference status OR no conference calls)
      if (
        !hasParticipants &&
        (!conferenceStatus || (conferenceCalls && conferenceCalls.length === 0)) &&
        (status === 'conference' || callConference)
      ) {
        console.log('📞 Conference ended - resetting all states');

        // Use timeout to prevent infinite loops
        if (conferenceEndTimeoutRef.current) {
          clearTimeout(conferenceEndTimeoutRef.current);
        }

        conferenceEndTimeoutRef.current = setTimeout(() => {
          endConference();
        }, 1500); // 1.5 second delay
      }
    }
  }, [hasParticipants, conferenceStatus, conferenceCalls?.length, status, callConference]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conferenceEndTimeoutRef.current) {
        clearTimeout(conferenceEndTimeoutRef.current);
      }
    };
  }, []);

  return {
    createConferenceCall,
    reqUnHold,
    toggleHold,
    handleConferenceMessage,
  };
};
