import { useState } from 'react';
import { CalendarIcon, Clock, FileText, Phone } from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function Callback({
  followUpDate,
  setFollowUpDate,
  followUpTime,
  setFollowUpTime,
  followUpDetails,
  setFollowUpDetails,
  isCallbackDialogOpen,
  setCallbackDialogOpen,
  submitForm,
  onClose,
}) {
  const handleCancel = () => {
    setCallbackDialogOpen(false);
    setFollowUpDate(undefined);
    setFollowUpTime(new Date());
    setFollowUpDetails('');
    onClose?.();
  };

  const handleSubmit = () => {
    submitForm();
    onClose?.();
  };

  return (
    <Dialog open={isCallbackDialogOpen} onOpenChange={setCallbackDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Schedule Callback
          </DialogTitle>
          <DialogDescription>Set up a follow-up call with the customer. All fields are required.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Date Picker - Now without Popover */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Follow-up Date
              </Label>

              <DatePicker
                selected={followUpDate}
                onChange={setFollowUpDate}
                minDate={new Date()}
                dateFormat="PPP"
                placeholderText="Select a date"
                className={cn(
                  'w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  !followUpDate && 'text-muted-foreground'
                )}
                calendarClassName="!bg-card !border-0 !text-foreground ms-10"
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                Follow-up Time
              </Label>
              <div className="relative">
                <DatePicker
                  selected={followUpTime}
                  onChange={setFollowUpTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholderText="Select time"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followUpDetails" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Comment
            </Label>
            <Textarea
              id="followUpDetails"
              value={followUpDetails}
              onChange={(e) => setFollowUpDetails(e.target.value)}
              placeholder="Enter callback details, customer preferences, or specific topics to discuss..."
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="default" onClick={handleSubmit} className="w-full sm:w-auto">
              Schedule Callback
            </Button>
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
