'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DateRangePicker = ({ onDateChange, initialStartDate, initialEndDate, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      const from = moment(initialStartDate).toDate();
      const to = moment(initialEndDate).toDate();
      setDateRange({ from, to });
    } else {
      const to = moment().endOf('day').toDate();
      const from = moment().subtract(6, 'days').startOf('day').toDate();
      setDateRange({ from, to });
      // ✅ Convert to array format for callback
      onDateChange?.([from, to]);
    }
  }, []);

  const applyPreset = useCallback(
    (preset) => {
      let from, to;

      switch (preset) {
        case 'today':
          from = moment().startOf('day').toDate();
          to = moment().endOf('day').toDate();
          break;
        case 'yesterday':
          from = moment().subtract(1, 'days').startOf('day').toDate();
          to = moment().subtract(1, 'days').endOf('day').toDate();
          break;
        case 'last7':
          from = moment().subtract(6, 'days').startOf('day').toDate();
          to = moment().endOf('day').toDate();
          break;
        case 'last30':
          from = moment().subtract(29, 'days').startOf('day').toDate();
          to = moment().endOf('day').toDate();
          break;
        case 'last90':
          from = moment().subtract(89, 'days').startOf('day').toDate();
          to = moment().endOf('day').toDate();
          break;
        case 'thisMonth':
          from = moment().startOf('month').toDate();
          to = moment().endOf('month').toDate();
          break;
        case 'lastMonth':
          from = moment().subtract(1, 'month').startOf('month').toDate();
          to = moment().subtract(1, 'month').endOf('month').toDate();
          break;
        case 'thisYear':
          from = moment().startOf('year').toDate();
          to = moment().endOf('year').toDate();
          break;
        default:
          return;
      }

      setDateRange({ from, to });
      // ✅ Convert to array format for callback
      onDateChange?.([from, to]);
      setIsOpen(false);
    },
    [onDateChange]
  );

  const dateRangeText = useMemo(() => {
    if (!dateRange?.from) return 'Select Date Range';

    const start = moment(dateRange.from);
    const end = dateRange.to ? moment(dateRange.to) : start;

    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY');
    }

    if (start.isSame(end, 'month')) {
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
    }

    if (start.isSame(end, 'year')) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }

    return `${start.format('MMM D, YY')} - ${end.format('MMM D, YY')}`;
  }, [dateRange]);

  const handleDateChange = useCallback((range) => {
    setDateRange(range);
  }, []);

  const handleApply = useCallback(() => {
    if (dateRange?.from && dateRange?.to) {
      // ✅ Convert to array format for callback
      onDateChange?.([dateRange.from, dateRange.to]);
      setIsOpen(false);
    }
  }, [dateRange, onDateChange]);

  const handleClear = useCallback(() => {
    setDateRange({ from: null, to: null });
  }, []);

  const handleCancel = useCallback(() => {
    if (initialStartDate && initialEndDate) {
      setDateRange({
        from: moment(initialStartDate).toDate(),
        to: moment(initialEndDate).toDate(),
      });
    }
    setIsOpen(false);
  }, [initialStartDate, initialEndDate]);

  const presetButtons = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last7' },
    { label: 'Last 30 days', value: 'last30' },
    { label: 'Last 90 days', value: 'last90' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-medium h-10 px-3 py-2',
            'hover:bg-gray-50 transition-colors duration-200',
            'min-w-[200px]',
            !dateRange?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{dateRangeText}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn('p-0 flex flex-col shadow-lg', isMobile ? 'w-screen max-w-xs mx-4' : 'w-auto')}
        align={isMobile ? 'center' : 'end'}
        side="bottom"
        sideOffset={8}
      >
        <div className={cn('flex', isMobile ? 'flex-col' : 'flex-row')}>
          <div
            className={cn(
              'flex space-y-1 p-3 bg-accent/50',
              isMobile
                ? 'flex-row overflow-auto gap-1 space-y-0 border-b border-gray-200'
                : 'flex-col border-r border-gray-200 min-w-[140px]'
            )}
          >
            {presetButtons.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                className={cn(
                  'justify-start hover:text-primary',
                  isMobile ? 'text-xs h-7 px-2 flex-1 whitespace-nowrap' : 'text-sm h-8 px-3'
                )}
                onClick={() => applyPreset(preset.value)}
              >
                {preset.label}
              </Button>
            ))}

            <div className={cn(isMobile ? 'hidden' : 'pt-2 border-t border-gray-200 mt-2')}>
              <Button
                variant="ghost"
                className="justify-start hover:text-red-600 text-red-500 text-sm h-8 px-3 w-full"
                onClick={handleClear}
              >
                Clear dates
              </Button>
            </div>
          </div>

          <div className="overflow-hidden">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateChange}
              numberOfMonths={1}
              defaultMonth={dateRange?.from || new Date()}
              disabled={(date) => date > new Date()}
              captionLayout="dropdown"
              fromYear={new Date().getFullYear() - 10}
              toYear={new Date().getFullYear()}
              className={cn(isMobile && 'scale-95 origin-center')}
              classNames={{
                caption_label: 'hidden',
                dropdown: cn(
                  'bg-white dark:bg-black/50 shadow-none dark:text-white border border-gray-200 rounded px-2 py-1',
                  'appearance-none cursor-pointer',
                  isMobile ? 'text-xs min-w-[70px]' : 'text-sm w-max'
                ),
                dropdown_month: 'mr-2',
                caption_dropdowns: 'flex gap-2 items-center justify-center',
                vhidden: 'hidden',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-3 py-2 bg-accent/30">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!dateRange?.from || !dateRange?.to}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
