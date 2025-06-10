import { CalendarIcon, Clock, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function formatDate(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(date) {
  if (!date) return '';
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function getNextQuarterHour(date) {
  const d = new Date(date);
  d.setSeconds(0);
  d.setMilliseconds(0);
  let minutes = d.getMinutes();
  let next = Math.ceil(minutes / 15) * 15;
  if (next === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(next);
  }
  return d;
}

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
  const now = new Date();
  const isToday =
    followUpDate &&
    followUpDate.getDate() === now.getDate() &&
    followUpDate.getMonth() === now.getMonth() &&
    followUpDate.getFullYear() === now.getFullYear();

  const minTime = isToday ? getNextQuarterHour(now) : new Date(0, 0, 0, 0, 0, 0);
  const maxTime = new Date(0, 0, 0, 23, 59, 59);

  const handleCancel = () => {
    setCallbackDialogOpen(false);
    setFollowUpDate(undefined);
    setFollowUpTime(new Date());
    setFollowUpDetails('');
    onClose?.();
  };

  const handleSubmit = () => {
    const formatted = {
      date: formatDate(followUpDate),
      time: formatTime(followUpTime),
      details: followUpDetails,
    };
    submitForm(formatted);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    e.preventDefault();
  };

  return (
    <Dialog open={isCallbackDialogOpen} onOpenChange={setCallbackDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Schedule Callback</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Follow-up Date
              </Label>
              <DatePicker
                selected={followUpDate}
                onChange={setFollowUpDate}
                minDate={now}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select a date"
                className={cn(
                  'w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  !followUpDate && 'text-muted-foreground'
                )}
                calendarClassName="!bg-card !border-0 !text-foreground ms-10"
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.blur()}
              />
            </div>
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
                  minTime={minTime}
                  maxTime={maxTime}
                  timeCaption="Time"
                  dateFormat="hh:mm aa"
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
