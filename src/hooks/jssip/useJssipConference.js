// hooks/jssip/useJssipConference.js
import { useEffect, useContext } from 'react';
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
        } else {
          toast.warning('Conference call initiated but no bridge ID received');
        }
      } else if (
        data.message === 'error dialing conference call' ||
        data.message === 'error dialing conferance call' ||
        (data.message?.includes('error') && data.message?.includes('conference'))
      ) {
        setStatus('calling');
        toast.error(`Failed to create conference call: ${data.message || 'Unknown error'}`);

        setConferenceStatus(false);
        setCallConference(false);
        setConferenceNumber('');
      } else {
        setStatus('calling');
        toast.warning(`Unexpected response: ${data.message || 'Unknown response'}`);
      }
    } catch (error) {
      setStatus('calling');
      setConferenceStatus(false);
      setCallConference(false);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Unable to create conference call');
      } else if (error.name === 'SyntaxError') {
        toast.error('Server response error: Invalid data received');
      } else {
        toast.error(`Conference call failed: ${error.message || 'Unknown error'}`);
      }
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
        toast.error(`Failed to resume call: ${response.status}`);
      }
    } catch (error) {
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
        } else {
          toast.error(`Failed to resume call: ${response.status}`);
        }
      }
    } catch (error) {
      toast.error(`Error ${isHeld ? 'resuming' : 'holding'} call: ${error.message}`);
    }
  };

  const handleConferenceMessage = (message) => {
    if (message.includes('customer host channel connected')) {
      setHasParticipants(true);
    }

    if (
      message.includes('customer host channel diconnected') ||
      message.includes('customer host channel disconnected')
    ) {
      setCallConference(false);
      setConferenceNumber('');
      setConferenceStatus(false);
      reqUnHold?.();
      setHasParticipants(false);
    }

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
