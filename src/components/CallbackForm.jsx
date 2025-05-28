import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Calendar, User, MessageSquare, AlertTriangle, PhoneCall, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DateTimePicker } from './DateTimePicker';

const CallbackForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState();
  const [formData, setFormData] = useState({
    customerName: '',
    callDateTime: '',
    customerResponse: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false);
  const firstInputRef = useRef(null);

  // Focus first input when dialog opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = 'Customer name must be at least 2 characters';
    }

    if (!selectedDate) {
      newErrors.callDateTime = 'Call date is required';
    } else {
      const currentDateTime = new Date();
      if (selectedDate < currentDateTime) {
        newErrors.callDateTime = 'Cannot select past date';
      }
    }

    if (!formData.customerResponse.trim()) {
      newErrors.customerResponse = 'Customer response is required';
    } else if (formData.customerResponse.trim().length < 10) {
      newErrors.customerResponse = 'Customer response must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedDate]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Callback scheduled:', {
        ...formData,
        callDateTime: selectedDate?.toISOString(),
      });

      handleCancel();
    } catch (error) {
      console.error('Error submitting callback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedDate, validateForm]);

  const handleCancel = useCallback(() => {
    setFormData({
      customerName: '',
      callDateTime: '',
      customerResponse: '',
    });
    setSelectedDate(undefined);
    setErrors({});
    setIsOpen(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Schedule Callback
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          // If the DateTimePicker popover is open, prevent dialog close
          if (dateTimePickerOpen) {
            e.preventDefault();
          }
        }}
        className="max-w-lg w-full p-0 border-none bg-transparent shadow-none flex items-center justify-center"
      >
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/30 bg-white/95 dark:bg-slate-900/80 shadow-2xl shadow-slate-900/10 dark:shadow-blue-500/10 backdrop-blur-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/20 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 dark:from-slate-800/40 dark:to-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <PhoneCall className="text-white" size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 dark:text-blue-200">
                  Schedule Callback
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm">
                  Fill in the callback details below
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 bg-gradient-to-b from-slate-50/40 to-white/95 dark:from-slate-900/20 dark:to-slate-900/60 space-y-8">
            {/* Customer Name Field */}
            <div className="space-y-3">
              <Label
                htmlFor="customerName"
                className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <User className="w-4 h-4 text-blue-600" />
                Customer Name *
              </Label>
              <div className="relative">
                <Input
                  ref={firstInputRef}
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className={`
                    w-full py-3 px-4 rounded-xl border transition-all
                    bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-white
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    shadow-sm focus:shadow-lg focus:ring-2 focus:ring-blue-400/50
                    ${
                      errors.customerName
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-400'
                    }
                  `}
                  placeholder="Enter customer name"
                  aria-describedby={errors.customerName ? 'customerName-error' : undefined}
                />
              </div>
              {errors.customerName && (
                <p id="customerName-error" className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.customerName}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Call Date *
              </Label>
              <div onClick={(e) => e.stopPropagation()}>
                <DateTimePicker
                  date={selectedDate}
                  setDate={setSelectedDate}
                  error={errors.callDateTime}
                  onOpenChange={setDateTimePickerOpen}
                />
              </div>
              {errors.callDateTime && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.callDateTime}
                </p>
              )}
            </div>

            {/* Customer Response Textarea */}
            <div className="space-y-3">
              <Label
                htmlFor="customerResponse"
                className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Customer Response *
              </Label>
              <Textarea
                id="customerResponse"
                value={formData.customerResponse}
                onChange={(e) => setFormData({ ...formData, customerResponse: e.target.value })}
                rows={4}
                className={`
                  resize-none w-full px-4 py-3 rounded-xl border transition-all
                  bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-white
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  shadow-sm focus:shadow-lg focus:ring-2 focus:ring-blue-400/50
                  ${
                    errors.customerResponse
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-400'
                  }
                `}
                placeholder="What did the customer say? Include their feedback, requests, concerns, or any specific changes they mentioned..."
                aria-describedby={errors.customerResponse ? 'customerResponse-error' : undefined}
              />
              {errors.customerResponse && (
                <p id="customerResponse-error" className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.customerResponse}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </div>
                ) : (
                  'Schedule Callback'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallbackForm;
