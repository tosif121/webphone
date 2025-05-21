import React, { useState } from 'react';
import { DateRangePicker } from 'rsuite';
import DateRange from './DateRange';
import moment from 'moment';

const DatePicker = ({ setStartDate, setEndDate }) => {
  const [datePickerValue, setDatePickerValue] = useState([]);

  function handleDatePicker(value) {
    if (value && value.length > 0) {
      setDatePickerValue(value);
      setStartDate(moment(value[0]).format('YYYY-MM-DD'));
      setEndDate(moment(value[1]).format('YYYY-MM-DD'));
    } else {
      setDatePickerValue(value);
      const startDate = moment().subtract(24, 'hours').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');
      setStartDate(startDate);
      setEndDate(endDate);
    }
  }

  return (
    <div className="whitespace-nowrap">
      <DateRangePicker
        ranges={DateRange}
        showOneCalendar
        placeholder={'Select Date Range'}
        style={{ width: 250 }}
        value={datePickerValue}
        onChange={(value) => handleDatePicker(value)}
        disabledDate={(date) => date > new Date()}
        cleanable={true}
        className="select-none"
      />
    </div>
  );
};

export default DatePicker;
