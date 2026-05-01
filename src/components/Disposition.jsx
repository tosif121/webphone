import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BreakDropdown from './BreakDropdown';
import Callback from './Callback';
import UserCall from './UserCall';
import HistoryContext from '@/context/HistoryContext';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import axios from 'axios';
import DynamicForm from './DynamicForm';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import moment from 'moment';
import { useAuth } from '@/hooks/useAuth';
import { JssipContext } from '@/context/JssipContext';

const ACTIVE_CALLBACK_STORAGE_KEY = 'activeFollowUpCallback';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const Disposition = ({
  bridgeID,
  setDispositionModal,
  phoneNumber,
  setPhoneNumber,
  fetchLeadsWithDateRange,
  callType,
  setCallType,
  formSubmitted,
  setFormSubmitted,
  campaignID,
  user,
  activeLead,
  leadLockToken,
  setActiveLead,
  setLeadLockToken,
  setAgentLifecycle,
}) => {
  const { username, selectedBreak } = useContext(HistoryContext);
  const {
    finalizePostCallContext,
    bridgeID: liveBridgeID,
    userCall: liveUserCall,
    activeCallContext,
    workspaceActiveCall,
    isSticky,
    setIsSticky,
    setUserCall,
  } = useContext(JssipContext);
  const { token, user: authUser } = useAuth();
  const [selectedAction, setSelectedAction] = useState(null);
  const [isAutoLeadDialDisabled, setIsAutoLeadDialDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCallOpen, setUserCallOpen] = useState(false);
  const [dispositionActions, setDispositionActions] = useState([]);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isAutoDispositionComplete, setIsAutoDispositionComplete] = useState(false);
  const [isAutoDispositionInProgress, setIsAutoDispositionInProgress] = useState(false);

  // Changed to store Date objects for the Callback component
  const [followUpDate, setFollowUpDate] = useState(undefined);
  const [followUpTime, setFollowUpTime] = useState(new Date());
  const [followUpDetails, setFollowUpDetails] = useState('');

  const [isDispositionModalOpen, setDispositionModalOpen] = useState(false);
  const [isCallbackDialogOpen, setCallbackDialogOpen] = useState(false);
  const [callbackIncomplete, setCallbackIncomplete] = useState(false);
  const makeSticky = isSticky;
  const setMakeSticky = setIsSticky;
  const campaignName = authUser?.campaignName || 'N/A';
  const stickyEnabled = authUser?.stickyEnabled !== false;
  const [stickyMode, setStickyMode] = useState('');
  const [savingStickyMode, setSavingStickyMode] = useState(false);

  const handleStickyModeChange = async (value) => {
    const isNone = value === 'disabled';
    setStickyMode(value);
    setMakeSticky(!isNone);

    const campaignId = campaignID || authUser?.campaign;
    if (!campaignId) {
      toast.error('No campaign found');
      return;
    }

    setSavingStickyMode(true);
    try {
      await axios.post(
        `${window.location.origin}/campaign/${campaignId}`,
        {
          stickyMode: isNone ? '' : value,
          stickyEnabled: !isNone,
        },
        { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) },
      );
      toast.success(isNone ? 'Sticky mode disabled' : `Sticky mode: ${value}`);
    } catch {
      toast.error('Failed to update sticky mode');
    } finally {
      setSavingStickyMode(false);
    }
  };

  // Initialization of isSticky moved to useJssip.js
  /* useEffect removed */
  const resolvedBridgeID = String(
    bridgeID ||
      liveBridgeID ||
      liveUserCall?.bridgeID ||
      workspaceActiveCall?.bridgeID ||
      activeCallContext?.bridgeID ||
      '',
  ).trim();

  const stickyTargetNumber = String(
    phoneNumber ||
      liveUserCall?.contactNumber ||
      liveUserCall?.number ||
      liveUserCall?.phone ||
      workspaceActiveCall?.contactNumber ||
      workspaceActiveCall?.Caller ||
      workspaceActiveCall?.dialNumber ||
      activeCallContext?.contactNumber ||
      activeCallContext?.Caller ||
      activeCallContext?.dialNumber ||
      activeLead?.number ||
      activeLead?.phone ||
      activeLead?.contactNumber ||
      '',
  ).trim();

  const getAuthHeaders = useCallback(
    (extraHeaders = {}) =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            ...extraHeaders,
          }
        : extraHeaders,
    [token],
  );

  const resetLeadLifecycle = useCallback(() => {
    setActiveLead?.(null);
    setLeadLockToken?.('');
    setAgentLifecycle?.('completed');
    setTimeout(() => {
      setAgentLifecycle?.('idle');
    }, 0);
  }, [setActiveLead, setAgentLifecycle, setLeadLockToken]);

  const closeDispositionFlow = useCallback(() => {
    finalizePostCallContext?.();
    setUserCall('');
    setFormSubmitted(false);
    setDispositionModal(false);
    setPhoneNumber('');
    setCallType('');
  }, [finalizePostCallContext, setUserCall, setCallType, setDispositionModal, setFormSubmitted, setPhoneNumber]);

  const completeActiveFollowUpCallback = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = localStorage.getItem(ACTIVE_CALLBACK_STORAGE_KEY);
    if (!storedValue) {
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue);
      const callbackId = parsedValue?.callbackId;
      const callbackPhone = String(parsedValue?.phoneNumber || '')
        .replace(/^\+91/, '')
        .trim();
      const currentPhone = String(stickyTargetNumber || '')
        .replace(/^\+91/, '')
        .trim();

      if (!callbackId || (callbackPhone && currentPhone && callbackPhone !== currentPhone)) {
        return;
      }

      await axios.post(
        `${window.location.origin}/callback/update-status`,
        {
          callbackId,
          status: 'completed',
        },
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        },
      );
      localStorage.removeItem(ACTIVE_CALLBACK_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('refreshFollowUps'));
    } catch (error) {
      console.warn('Unable to mark active follow-up callback as completed:', error);
    }
  }, [getAuthHeaders, stickyTargetNumber]);

  const resolveLeadFinalState = useCallback((action) => {
    const normalized = String(action || '')
      .trim()
      .toLowerCase();
    const failedStates = new Set([
      'busy',
      'not reachable',
      'not answered',
      'no answerr',
      'wrong number',
      'switched off',
      'not interested',
      'disconnected',
      'do not call',
      'voicemail left',
    ]);

    return failedStates.has(normalized) ? 'failed' : 'completed';
  }, []);

  const getStylesForAction = (action, isSelected) => {
    const actionStyles = {
      'Test Call': {
        variant: 'outline',
        className: isSelected
          ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900/30'
          : 'text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/10',
      },
      Answered: {
        variant: 'outline',
        className: isSelected
          ? 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700 dark:hover:bg-sky-900/30'
          : 'text-sky-700 border-sky-200 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-900/10',
      },
      Busy: {
        variant: 'outline',
        className: isSelected
          ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30'
          : 'text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/10',
      },
      'Not Reachable': {
        variant: 'outline',
        className: isSelected
          ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-900/30'
          : 'text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/10',
      },
      'No Answerr': {
        variant: 'outline',
        className: isSelected
          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/30'
          : 'text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/10',
      },
      'Voicemail Left': {
        variant: 'outline',
        className: isSelected
          ? 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/30'
          : 'text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/10',
      },
      'Switched Off': {
        variant: 'outline',
        className: isSelected
          ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-900/30'
          : 'text-orange-700 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/10',
      },
      'Wrong Number': {
        variant: 'outline',
        className: isSelected
          ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30'
          : 'text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/10',
      },
      'Do Not Call': {
        variant: 'outline',
        className: isSelected
          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700 dark:hover:bg-yellow-900/30'
          : 'text-yellow-700 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/10',
      },
      Disconnected: {
        variant: 'outline',
        className: isSelected
          ? 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800/30'
          : 'text-gray-700 border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800/10',
      },
      Interested: {
        variant: 'outline',
        className: isSelected
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/30'
          : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/10',
      },
      'Not Answered': {
        variant: 'outline',
        className: isSelected
          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/30'
          : 'text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/10',
      },
      Connected: {
        variant: 'outline',
        className: isSelected
          ? 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700 dark:hover:bg-sky-900/30'
          : 'text-sky-700 border-sky-200 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-900/10',
      },
      'Not Interested': {
        variant: 'outline',
        className: isSelected
          ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-900/30'
          : 'text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/10',
      },
    };

    if (/follow.?up|callback|call.?back/i.test(action)) {
      return {
        variant: 'outline',
        className: isSelected
          ? 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700 dark:hover:bg-teal-900/30'
          : 'text-teal-700 border-teal-200 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/10',
      };
    }

    return (
      actionStyles[action] || {
        variant: 'outline',
        className: isSelected
          ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800/30'
          : 'text-slate-700 border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800/10',
      }
    );
  };

  const autoDispoFunc = useCallback(async () => {
    try {
      const requestBody = {
        bridgeID,
        Disposition: 'Auto Disposed',
        autoDialDisabled: false,
        leadId: activeLead?.leadId,
        leadLockToken,
        leadFinalState: resolveLeadFinalState('Auto Disposed'),
        contactNumber: stickyTargetNumber,
        makeSticky,
        stickyMode: stickyMode === 'disabled' ? '' : stickyMode,
      };

      const response = await axios.post(`${window.location.origin}/user/disposition${username}`, requestBody, {
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });

      if (response.data.success) {
        await completeActiveFollowUpCallback();
        toast.success('Auto disposition completed successfully');

        // Set completion flag before calling other functions
        setIsAutoDispositionComplete(true);
        setIsAutoDispositionInProgress(false);

        // Move to next contact only once

        fetchLeadsWithDateRange();
        resetLeadLifecycle();

        closeDispositionFlow();
      } else {
        toast.error(response.data.message || 'Auto disposition failed');
        setIsAutoDispositionInProgress(false);

        // If auto disposition fails, show default options as fallback
        setDispositionActions([
          { action: 'Busy', label: 'B - Busy' },
          { action: 'Not Reachable', label: 'NR - Not Reachable' },
          { action: 'Switched Off', label: 'SW - Switched Off' },
          { action: 'Interested', label: 'INT - Interested' },
          { action: 'Not Answered', label: 'N - Not Answered' },
          { action: 'Test Call', label: 'TEST - Test Call' },
          { action: 'Connected', label: 'CO - Connected' },
          { action: 'Wrong Number', label: 'WN - Wrong Number' },
          { action: 'Not Interested', label: 'NI - Not Interested' },
        ]);
        setShouldShowModal(true);
      }
    } catch (error) {
      console.error('Auto disposition error:', error);
      setIsAutoDispositionInProgress(false);

      // Check if the error is a 400 status error
      if (error.response?.status === 400) {
        setIsAutoDispositionComplete(true);

        // Don't show modal for 400 errors - just close everything
        closeDispositionFlow();
        return;
      }

      toast.error('An error occurred during auto disposition');
      // For non-400 errors, show default options as fallback
      setDispositionActions([
        { action: 'Busy', label: 'B - Busy' },
        { action: 'Not Reachable', label: 'NR - Not Reachable' },
        { action: 'Switched Off', label: 'SW - Switched Off' },
        { action: 'Interested', label: 'INT - Interested' },
        { action: 'Not Answered', label: 'N - Not Answered' },
        { action: 'Test Call', label: 'TEST - Test Call' },
        { action: 'Connected', label: 'CO - Connected' },
        { action: 'Wrong Number', label: 'WN - Wrong Number' },
        { action: 'Not Interested', label: 'NI - Not Interested' },
      ]);
      setShouldShowModal(true);
    }
  }, [
    activeLead?.leadId,
    bridgeID,
    closeDispositionFlow,
    fetchLeadsWithDateRange,
    getAuthHeaders,
    leadLockToken,
    makeSticky,
    stickyTargetNumber,
    resetLeadLifecycle,
    resolveLeadFinalState,
    stickyMode,
    username,
    completeActiveFollowUpCallback,
  ]);

  useEffect(() => {
    if (isAutoDispositionComplete || isAutoDispositionInProgress) {
      return;
    }

    const dispositionFlag = authUser?.disposition;
    const dispoData = authUser?.dispostionOptions;

    if (dispositionFlag === false) {
      if (!formSubmitted) {
        return;
      }
      setIsAutoDispositionInProgress(true);
      autoDispoFunc();
      return;
    }

    if (dispoData?.length > 0) {
      if (!resolvedBridgeID) {
        toast.error('Call bridge not found. Disposition skipped.');
        closeDispositionFlow();
        return;
      }
      setDispositionActions(
        dispoData.map((item) => ({
          action: item.value,
          label: item.label,
        })),
      );
      setShouldShowModal(true);
      setIsAutoDispositionComplete(true);
    } else {
      setIsAutoDispositionInProgress(true);
      autoDispoFunc();
    }
  }, [
    authUser,
    autoDispoFunc,
    closeDispositionFlow,
    formSubmitted,
    isAutoDispositionComplete,
    isAutoDispositionInProgress,
    resolvedBridgeID,
  ]);

  const handleActionClick = useCallback((action, event) => {
    event.preventDefault();
    event.stopPropagation();

    setTimeout(() => {
      setSelectedAction((prevAction) => {
        const newAction = prevAction === action ? null : action;
        const isFollowUpAction = newAction && /follow.?up|callback|call.?back/i.test(newAction);
        setCallbackDialogOpen(isFollowUpAction);
        // Track if callback was opened
        if (isFollowUpAction) {
          setCallbackIncomplete(true);
        } else {
          setCallbackIncomplete(false);
        }
        return newAction;
      });
    }, 0);
  }, []);

  // Enhanced modal close handler with better validation
  const handleModalClose = useCallback(
    (open) => {
      if (!open) {
        // Allow closing if successfully submitted
        if (hasSubmittedSuccessfully) {
          closeDispositionFlow();
          return;
        }

        // Prevent closing if currently submitting
        if (isSubmitting) {
          toast.error('Please wait while submission is in progress');
          return;
        }

        // Prevent closing if callback was opened but not completed
        if (callbackIncomplete) {
          toast.error('Please complete the callback details or select another disposition');
          return;
        }

        // Prevent closing if no action is selected
        if (!selectedAction) {
          toast.error('Please select a disposition action before closing');
          return;
        }

        // If action is selected but not submitted, show warning
        toast.error('Please submit the disposition before closing');
        return;
      }
    },
    [callbackIncomplete, closeDispositionFlow, hasSubmittedSuccessfully, isSubmitting, selectedAction],
  );

  // Enhanced X button click handler
  const handleXButtonClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Allow closing if successfully submitted
      if (hasSubmittedSuccessfully) {
        closeDispositionFlow();
        return;
      }

      // Prevent closing if currently submitting
      if (isSubmitting) {
        toast.error('Please wait while submission is in progress');
        return;
      }

      // Prevent closing if callback was opened but not completed
      if (callbackIncomplete) {
        toast.error('Please complete the callback details or select another disposition');
        return;
      }

      // Prevent closing if no action is selected
      if (!selectedAction) {
        toast.error('Please select a disposition action before closing');
        return;
      }

      // If action is selected but not submitted, show warning
      toast.error('Please submit the disposition before closing');
    },
    [callbackIncomplete, closeDispositionFlow, hasSubmittedSuccessfully, isSubmitting, selectedAction],
  );

  // Prevent ESC key from closing modal
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        // Allow closing if successfully submitted
        if (hasSubmittedSuccessfully) {
          closeDispositionFlow();
          return;
        }

        // Show appropriate error message
        if (isSubmitting) {
          toast.error('Please wait while submission is in progress');
        } else if (callbackIncomplete) {
          toast.error('Please complete the callback details or select another disposition');
        } else if (!selectedAction) {
          toast.error('Please select a disposition action before closing');
        } else {
          toast.error('Please submit the disposition before closing');
        }
      }
    },
    [callbackIncomplete, closeDispositionFlow, hasSubmittedSuccessfully, isSubmitting, selectedAction],
  );

  // Add event listener for ESC key
  useEffect(() => {
    if (shouldShowModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, shouldShowModal]);

  const submitForm = useCallback(
    async (callbackData = null, isDispoWithBreak = false) => {
      if (!selectedAction) {
        toast.error('Please select a disposition action');
        return;
      }

      if (isSubmitting || hasSubmittedSuccessfully) {
        return;
      }

      setIsSubmitting(true);

      try {
        if (!resolvedBridgeID) {
          toast.error('Call bridge not found. Please retry once or refresh the webphone.');
          setIsSubmitting(false);
          closeDispositionFlow();
          return;
        }

        const requestBody = {
          bridgeID: resolvedBridgeID,
          Disposition: selectedAction,
          isDiposedWithBreak: isDispoWithBreak,
          autoDialDisabled: isAutoLeadDialDisabled,
          leadId: activeLead?.leadId,
          leadLockToken,
          leadFinalState: resolveLeadFinalState(selectedAction),
          contactNumber: stickyTargetNumber,
          makeSticky,
          stickyMode: stickyMode === 'disabled' ? '' : stickyMode,
        };

        // Handle callback data
        if (selectedAction && /follow.?up|callback|call.?back/i.test(selectedAction)) {
          if (callbackData) {
            requestBody.followUpDisposition = {
              date: callbackData.date,
              time: callbackData.time,
              comment: callbackData.details,
              user: user,
              campaignID: campaignID,
              phoneNumber: stickyTargetNumber,
            };
          } else {
            requestBody.followUpDisposition = {
              date: formatDate(followUpDate),
              time: formatTime(followUpTime),
              comment: followUpDetails,
              user: user,
              campaignID: campaignID,
              phoneNumber: stickyTargetNumber,
            };
          }
        }

        // 1. Submit disposition FIRST
        const response = await axios.post(`${window.location.origin}/user/disposition${username}`, requestBody, {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        });

        if (response.data.success) {
          await completeActiveFollowUpCallback();
          // 2. AFTER successful disposition, check if break is selected
          const selectedBreakType = localStorage.getItem('selectedBreak');

          if (selectedBreakType && selectedBreakType !== 'Break') {
            try {
              // Apply the break after disposition
              await axios.post(
                `${window.location.origin}/user/breakuser:${username}`,
                {
                  breakType: selectedBreakType,
                },
                {
                  headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                },
              );
              toast.success('Disposition submitted and break applied successfully');
            } catch (breakError) {
              console.error('Break application failed:', breakError);
              toast.success('Disposition submitted successfully, but break application failed');
            }
          } else {
            toast.success('Disposition submitted successfully');
          }

          setHasSubmittedSuccessfully(true);
          fetchLeadsWithDateRange();
          resetLeadLifecycle();
          closeDispositionFlow();
        } else {
          toast.error(response.data.message || 'Submission failed');
        }
      } catch (error) {
        if (error.response?.status === 400) {
          toast.error('Bad request: Please check your input and try again');
        } else {
          toast.error(error.response?.data?.message || 'An unexpected error occurred');
        }
        console.error('Disposition error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedAction,
      resolvedBridgeID,
      username,
      isAutoLeadDialDisabled,
      followUpDate,
      followUpTime,
      followUpDetails,
      stickyTargetNumber,
      isSubmitting,
      hasSubmittedSuccessfully,
      closeDispositionFlow,
      fetchLeadsWithDateRange,
      activeLead?.leadId,
      getAuthHeaders,
      leadLockToken,
      makeSticky,
      resetLeadLifecycle,
      resolveLeadFinalState,
      stickyMode,
      completeActiveFollowUpCallback,
    ],
  );

  const handleCallbackSubmit = useCallback(
    (callbackData) => {
      let date, time, details;
      if (selectedAction && /follow.?up|callback|call.?back/i.test(selectedAction)) {
        if (callbackData) {
          date = callbackData.date;
          time = callbackData.time;
          details = callbackData.details;
          if (!date || !time || !details) {
            toast.error('Please provide follow-up date, time, and details.');
            return;
          }
        } else {
          date = formatDate(followUpDate);
          time = formatTime(followUpTime);
          details = followUpDetails;
          if (!date || !time || !details) {
            toast.error('Please complete the callback details first.');
            return;
          }
          callbackData = { date, time, details };
        }

        // Combine date and time into a single moment object for validation
        const dateTimeStr = `${date} ${time}`;
        const scheduledMoment = moment(dateTimeStr, 'YYYY-MM-DD hh:mm A');
        if (!scheduledMoment.isValid()) {
          toast.error('Invalid date or time format.');
          return;
        }
        if (scheduledMoment.isBefore(moment())) {
          toast.error('Follow-up date and time cannot be in the past.');
          return;
        }
      }

      setCallbackIncomplete(false);
      setCallbackDialogOpen(false);
      submitForm(callbackData);
    },
    [selectedAction, followUpDate, followUpTime, followUpDetails, submitForm],
  );

  // Don't render anything if modal shouldn't be shown
  if (!shouldShowModal) {
    return null;
  }

  return (
    <>
      <Callback
        {...{
          followUpDate,
          setFollowUpDate,
          followUpTime,
          setFollowUpTime,
          followUpDetails,
          setFollowUpDetails,
          isCallbackDialogOpen,
          setCallbackDialogOpen,
          submitForm: handleCallbackSubmit,
          onClose: () => setCallbackIncomplete(false),
        }}
      />

      <Dialog
        open={true}
        onOpenChange={handleModalClose}
        // Prevent closing on outside click
        modal={true}
      >
        <DialogContent
          className="sm:max-w-2xl [&>button]:hidden w-full p-0 border-none bg-transparent shadow-none flex items-center justify-center"
          // Prevent closing on outside click
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-md w-full">
            {/* Custom close button with validation */}
            <button
              onClick={handleXButtonClick}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            <div className="p-6 space-y-6 overflow-auto">
              <div className="space-y-1 pr-8">
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  Select Disposition
                  {makeSticky && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 transition-all">Sticky</Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Choose the appropriate outcome for this call</p>
              </div>
              <div className="flex flex-row gap-2 sm:gap-4 items-start justify-start overflow-x-auto">
                {/* Call Type */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 sm:px-4 py-2 sm:py-3 md:w-full w-max">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Type</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-100 whitespace-nowrap">
                      {callType === 'outgoing' ? 'Outgoing' : 'Incoming'}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 sm:px-4 py-2 sm:py-3 md:w-full w-max">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Number</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-100 whitespace-nowrap">
                      {stickyTargetNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Campaign */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 sm:px-4 py-2 sm:py-3 md:w-full w-max">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Campaign</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-100 capitalize whitespace-nowrap">
                      {campaignName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dispositionActions.map((item) => {
                  const isSelected = selectedAction === item.action;
                  const styles = getStylesForAction(item.action, isSelected);
                  return (
                    <Button
                      key={`${item.action}-${item.label}`}
                      variant={styles.variant}
                      className={`h-auto py-3 px-4 whitespace-normal text-xs sm:text-sm font-medium transition-all duration-200 ${styles.className}`}
                      onClick={(event) => handleActionClick(item.action, event)}
                      disabled={isSubmitting || hasSubmittedSuccessfully}
                      type="button"
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>
              {stickyTargetNumber ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                  <div className="space-y-1">
                    <Label htmlFor="sticky-customer" className="text-sm font-medium text-foreground">
                      Make this customer sticky
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Route this contact back to the same agent when possible.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="sticky-customer"
                      checked={makeSticky}
                      onCheckedChange={(checked) => setMakeSticky(checked)}
                      disabled={isSubmitting || hasSubmittedSuccessfully}
                    />
                    <Select
                      value={stickyMode}
                      onValueChange={handleStickyModeChange}
                      disabled={isSubmitting || hasSubmittedSuccessfully || savingStickyMode}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loose">Loose</SelectItem>
                        <SelectItem value="strict">Strict</SelectItem>
                        <SelectItem value="disabled">none</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col lg:flex-row gap-4 justify-end items-start border-t pt-4">
                <div className="flex flex-row gap-2 w-full lg:w-auto md:justify-end">
                  <div>
                    <BreakDropdown bridgeID={resolvedBridgeID} dispoWithBreak={true} selectedAction={selectedAction} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      onClick={() => {
                        // Check if break is queued in localStorage
                        const queuedBreak = localStorage.getItem('selectedBreak');

                        if (queuedBreak && queuedBreak !== 'Break') {
                          // Break is queued - submit with dispoWithBreak
                          submitForm(null, true);
                        } else {
                          // No break queued - regular submit
                          submitForm();
                        }
                      }}
                      disabled={isSubmitting || !selectedAction || hasSubmittedSuccessfully}
                      className={hasSubmittedSuccessfully}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : hasSubmittedSuccessfully ? (
                        'Submitted Successfully!'
                      ) : (
                        'Submit Disposition'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Disposition;
