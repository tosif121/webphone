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

// DateTimePicker component (fixed version)
export const DateTimePicker = ({
  date,
  setDate,
  error,
  placeholder = 'Select date and time',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  className = '',
  onClear,
  showClear = true,
  onOpenChange, // New prop to communicate popover state
}) => {
  const [open, setOpen] = useState(false);
  const [localDate, setLocalDate] = useState(date || null);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('PM');

  // Notify parent when popover opens/closes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open);
    }
  }, [open, onOpenChange]);

  // Initialize local state when opening
  useEffect(() => {
    if (open) {
      let init = date ? new Date(date) : new Date();
      if (!date) {
        init.setHours(init.getHours() + 1, 0, 0, 0);
      }
      setLocalDate(init);
      updateTimeFromDate(init);
    }
  }, [open, date]);

  const updateTimeFromDate = (dateObj) => {
    if (!dateObj) return;
    let h = dateObj.getHours();
    setPeriod(h >= 12 ? 'PM' : 'AM');
    h = h % 12;
    if (h === 0) h = 12;
    setHour(h.toString().padStart(2, '0'));
    setMinute(dateObj.getMinutes().toString().padStart(2, '0'));
  };

  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    if (localDate) {
      newDate.setHours(localDate.getHours(), localDate.getMinutes(), 0, 0);
    } else {
      const now = new Date();
      newDate.setHours(now.getHours() + 1, 0, 0, 0);
      updateTimeFromDate(newDate);
    }
    setLocalDate(newDate);
  };

  const handleTimeChange = (newHour, newMinute, newPeriod) => {
    let h = parseInt(newHour, 10);
    const m = parseInt(newMinute, 10);
    h = newPeriod === 'PM' ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    if (localDate) {
      const newDate = new Date(localDate);
      newDate.setHours(h, m, 0, 0);
      setLocalDate(newDate);
    }
    setHour(newHour);
    setMinute(newMinute);
    setPeriod(newPeriod);
  };

  const handleApply = () => {
    if (localDate) {
      setDate(new Date(localDate));
    }
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDate(null);
    setLocalDate(null);
    if (onClear) onClear();
  };

  const formatDateTime = (d) => {
    if (!d) return placeholder;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    let dateStr;
    if (isToday) {
      dateStr = 'Today';
    } else if (isTomorrow) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
  const isDateInvalid = localDate && ((minDate && localDate < minDate) || (maxDate && localDate > maxDate));

  return (
    <div className={className}>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={`
            w-full justify-start text-left font-normal rounded-xl py-3 px-4 h-auto
            bg-white/90 dark:bg-slate-900/90 border-2 transition-all duration-200 flex items-center             
            ${!date && 'text-slate-400 dark:text-slate-500'}
            ${disabled && 'opacity-60 cursor-not-allowed'}
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-400/20'
                : 'border-slate-200 dark:border-slate-700 dark:hover:border-blue-600 hover:border-blue-400'
            }
          `}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm ${date ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                  {formatDateTime(date)}
                </span>
                {required && !date && <span className="text-xs text-red-500 mt-0.5">Required</span>}
              </div>
            </div>
            {showClear && date && !disabled && (
              <button
                onClick={handleClear}
                className="h-6 w-6 p-0 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 z-50 w-auto p-0 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl">
            <div className="flex">
              {/* Calendar Section */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  <div className="p-2 font-medium text-slate-500">Sun</div>
                  <div className="p-2 font-medium text-slate-500">Mon</div>
                  <div className="p-2 font-medium text-slate-500">Tue</div>
                  <div className="p-2 font-medium text-slate-500">Wed</div>
                  <div className="p-2 font-medium text-slate-500">Thu</div>
                  <div className="p-2 font-medium text-slate-500">Fri</div>
                  <div className="p-2 font-medium text-slate-500">Sat</div>
                  {/* Simple calendar implementation */}
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date();
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const startDay = startOfMonth.getDay();
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

                    const dayNumber = i - startDay + 1;
                    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                    const currentDate = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                    const isSelected = localDate && currentDate.toDateString() === localDate.toDateString();
                    const isToday = currentDate.toDateString() === today.toDateString();

                    if (!isValidDay) {
                      return <div key={i} className="p-2"></div>;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleDateSelect(currentDate)}
                        className={`
                          p-2 rounded-lg hover:bg-blue-100 transition-colors
                          ${isSelected ? 'bg-blue-600 text-white' : ''}
                          ${isToday && !isSelected ? 'bg-blue-50 text-blue-600 font-medium' : ''}
                        `}
                      >
                        {dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Section */}
              <div className="px-2 py-8 w-64 bg-gradient-to-b from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 rounded-r-2xl border-l border-slate-200 dark:border-slate-700">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Select Time</Label>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* Hour */}
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1 block">Hour</Label>
                      <select
                        value={hour}
                        onChange={(e) => handleTimeChange(e.target.value, minute, period)}
                        className="w-full p-2 bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        {hours.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-2xl font-bold text-slate-400 mt-5">:</div>
                    {/* Minute */}
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1 block">Min</Label>
                      <select
                        value={minute}
                        onChange={(e) => handleTimeChange(hour, e.target.value, period)}
                        className="w-full p-2 bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        {minutes.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* AM/PM */}
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 mb-1 block">Period</Label>
                      <select
                        value={period}
                        onChange={(e) => handleTimeChange(hour, minute, e.target.value)}
                        className="w-full p-2 bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  {/* Current selection preview */}
                  {localDate && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Preview</div>
                      <div className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                        {formatDateTime(localDate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-b-2xl border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={!localDate || isDateInvalid}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
