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
  handleContact,
  setFormData,
  formData,
  formConfig,
  phoneNumber,
  setPhoneNumber,
  fetchLeadsWithDateRange,
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

  // Changed to store Date objects for the Callback component
  const [followUpDate, setFollowUpDate] = useState(undefined);
  const [followUpTime, setFollowUpTime] = useState(new Date());
  const [followUpDetails, setFollowUpDetails] = useState('');

  const [isDispositionModalOpen, setDispositionModalOpen] = useState(false);
  const [isCallbackDialogOpen, setCallbackDialogOpen] = useState(false);
  const [callbackIncomplete, setCallbackIncomplete] = useState(false);

  const getStylesForAction = (action, isSelected) => {
    const actionStyles = {
      'Test Call': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#A21CAF', color: '#FFFFFF', borderColor: '#A21CAF' } // Purple
          : { backgroundColor: 'transparent', color: '#A21CAF', borderColor: '#A21CAF' },
      },
      Answered: {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#0EA5E9', color: '#FFFFFF', borderColor: '#0EA5E9' } // Cyan
          : { backgroundColor: 'transparent', color: '#0EA5E9', borderColor: '#0EA5E9' },
      },
      Busy: {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#2563EB', color: '#FFFFFF', borderColor: '#2563EB' } // Blue
          : { backgroundColor: 'transparent', color: '#2563EB', borderColor: '#2563EB' },
      },
      'Not Reachable': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#F43F5E', color: '#FFFFFF', borderColor: '#F43F5E' } // Pink/Red
          : { backgroundColor: 'transparent', color: '#F43F5E', borderColor: '#F43F5E' },
      },
      'No Answerr': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#EAB308', color: '#FFFFFF', borderColor: '#EAB308' } // Yellow
          : { backgroundColor: 'transparent', color: '#EAB308', borderColor: '#EAB308' },
      },
      'Voicemail Left': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#6366F1', color: '#FFFFFF', borderColor: '#6366F1' } // Indigo
          : { backgroundColor: 'transparent', color: '#6366F1', borderColor: '#6366F1' },
      },
      'Switched Off': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#F59E42', color: '#FFFFFF', borderColor: '#F59E42' } // Orange
          : { backgroundColor: 'transparent', color: '#F59E42', borderColor: '#F59E42' },
      },
      'Callback Scheduled': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#14B8A6', color: '#FFFFFF', borderColor: '#14B8A6' } // Teal
          : { backgroundColor: 'transparent', color: '#14B8A6', borderColor: '#14B8A6' },
      },
      'Wrong Number': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#a8211f', color: '#FFFFFF', borderColor: '#a8211f' } // Light Red
          : { backgroundColor: 'transparent', color: '#a8211f', borderColor: '#a8211f' },
      },
      'Do Not Call': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#bc6c25', color: '#FFFFFF', borderColor: '#bc6c25' } // Deep Purple
          : { backgroundColor: 'transparent', color: '#bc6c25', borderColor: '#bc6c25' },
      },
      Disconnected: {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#dd4920', color: '#FFFFFF', borderColor: '#dd4920' } // Amber
          : { backgroundColor: 'transparent', color: '#dd4920', borderColor: '#dd4920' },
      },
      Interested: {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#22C55E', color: '#FFFFFF', borderColor: '#22C55E' } // Green
          : { backgroundColor: 'transparent', color: '#22C55E', borderColor: '#22C55E' },
      },
      'Not Answered': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#EAB308', color: '#FFFFFF', borderColor: '#EAB308' } // Yellow
          : { backgroundColor: 'transparent', color: '#EAB308', borderColor: '#EAB308' },
      },
      Connected: {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#0EA5E9', color: '#FFFFFF', borderColor: '#0EA5E9' } // Cyan
          : { backgroundColor: 'transparent', color: '#0EA5E9', borderColor: '#0EA5E9' },
      },
      'Not Interested': {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#F43F5E', color: '#FFFFFF', borderColor: '#F43F5E' } // Pink/Red
          : { backgroundColor: 'transparent', color: '#F43F5E', borderColor: '#F43F5E' },
      },
    };
    return (
      actionStyles[action] || {
        variant: 'outline',
        style: isSelected
          ? { backgroundColor: '#64748B', color: '#FFFFFF', borderColor: '#64748B' }
          : { backgroundColor: 'transparent', color: '#64748B', borderColor: '#64748B' },
      }
    );
  };

  // Main effect to handle disposition options and auto disposition
  useEffect(() => {
    // Prevent running if already completed or in progress
    if (isAutoDispositionComplete || isAutoDispositionInProgress) {
      return;
    }

    const dispoData = JSON.parse(localStorage.getItem('token'))?.userData?.dispostionOptions;

    if (dispoData?.length > 0) {
      // Has disposition options - show modal
      setDispositionActions(
        dispoData.map((item) => ({
          action: item.value,
          label: item.label,
        }))
      );
      setShouldShowModal(true);
      setIsAutoDispositionComplete(true); // Mark as handled
    } else {
      // No disposition options - trigger auto disposition immediately
      console.log('No disposition options found, triggering auto disposition:', Date.now());
      setIsAutoDispositionInProgress(true);

      autoDispoFunc();
    }
  }, []); // Only depend on essential props

  const autoDispoFunc = async () => {
    try {
      const requestBody = {
        bridgeID,
        Disposition: 'Auto Disposed',
        autoDialDisabled: false,
      };

      const response = await axios.post(`https://esamwad.iotcom.io/user/disposition${username}`, requestBody);

      if (response.data.success) {
        toast.success('Auto disposition completed successfully');

        // Set completion flag before calling other functions
        setIsAutoDispositionComplete(true);
        setIsAutoDispositionInProgress(false);

        // Move to next contact only once
        if (handleContact) {
          handleContact();
          fetchLeadsWithDateRange();
        }

        // Close modal and clear phone number
        setDispositionModal(false);
        setPhoneNumber('');
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

      // Prevent multiple submissions
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
            // Use the formatted data from Callback component
            requestBody.followUpDisposition = {
              date: callbackData.date,
              time: callbackData.time,
              comment: callbackData.details,
              phoneNumber: phoneNumber,
            };
          } else {
            // Fallback to existing state (shouldn't happen with new flow)
            requestBody.followUpDisposition = {
              date: followUpDate,
              time: followUpTime,
              comment: followUpDetails,
              phoneNumber: phoneNumber,
            };
          }
        }

        const response = await axios.post(`https://esamwad.iotcom.io/user/disposition${username}`, requestBody);

        if (response.data.success) {
          toast.success('Disposition submitted successfully');
          setHasSubmittedSuccessfully(true);

          // Move to next contact only once and only if not already handled
          if (handleContact && !isAutoDispositionComplete) {
            handleContact();
            fetchLeadsWithDateRange();
          }

          setDispositionModal(false);
          setPhoneNumber('');
        } else {
          toast.error(response.data.message || 'Submission failed');
        }
      } catch (error) {
        // Check for 400 error in submitForm as well
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
      handleContact,
      setDispositionModal,
      phoneNumber,
      isSubmitting,
      hasSubmittedSuccessfully,
      isAutoDispositionComplete,
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dispositionActions.map((item) => {
                  const isSelected = selectedAction === item.action;
                  const styles = getStylesForAction(item.action, isSelected);
                  return (
                    <Button
                      key={`${item.action}-${item.label}`}
                      style={styles.style}
                      className="h-auto py-3 px-4 whitespace-normal text-xs sm:text-sm font-medium transition-all duration-200 border-2"
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
                    <Button
                      variant="outline"
                      onClick={() => setUserCallOpen(true)}
                      disabled={isSubmitting || hasSubmittedSuccessfully}
                    >
                      View Contact Form
                    </Button>
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
