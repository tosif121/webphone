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
    messageDifference,
    setMessageDifference,
    setIsCustomerAnswered,
    isMerged,
    setIsMerged,
  } = state;

  const logMergeEvent = (eventType, details = {}) => {
    const mergeLog = {
      timestamp: new Date().toISOString(),
      eventType,
      username,
      conferenceNumber,
      bridgeID,
      hasParticipants,
      isHeld,
      status,
      ...details,
    };

    const existingLogs = JSON.parse(localStorage.getItem('mergeEventLogs') || '[]');
    existingLogs.push(mergeLog);

    if (existingLogs.length > 50) {
      existingLogs.shift();
    }

    localStorage.setItem('mergeEventLogs', JSON.stringify(existingLogs));
  };

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

          logMergeEvent('conference_created', {
            message: data.message,
            bridgeID: data.result,
          });

          toast.success('Conference call dialed');
        } else {
          toast.error('Conference call initiated but no bridge ID received');
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
        setHasParticipants(null);
        setIsCustomerAnswered(true);
        logMergeEvent('conference_failed', {
          error: data.message,
          reason: 'api_error',
        });
      } else {
        setStatus('calling');
        toast.error(`Unexpected response: ${data.message || 'Unknown response'}`);

        setConferenceStatus(false);
        setCallConference(false);
        setConferenceNumber('');
        setHasParticipants(null);
        setIsCustomerAnswered(true);
        logMergeEvent('conference_failed', {
          error: data.message,
          reason: 'unexpected_response',
        });
      }
    } catch (error) {
      setStatus('calling');

      setConferenceStatus(false);
      setCallConference(false);
      setHasParticipants(null);
      setIsCustomerAnswered(false);

      logMergeEvent('conference_failed', {
        error: error.message,
        reason: 'network_error',
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Unable to create conference call');
      } else if (error.name === 'SyntaxError') {
        toast.error('Server response error: Invalid data received');
      } else {
        toast.error(`Conference call failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const reqUnHold = async (triggerSource = 'unknown') => {
    try {
      logMergeEvent('unhold_requested', {
        triggerSource,
        wasHeld: isHeld,
      });

      const response = await fetch(`${window.location.origin}/reqUnHold/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        if (audioRef.current) {
          audioRef.current.play();
        }
        setIsHeld(false);
        setConferenceStatus(false);

        logMergeEvent('unhold_success', {
          triggerSource,
          previouslyHeld: isHeld,
        });
      } else {
        toast.error(`Failed to resume call: ${response.status}`);

        logMergeEvent('unhold_failed', {
          triggerSource,
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      toast.error(`Error resuming call: ${error.message}`);

      logMergeEvent('unhold_failed', {
        triggerSource,
        error: error.message,
      });
    }
  };

  const toggleHold = async () => {
    try {
      if (!isHeld) {
        const response = await fetch(`${window.location.origin}/reqHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsHeld(true);
          toast.success('Call placed on hold');

          logMergeEvent('hold_applied', {
            triggerSource: 'manual_toggle',
          });
        } else {
          toast.error(`Failed to hold call: ${response.status}`);
        }
      } else {
        const response = await fetch(`${window.location.origin}/reqUnHold/${username}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          if (audioRef.current) {
            audioRef.current.play();
          }
          setIsHeld(false);

          logMergeEvent('unhold_success', {
            triggerSource: 'manual_toggle',
          });
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
      setHasParticipants('connected');

      logMergeEvent('participant_connected', {
        message,
        participantCount: conferenceCalls?.length || 0,
      });
    }

    if (
      message.includes('customer host channel diconnected') ||
      message.includes('customer host channel disconnected')
    ) {
      setCallConference(false);
      setConferenceNumber('');
      setConferenceStatus(false);
      setHasParticipants('disconnected');
      setIsCustomerAnswered(true);
      setIsMerged(false);

      logMergeEvent('participant_disconnected', {
        message,
        autoMergeTriggered: true,
        reason: 'conference_message',
      });

      // reqUnHold will be called automatically by useEffect below
      toast.error('Conference disconnected');
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

  // ✅ Reset to null when call ends
  useEffect(() => {
    if (status === 'start') {
      setHasParticipants(null);
      setIsCustomerAnswered(false);
    }
  }, [status]);

  // ✅ NEW: Auto reqUnHold when participant disconnects
  useEffect(() => {
    if (hasParticipants === 'Conference disconnected') {
      setCallConference(false);
      setConferenceNumber('');
      setConferenceStatus(false);
      setHasParticipants(null);
      setIsCustomerAnswered(true);
      setIsMerged(false);
      reqUnHold('auto_unhold_on_disconnect');
    }
  }, [hasParticipants]);

  //   useEffect(() => {
  //   if (conferenceCalls && conferenceCalls.length > 0 && status === 'conference') {
  //     if (!hasParticipants) {
  //       setHasParticipants(true);
  //     }
  //   } else {
  //     if (hasParticipants) {
  //       setCallConference(false);
  //       setConferenceNumber('');
  //       setConferenceStatus(false);
  //       setHasParticipants(false);

  //       logMergeEvent('conference_ended', {
  //         autoMergeTriggered: true,
  //         reason: 'participants_left',
  //         conferenceCallsLength: conferenceCalls?.length || 0,
  //       });

  //       // Call reqUnHold with tracking
  //       reqUnHold('participants_left');
  //     }
  //   }
  // }, [conferenceCalls, hasParticipants]);

  return {
    createConferenceCall,
    reqUnHold,
    toggleHold,
    handleConferenceMessage,
  };
};
