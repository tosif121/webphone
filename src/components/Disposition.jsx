import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import BreakDropdown from './BreakDropdown';
import UserCall from './UserCall';
import HistoryContext from '@/context/HistoryContext';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import DynamicForm from './DynamicForm';

const Disposition = ({ bridgeID, setDispositionModal, handleContact, setFormData, formData, formConfig }) => {
  const { username } = useContext(HistoryContext);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isAutoLeadDialDisabled, setIsAutoLeadDialDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCallOpen, setUserCallOpen] = useState(false);
  const [dispositionActions, setDispositionActions] = useState([]);

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
      // Add missing actions from default array
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

  useEffect(() => {
    const dispoData = JSON.parse(localStorage.getItem('token'))?.userData?.dispostionOptions;
    if (dispoData?.length > 0) {
      setDispositionActions(
        dispoData.map((item) => ({
          action: item.value,
          label: item.label,
        }))
      );
    } else {
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
    }
  }, []);

  // Fixed click handler with proper event handling
  const handleActionClick = useCallback((action, event) => {
    // Prevent any potential event bubbling
    event.preventDefault();
    event.stopPropagation();

    // Add a small delay to ensure state update is processed
    setTimeout(() => {
      setSelectedAction((prevAction) => {
        // Toggle selection if same action is clicked, otherwise select new action
        return prevAction === action ? null : action;
      });
    }, 0);
  }, []);

  const submitForm = useCallback(async () => {
    if (!selectedAction) {
      toast.error('Please select a disposition action');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`https://esamwad.iotcom.io/user/disposition${username}`, {
        bridgeID,
        Disposition: selectedAction,
        autoDialDisabled: isAutoLeadDialDisabled,
      });

      if (response.data.success) {
        toast.success('Disposition submitted successfully');
        handleContact();
        setDispositionModal(false);
      } else {
        toast.error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An unexpected error occurred');
      console.error('Disposition error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAction, bridgeID, username, isAutoLeadDialDisabled, handleContact, setDispositionModal]);

  if (dispositionActions.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={true} onOpenChange={setDispositionModal}>
        <DialogContent
          className="
     sm:max-w-2xl w-full p-0 border-none bg-transparent shadow-none
    flex items-center justify-center [&>button]:hidden"
        >
          <div
            className="
      relative overflow-hidden rounded-2xl
      border border-slate-200/80 dark:border-slate-700/30
      bg-white/95 dark:bg-slate-900/80
      shadow-2xl shadow-slate-900/20 dark:shadow-blue-500/10
      backdrop-blur-md
      w-full
    "
          >
            <div className="p-6 space-y-6 overflow-auto">
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Select Disposition</h3>
                <p className="text-sm text-muted-foreground">Choose the appropriate outcome for this call</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dispositionActions.map((item) => {
                  const isSelected = selectedAction === item.action;
                  const styles = getStylesForAction(item.action, isSelected);

                  return (
                    <Button
                      key={`${item.action}-${item.label}`}
                      variant={styles.variant}
                      style={styles.style}
                      className={`h-auto py-3 px-4 whitespace-normal text-sm font-medium transition-all duration-200 border-2 hover:opacity-90 ${
                        isSelected ? 'ring-2 ring-offset-2 ring-offset-background shadow-lg' : 'hover:shadow-md'
                      }`}
                      onClick={(event) => handleActionClick(item.action, event)}
                      disabled={isSubmitting}
                      type="button"
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col lg:flex-row gap-4 justify-end items-start border-t pt-4">
                {/* <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-dial-toggle"
              checked={isAutoLeadDialDisabled}
              onCheckedChange={setIsAutoLeadDialDisabled}
            />
            <Label htmlFor="auto-dial-toggle">Disable Auto Dial</Label>
          </div> */}

                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                  <BreakDropdown bridgeID={bridgeID} dispoWithBreak={true} />

                  <Button variant="outline" onClick={() => setUserCallOpen(true)}>
                    View Contact Form
                  </Button>

                  <Button onClick={submitForm} disabled={isSubmitting || !selectedAction}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Disposition'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {userCallOpen && (
        <Dialog open={userCallOpen} onOpenChange={setUserCallOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="text-xl font-bold"></DialogHeader>
            <DynamicForm
              formConfig={formConfig}
              formState={formData}
              setFormState={setFormData}
              userCallDialog={true}
            />
            {/* <UserCall formData={formData} setFormData={setFormData} userCallDialog={true} /> */}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Disposition;
