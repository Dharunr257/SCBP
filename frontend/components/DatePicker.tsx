import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface DatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
  onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange, minDate, maxDate, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const handleMonthChange = (increment: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
  }

  minDate.setHours(0,0,0,0);
  maxDate.setHours(0,0,0,0);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isDisabled = date < minDate || date > maxDate;
    const isToday = date.toDateString() === new Date().toDateString();

    let buttonClass = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors';
    if (isDisabled) {
      buttonClass += ' text-gray-400 dark:text-gray-600 cursor-not-allowed';
    } else {
      buttonClass += ' hover:bg-gray-200 dark:hover:bg-gray-700';
    }
    if (isSelected) {
      buttonClass += ' bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90';
    } else if (isToday && !isDisabled) {
        buttonClass += ' border border-primary dark:border-primary-dark';
    } else {
        buttonClass += ' text-gray-800 dark:text-gray-200';
    }

    calendarDays.push(
      <button 
        key={day} 
        disabled={isDisabled} 
        className={buttonClass}
        onClick={() => {
            onChange(date);
            onClose();
        }}
      >
        {day}
      </button>
    );
  }
  
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const isPrevMonthDisabled = viewDate <= minMonth;
  const isNextMonthDisabled = viewDate >= maxMonth;


  return (
    <>
        <div className="fixed inset-0 z-30" onClick={onClose}></div>
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-card rounded-lg shadow-2xl p-4 z-40 w-80 border dark:border-dark-border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => handleMonthChange(-1)} disabled={isPrevMonthDisabled} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5"/></button>
                <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{monthNames[month]} {year}</div>
                <button onClick={() => handleMonthChange(1)} disabled={isNextMonthDisabled} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronRightIcon className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays}
            </div>
        </div>
    </>
  );
};

export default DatePicker;