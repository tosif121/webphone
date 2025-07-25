import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangePicker = ({ onDateChange, initialStartDate, initialEndDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [monthsShown, setMonthsShown] = useState(2);

  // Initialize with provided dates or defaults - only run once on mount
  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      const start = moment(initialStartDate).toDate();
      const end = moment(initialEndDate).toDate();
      setDateRange([start, end]);

      // Don't call onDateChange here since this is just initialization
    } else {
      // Default to today and 7 days ago
      const today = moment().endOf('day').toDate();
      const sevenDaysAgo = moment().subtract(7, 'days').startOf('day').toDate();
      setDateRange([sevenDaysAgo, today]);

      // Call onDateChange with default values only if no initial dates were provided
      if (onDateChange) {
        onDateChange([sevenDaysAgo, today]);
      }
    }
  }, []); // Empty dependency array - only run once

  // Apply preset date ranges
  const applyPresetRange = (daysBack) => {
    const end = moment().endOf('day').toDate();
    const start = moment().subtract(daysBack, 'days').startOf('day').toDate();

    setDateRange([start, end]);

    // Call the parent callback with the date objects
    if (onDateChange) {
      onDateChange([start, end]);
    }

    setIsOpen(false);
  };

  useEffect(() => {
    const updateMonths = () => {
      setMonthsShown(window.innerWidth < 640 ? 1 : 2);
    };

    updateMonths(); // initial check

    window.addEventListener('resize', updateMonths);
    return () => window.removeEventListener('resize', updateMonths);
  }, []);

  // Apply for today only
  const applyToday = () => {
    // Get today's date
    const today = moment();
    const todayStart = today.startOf('day').toDate(); // Start of today
    const todayEnd = today.endOf('day').toDate(); // End of today

    setDateRange([todayStart, todayEnd]);

    if (onDateChange) {
      onDateChange([todayStart, todayEnd]);
    }

    setIsOpen(false);
  };

  // Handle date range selection
  const handleDateRangeChange = (update) => {
    setDateRange(update);
  };

  // Format date range for display
  const getDateRangeText = () => {
    if (!startDate || !endDate) {
      return 'Select Date Range';
    }

    const start = moment(startDate);
    const end = moment(endDate);

    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY');
    }

    if (start.isSame(end, 'year')) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }

    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
  };

  // Handle apply button click
  const handleApply = () => {
    if (startDate && endDate && onDateChange) {
      onDateChange([startDate, endDate]);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden md:inline">{getDateRangeText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl p-4 bg-card border border-border shadow-lg"
        align="end"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => applyPresetRange(7)}>
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPresetRange(30)}>
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPresetRange(90)}>
              Last 90 days
            </Button>
            <Button variant="outline" size="sm" onClick={applyToday}>
              Today
            </Button>
          </div>
          <div className="pt-2">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              inline
              monthsShown={monthsShown}
              showPreviousMonths
              calendarClassName="!bg-card !border-0 !text-foreground"
              dayClassName={() => 'hover:bg-accent hover:text-accent-foreground'}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!startDate || !endDate}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
