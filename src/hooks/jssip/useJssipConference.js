// hooks/jssip/useJssipConference.js
import { useEffect, useContext } from 'react';
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
      if (data.message === 'conferance call dialed') {
        if (data.result) {
          setBridgeID(data.result);
          setConferenceStatus(true);
          setStatus('conference');
        }
      } else if (data.message === 'error dialing conference call') {
        console.error('Conference call dialing failed');
        setStatus('calling');
      } else {
        console.log('Unexpected response:', data.message);
      }
    } catch (error) {
      console.error('Error creating conference call:', error);
      setStatus('calling');
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
      } else {
        console.error('Failed to unhold call');
      }
    } catch (error) {
      console.error('Error unholding call:', error);
    }
  };

  const toggleHold = async () => {
    if (!session) return;

    try {
      if (!isHeld) {
        await fetch(`${window.location.origin}/reqHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: session.bridgeID,
          }),
        });

        if (audioRef.current) {
          audioRef.current.pause();
        }

        setIsHeld(true);
      } else {
        await fetch(`${window.location.origin}/reqUnHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: session.bridgeID,
          }),
        });

        if (audioRef.current) {
          audioRef.current.play();
        }

        setIsHeld(false);
      }
    } catch (error) {
      console.error('Error toggling hold:', error);
    }
  };

  const handleConferenceMessage = (message) => {
    console.log('Conference message received:', message);

    if (message.includes('customer host channel connected')) {
      console.log('🟢 Participant connected');
      setHasParticipants(true);
    }

    if (message.includes('customer host channel diconnected')) {
      console.log('🔴 Participant disconnected');
      setHasParticipants(false);
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

  useEffect(() => {
    if (conferenceCalls && conferenceCalls.length > 0 && (status === 'conference' || status === 'ringing')) {
      if (!hasParticipants) {
        setHasParticipants(true);
      }
    } else {
      if (hasParticipants) {
        setCallConference(false);
        setConferenceNumber('');
        setConferenceStatus(false);
        reqUnHold?.();
        setHasParticipants(false);
      }
    }
  }, [conferenceCalls, hasParticipants]);

  return {
    createConferenceCall,
    reqUnHold,
    toggleHold,
    handleConferenceMessage,
  };
};
