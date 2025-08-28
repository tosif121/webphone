import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const Disposition = ({
  bridgeID,
  setDispositionModal,
  setFormData,
  formData,
  formConfig,
  phoneNumber,
  setPhoneNumber,
  fetchLeadsWithDateRange,
  callType,
  setCallType,
}) => {
  const { username } = useContext(HistoryContext);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isAutoLeadDialDisabled, setIsAutoLeadDialDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCallOpen, setUserCallOpen] = useState(false);
  const [dispositionActions, setDispositionActions] = useState([]);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isAutoDispositionComplete, setIsAutoDispositionComplete] = useState(false);
  const [isAutoDispositionInProgress, setIsAutoDispositionInProgress] = useState(false);
  const [campaignName, setCampaignName] = useState('N/A');

  // Changed to store Date objects for the Callback component
  const [followUpDate, setFollowUpDate] = useState(undefined);
  const [followUpTime, setFollowUpTime] = useState(new Date());
  const [followUpDetails, setFollowUpDetails] = useState('');

  const [isDispositionModalOpen, setDispositionModalOpen] = useState(false);
  const [isCallbackDialogOpen, setCallbackDialogOpen] = useState(false);
  const [callbackIncomplete, setCallbackIncomplete] = useState(false);

  useEffect(() => {
    const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (tokenData) {
      try {
        const parsedData = JSON.parse(tokenData);
        setCampaignName(parsedData?.userData?.campaignName || 'N/A');
      } catch (e) {
        setCampaignName('N/A');
      }
    }
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
      'Callback Scheduled': {
        variant: 'outline',
        className: isSelected
          ? 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700 dark:hover:bg-teal-900/30'
          : 'text-teal-700 border-teal-200 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/10',
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

    return (
      actionStyles[action] || {
        variant: 'outline',
        className: isSelected
          ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800/30'
          : 'text-slate-700 border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800/10',
      }
    );
  };
  useEffect(() => {
    // Prevent running if already completed or in progress
    if (isAutoDispositionComplete || isAutoDispositionInProgress) {
      return;
    }

    const tokenData = JSON.parse(localStorage.getItem('token'))?.userData;
    const dispositionFlag = tokenData?.disposition;
    const dispoData = tokenData?.dispostionOptions;

    // Prioritize disposition flag
    if (dispositionFlag === false) {
      console.log('Disposition flag is false, triggering auto disposition:', Date.now());
      setIsAutoDispositionInProgress(true);
      autoDispoFunc();
      return;
    }

    // If flag is true or undefined, check options
    if (dispoData?.length > 0) {
      // Has disposition options - show modal
      setDispositionActions(
        dispoData.map((item) => ({
          action: item.value,
          label: item.label,
        }))
      );
      setShouldShowModal(true);
      setIsAutoDispositionComplete(true);
    } else {
      console.log('No disposition options found, triggering auto disposition:', Date.now());
      setIsAutoDispositionInProgress(true);
      autoDispoFunc();
    }
  }, []);

  const autoDispoFunc = async () => {
    try {
      const requestBody = {
        bridgeID,
        Disposition: 'Auto Disposed',
        autoDialDisabled: false,
      };

      const response = await axios.post(`${window.location.origin}/user/disposition${username}`, requestBody);

      if (response.data.success) {
        toast.success('Auto disposition completed successfully');

        // Set completion flag before calling other functions
        setIsAutoDispositionComplete(true);
        setIsAutoDispositionInProgress(false);

        // Move to next contact only once

        fetchLeadsWithDateRange();

        // Close modal and clear phone number
        setDispositionModal(false);
        setPhoneNumber('');
        setCallType('');
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
        console.log('400 error received, not showing modal');
        setIsAutoDispositionComplete(true);

        // Don't show modal for 400 errors - just close everything
        setDispositionModal(false);
        setPhoneNumber('');
        setCallType('');
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
  };

  const handleActionClick = useCallback((action, event) => {
    event.preventDefault();
    event.stopPropagation();

    setTimeout(() => {
      setSelectedAction((prevAction) => {
        const newAction = prevAction === action ? null : action;
        setCallbackDialogOpen(newAction === 'Callback Scheduled');
        // Track if callback was opened
        if (newAction === 'Callback Scheduled') {
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
          setDispositionModal(false);
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
    [selectedAction, isSubmitting, callbackIncomplete, hasSubmittedSuccessfully, setDispositionModal]
  );

  // Enhanced X button click handler
  const handleXButtonClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Allow closing if successfully submitted
      if (hasSubmittedSuccessfully) {
        setDispositionModal(false);
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
    [selectedAction, isSubmitting, callbackIncomplete, hasSubmittedSuccessfully, setDispositionModal]
  );

  // Prevent ESC key from closing modal
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        // Allow closing if successfully submitted
        if (hasSubmittedSuccessfully) {
          setDispositionModal(false);
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
    [selectedAction, isSubmitting, callbackIncomplete, hasSubmittedSuccessfully, setDispositionModal]
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
    async (callbackData = null) => {
      if (!selectedAction) {
        toast.error('Please select a disposition action');
        return;
      }

      // Validate the entire form
      // if (!isFormValid()) {
      //   toast.error('Please fill all required fields to proceed.');
      //   return;
      // }

      if (isSubmitting || hasSubmittedSuccessfully) {
        return;
      }

      setIsSubmitting(true);

      try {
        const requestBody = {
          bridgeID,
          Disposition: selectedAction,
          autoDialDisabled: isAutoLeadDialDisabled,
        };

        if (selectedAction === 'Callback Scheduled') {
          if (callbackData) {
            requestBody.followUpDisposition = {
              date: callbackData.date,
              time: callbackData.time,
              comment: callbackData.details,
              phoneNumber: phoneNumber,
            };
          } else {
            requestBody.followUpDisposition = {
              date: followUpDate,
              time: followUpTime,
              comment: followUpDetails,
              phoneNumber: phoneNumber,
            };
          }
        }

        const response = await axios.post(`${window.location.origin}/user/disposition${username}`, requestBody);

        if (response.data.success) {
          toast.success('Disposition submitted successfully');
          setHasSubmittedSuccessfully(true);

          fetchLeadsWithDateRange();

          setDispositionModal(false);
          setPhoneNumber('');
          setCallType('');
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
      bridgeID,
      username,
      isAutoLeadDialDisabled,
      followUpDate,
      followUpTime,
      followUpDetails,
      setDispositionModal,
      phoneNumber,
      isSubmitting,
      hasSubmittedSuccessfully,
      fetchLeadsWithDateRange,
      setCallType,
      formConfig,
      formData,
    ]
  );

  const handleCallbackSubmit = useCallback(
    (callbackData) => {
      let date, time, details;
      if (selectedAction === 'Callback Scheduled') {
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
    [selectedAction, followUpDate, followUpTime, followUpDetails, submitForm]
  );

  // Don't render anything if modal shouldn't be shown
  if (!shouldShowModal) {
    return null;
  }

  // const isFormValid = () => {
  //   if (!formConfig?.sections || formConfig.sections.length === 0) {
  //     return true; // No form, no validation
  //   }

  //   for (const section of formConfig.sections) {
  //     for (const field of section.fields) {
  //       if (field.required) {
  //         const value = formData[field.name];
  //         if (value === undefined || value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
  //           return false;
  //         }
  //       }
  //     }
  //   }
  //   return true;
  // };

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
                <DialogTitle className="text-xl font-bold text-foreground">Select Disposition</DialogTitle>
                <p className="text-sm text-muted-foreground">Choose the appropriate outcome for this call</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                {/* Call Type */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 rounded-lg px-4 py-3 shadow-sm backdrop-blur-sm min-w-[180px]">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Type</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                      {callType === 'outgoing' ? 'Outgoing Call' : 'Incoming Call'}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 rounded-lg px-4 py-3 shadow-sm backdrop-blur-sm min-w-[180px]">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Number</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{phoneNumber}</span>
                  </div>
                </div>

                {/* Campaign */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 rounded-lg px-4 py-3 shadow-sm backdrop-blur-sm min-w-[180px]">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Campaign</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-100 capitalize">
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
              <div className="flex flex-col lg:flex-row gap-4 justify-end items-start border-t pt-4">
                <div className="flex flex-wrap sm:flex-row flex-col-reverse gap-2 w-full lg:w-auto md:justify-end">
                  <div>
                    <BreakDropdown bridgeID={bridgeID} dispoWithBreak={true} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {/* <Button
                      variant="outline"
                      onClick={() => setUserCallOpen(true)}
                      disabled={isSubmitting || hasSubmittedSuccessfully}
                    >
                      View Contact Form
                    </Button> */}
                    <Button
                      onClick={() => submitForm()}
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
      {userCallOpen && (
        <Dialog open={userCallOpen} onOpenChange={setUserCallOpen}>
          <DialogContent className="max-w-2xl p-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground"></DialogTitle>
            </DialogHeader>
            <DynamicForm
              formConfig={formConfig}
              formState={formData}
              setFormState={setFormData}
              userCallDialog={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Disposition;
