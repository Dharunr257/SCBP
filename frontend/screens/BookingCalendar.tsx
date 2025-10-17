import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Classroom, User, UserRole, WaitlistEntry, RoomBlock } from '../types';
import { ALL_DAY_SLOTS, PERIODS, formatTime12h } from '../constants';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, EditIcon, TrashIcon, ClipboardListIcon } from '../components/Icons';
import DatePicker from '../components/DatePicker';

interface BookingCalendarProps {
  currentUser: User;
  bookings: Booking[];
  classrooms: Classroom[];
  users: User[];
  roomBlocks: RoomBlock[];
  onBookSlot: (slot: { date: string; startTime: string; classroomId: string }) => void;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  onOverrideBooking: (booking: Booking) => void;
}

type CalendarView = 'Daily' | 'Monthly';

const getMonthCalendarDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    const endDate = new Date(lastDayOfMonth);
    if (lastDayOfMonth.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));
    }
    const days = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const canOverrideBooking = (currentUser: User, booking: Booking, users: User[]): boolean => {
    const bookingOwner = users.find(u => u._id === booking.userId);
    if (!bookingOwner || currentUser._id === booking.userId) return false;

    if (currentUser.role === UserRole.Principal || currentUser.isIqacDean) return true;

    const rolePower = {
        [UserRole.Principal]: 4,
        [UserRole.Dean]: 3,
        [UserRole.HOD]: 2,
        [UserRole.Faculty]: 1,
    };

    return rolePower[currentUser.role] > rolePower[bookingOwner.role];
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({ currentUser, bookings, classrooms, users, roomBlocks, onBookSlot, onEditBooking, onDeleteBooking, onOverrideBooking }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('Daily');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

    useEffect(() => {
        const availableClassrooms = classrooms.filter(c => c.status === 'available');
        if (selectedClassroomId === null && availableClassrooms.length > 0) {
            setSelectedClassroomId(availableClassrooms[0]._id);
        } else if (availableClassrooms.length === 0 && classrooms.length > 0) {
            setSelectedClassroomId(classrooms[0]._id);
        }
    }, [classrooms, selectedClassroomId]);


    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const maxDate = useMemo(() => {
        const d = new Date(today);
        d.setMonth(d.getMonth() + 2);
        return d;
    }, [today]);
    
    const bookingsByDate = useMemo(() => {
        const map = new Map<string, Booking[]>();
        bookings.forEach(b => {
            const dateKey = b.date;
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(b);
        });
        map.forEach(dayBookings => {
            dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
        return map;
    }, [bookings]);

    const handleDateChange = (increment: number) => {
        const newDate = new Date(currentDate);
        if (view === 'Monthly') {
            newDate.setMonth(currentDate.getMonth() + increment, 1);
        } else { // Daily
            newDate.setDate(currentDate.getDate() + increment);
        }

        if (newDate < minDate) {
            setCurrentDate(today);
        } else if (newDate > maxDate) {
            // Do nothing, or snap to maxDate
        } else {
            setCurrentDate(newDate);
        }
    };
    
    const handleDateSelect = (selectedDate: Date) => {
        if (selectedDate >= today && selectedDate <= maxDate) {
            setCurrentDate(selectedDate);
        }
        setIsDatePickerOpen(false);
    };
    
    const minDate = today;

    const isPrevDisabled = useMemo(() => {
        if (view === 'Daily') return currentDate <= today;
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1, 1);
        const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        return prevMonth < minMonth;
    }, [currentDate, today, minDate, view]);

    const isNextDisabled = useMemo(() => {
        if (view === 'Daily') {
            const nextDay = new Date(currentDate);
            nextDay.setDate(currentDate.getDate() + 1);
            return nextDay > maxDate;
        }
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
        return nextMonth > maxMonth;
    }, [currentDate, maxDate, view]);
    
    const calendarDays = useMemo(() => {
        if (view === 'Monthly') return getMonthCalendarDays(currentDate);
        return [currentDate];
    }, [currentDate, view]);

    const handleDayClick = (day: Date) => {
        setCurrentDate(day);
        setView('Daily');
    };

    const renderSlot = (date: Date, time: string, classroom: Classroom) => {
        const dateStr = formatDate(date);
        const period = PERIODS.find(p => p.startTime === time);
        if (!period) return null;

        if (classroom.status === 'maintenance') {
            return <div className="bg-gray-200 dark:bg-gray-700/50 h-full rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold text-sm border border-dashed border-gray-300 dark:border-gray-600">Maintenance</div>;
        }

        const block = roomBlocks.find(b => b.classroomId === classroom._id && b.date === dateStr && b.periods.includes(period.period));
        if (block) {
            const blockedByUser = users.find(u => u._id === block.userId);
            return (
                <div className="bg-blocked/80 dark:bg-blocked/50 h-full rounded-md flex flex-col items-center justify-center text-white p-1 text-center">
                    <p className="text-xs font-bold truncate">{block.reason}</p>
                    <p className="text-[10px] opacity-80">Blocked by {blockedByUser?.name.split(' ')[0]}</p>
                </div>
            );
        }
        
        const bookingsForSlot = bookings.filter(b => b.classroomId === classroom._id && b.date === dateStr && b.period === period.period);
        const completedBooking = bookingsForSlot.find(b => b.status === 'completed');
        if(completedBooking) {
            const user = users.find(u => u._id === completedBooking.userId);
            return (
                <div className="bg-gray-400 dark:bg-gray-600 text-white p-2 rounded-md text-xs h-full flex flex-col justify-between w-full text-left opacity-70">
                    <p className="font-bold truncate leading-tight">{completedBooking.subject} ({completedBooking.classYear})</p>
                    <p className="text-white/70 text-[11px] truncate">{user?.department}</p>
                    <p className="truncate text-[11px] mt-1">{completedBooking.staffName}</p>
                    <p className="text-white/80 text-[10px] font-semibold mt-1">Completed</p>
                </div>
            );
        }

        const confirmedBooking = bookingsForSlot.find(b => b.status === 'confirmed' || b.status === 'overridden');
        const pendingBookings = bookingsForSlot.filter(b => b.status === 'pending');
        const userHasPendingRequest = pendingBookings.some(b => b.userId === currentUser._id);
        const bookingToConsider = confirmedBooking || pendingBookings[0];

        // Renders the main booking/pending info card
        const BookingInfoCard = ({ booking }: { booking: Booking }) => {
            const user = users.find(u => u._id === booking.userId);
            const isOwner = currentUser._id === booking.userId;
            const canOverride = canOverrideBooking(currentUser, booking, users);
            const isPending = booking.status === 'pending';
            
            let bookingColor = isPending ? 'bg-yellow-500' : 'bg-booked';
            if (isOwner) bookingColor = 'bg-secondary';
            if (booking.status === 'overridden') bookingColor = 'bg-purple-500';

            return (
                <div className={`${bookingColor} text-white p-2 rounded-md text-xs h-full flex flex-col justify-between group relative overflow-hidden w-full text-left`}>
                    <div className="flex-grow">
                        <p className="font-bold truncate leading-tight">{booking.subject} ({booking.classYear})</p>
                        <p className="text-white/70 text-[11px] truncate">{user?.department}</p>
                        <p className="truncate text-[11px] mt-1">{booking.staffName}</p>
                        {isPending ? <p className="text-white/80 text-[10px] font-semibold mt-1">Pending Request</p> : null}
                        {booking.status === 'overridden' && <p className="text-white/80 text-[10px] font-semibold mt-1">Overridden</p>}
                    </div>
                    {(isOwner || canOverride) && !isPending && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 rounded-md text-center space-y-1">
                            {isOwner && (
                                <>
                                <button onClick={() => onEditBooking(booking)} className="w-full text-center py-1.5 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center justify-center"><EditIcon className="w-3 h-3 mr-1.5"/> Edit</button>
                                <button onClick={() => onDeleteBooking(booking._id)} className="w-full text-center py-1.5 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold flex items-center justify-center"><TrashIcon className="w-3 h-3 mr-1.5"/> Delete</button>
                                </>
                            )}
                            {canOverride && <button onClick={() => onOverrideBooking(booking)} className="w-full text-center py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold">Override</button>}
                        </div>
                    )}
                </div>
            )
        };

        // If there's any booking or pending request
        if (bookingToConsider) {
            const isOwnerOrRequester = currentUser._id === bookingToConsider.userId;
            if (isOwnerOrRequester || userHasPendingRequest) {
                return <BookingInfoCard booking={bookingToConsider} />;
            }
           
            const canOverride = canOverrideBooking(currentUser, bookingToConsider, users);
            return (
                <div className="h-full rounded-md flex flex-col text-center justify-between p-1 relative">
                    <div className="absolute inset-1">
                        <BookingInfoCard booking={bookingToConsider} />
                    </div>
                    <div className="relative z-10 w-full flex-grow flex flex-col justify-end items-center gap-1.5 p-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-md opacity-0 hover:opacity-100 transition-opacity">
                        {canOverride && <button onClick={() => onOverrideBooking(bookingToConsider)} className="w-full text-center py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold">Override</button>}
                        {bookingToConsider.status === 'pending' && currentUser.role !== UserRole.Faculty && (
                           <button onClick={() => onBookSlot({ date: dateStr, startTime: time, classroomId: classroom._id })} className="w-full text-center py-1.5 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold">Request Slot</button>
                        )}
                    </div>
                </div>
            );
        }

        // Slot is available or past
        const isToday = dateStr === formatDate(new Date());
        const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (isToday && period.endTime < currentTime) {
            return <div className="bg-gray-200 dark:bg-gray-700/50 h-full rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold text-sm">Past</div>;
        }

        if (currentUser.role === UserRole.Faculty) {
            return <div className="bg-available/10 w-full h-full rounded-md"></div>;
        }
        return (
            <button 
                onClick={() => onBookSlot({ date: dateStr, startTime: time, classroomId: classroom._id })}
                className="bg-available/10 hover:bg-available/30 w-full h-full rounded-md flex items-center justify-center group transition-colors"
                aria-label={`Book slot for ${classroom.name} at ${time} on ${dateStr}`}
            >
                <PlusIcon className="h-5 w-5 text-green-700 opacity-0 group-hover:opacity-100" />
            </button>
        );
    }

    const renderHeader = () => {
        if (view === 'Monthly') {
            return currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
        }
        return calendarDays[0].toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    const mobileDailyViewClassroom = classrooms.find(c => c._id === selectedClassroomId);

    return (
        <div className="p-4 md:p-6 bg-gray-100 dark:bg-dark-bg h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Classroom Bookings</h2>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <button onClick={() => handleDateChange(-1)} 
                        disabled={isPrevDisabled}
                        className="p-2 rounded-full bg-white dark:bg-dark-card shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous period"
                    >
                        <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
                    </button>
                    <div className="relative">
                       <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="font-semibold text-lg text-center text-gray-700 dark:text-gray-200 min-w-[240px] md:min-w-0 px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Select date"
                        >
                            {renderHeader()}
                        </button>
                        {isDatePickerOpen && (
                            <DatePicker
                                selectedDate={currentDate}
                                onChange={handleDateSelect}
                                minDate={today}
                                maxDate={maxDate}
                                onClose={() => setIsDatePickerOpen(false)}
                            />
                        )}
                    </div>
                    <button onClick={() => handleDateChange(1)} 
                        disabled={isNextDisabled}
                        className="p-2 rounded-full bg-white dark:bg-dark-card shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next period"
                    >
                        <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
                    </button>
                </div>
                 <div className="bg-white dark:bg-dark-card p-1 rounded-lg shadow-md self-center">
                    <button onClick={() => setView('Daily')} className={`px-4 py-1 text-sm font-semibold rounded-md ${view === 'Daily' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}>Daily</button>
                    <button onClick={() => setView('Monthly')} className={`px-4 py-1 text-sm font-semibold rounded-md ${view === 'Monthly' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}>Monthly</button>
                </div>
            </div>
            {view === 'Daily' && (
                <div className="md:hidden mb-4">
                    <label htmlFor="classroom-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Classroom</label>
                    <select
                        id="classroom-select"
                        value={selectedClassroomId ?? ''}
                        onChange={e => setSelectedClassroomId(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
            )}
            <div className="flex-grow overflow-auto">
            {view === 'Monthly' ? (
                <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-dark-border h-full">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-bold p-2 border-b-2 border-primary dark:border-primary-dark sticky top-0 bg-gray-100 dark:bg-dark-bg z-10 text-gray-700 dark:text-gray-300 text-sm">
                            {day}
                        </div>
                    ))}
                    {calendarDays.map((day) => {
                        const dateKey = formatDate(day);
                        const dayBookings = bookingsByDate.get(dateKey) || [];
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = formatDate(day) === formatDate(new Date());
                        return (
                            <button key={dateKey} onClick={() => handleDayClick(day)} className={`relative min-h-[90px] sm:min-h-[120px] p-1 border-r border-b border-gray-200 dark:border-dark-border group flex flex-col text-left ${isCurrentMonth ? 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                <div className={`flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full self-start ${isToday ? 'bg-primary text-white' : isCurrentMonth ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {day.getDate()}
                                </div>
                                <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] flex-grow hidden sm:block">
                                    {dayBookings.slice(0, 3).map(booking => {
                                        const isOwnBooking = booking.userId === currentUser._id;
                                        const isPending = booking.status === 'pending';
                                        const isOverridden = booking.status === 'overridden';
                                        let bgColor = 'bg-booked/80';
                                        if (isPending) bgColor = 'bg-yellow-200/80';
                                        if (isOwnBooking) bgColor = 'bg-secondary/80';
                                        if (isOverridden) bgColor = 'bg-purple-400/80';
                                        
                                        return (
                                            <div key={booking._id} className={`p-1 rounded text-xs text-black truncate ${bgColor}`}>
                                                <div className="flex items-center">
                                                    <span className="font-semibold truncate">{booking.subject}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {dayBookings.length > 3 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center font-semibold pt-1">
                                            + {dayBookings.length - 3} more
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow flex items-center justify-center sm:hidden">
                                    {dayBookings.length > 0 && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
                    {/* Desktop Daily View */}
                    <div className="hidden md:block overflow-x-auto">
                        <div className="grid" style={{ gridTemplateColumns: `auto repeat(${classrooms.length}, minmax(140px, 1fr))` }}>
                            {/* First row: empty corner + classroom headers */}
                            <div className="sticky top-0 left-0 z-30 bg-gray-100 dark:bg-dark-bg border-b border-r border-gray-200 dark:border-dark-border"></div>
                            {classrooms.map(cr => (
                                <div key={cr._id} className="text-center font-semibold text-sm p-2 h-12 flex items-center justify-center border-b border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card text-gray-700 dark:text-gray-200 sticky top-0 z-20">
                                    {cr.name}
                                </div>
                            ))}

                            {/* Subsequent rows for each slot */}
                            {ALL_DAY_SLOTS.map(slot => {
                                if (slot.type === 'period') {
                                    return (
                                        <React.Fragment key={slot.startTime}>
                                            {/* Time label */}
                                            <div className="sticky left-0 bg-white dark:bg-dark-card h-28 flex items-center justify-center font-semibold text-sm text-gray-500 dark:text-gray-400 border-r border-b border-gray-200 dark:border-dark-border px-2 z-10">
                                                {formatTime12h(slot.startTime)}
                                            </div>
                                            {/* Booking cells */}
                                            {classrooms.map(classroom => (
                                                <div key={`${classroom._id}-${slot.startTime}`} className="h-28 p-1 border-r border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
                                                    {renderSlot(calendarDays[0], slot.startTime, classroom)}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    );
                                }
                                // It's a break
                                const breakHeight = slot.name === 'Lunch' ? 'h-12' : 'h-8';
                                return (
                                    <React.Fragment key={slot.startTime}>
                                        {/* Time label for break */}
                                        <div className={`sticky left-0 ${breakHeight} flex items-center justify-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-r border-b border-gray-200 dark:border-dark-border z-10`}>
                                            {slot.name}
                                        </div>
                                        {/* Break cells */}
                                        <div
                                            className={`${breakHeight} bg-gray-50 dark:bg-gray-800/50 border-b border-r border-gray-200 dark:border-dark-border`}
                                            style={{ gridColumn: `span ${classrooms.length}` }}
                                        ></div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                    {/* Mobile Daily View */}
                    <div className="md:hidden">
                    {mobileDailyViewClassroom && ALL_DAY_SLOTS.map(slot => {
                        if (slot.type === 'period') {
                            return (
                                <div key={slot.startTime} className="flex items-stretch border-b border-gray-200 dark:border-dark-border min-h-[80px]">
                                    <div className="w-24 flex-shrink-0 flex items-center justify-center font-semibold text-sm text-gray-500 dark:text-gray-400 border-r dark:border-dark-border px-1 text-center">
                                        {formatTime12h(slot.startTime)}
                                    </div>
                                    <div className="flex-grow p-1">
                                        {renderSlot(calendarDays[0], slot.startTime, mobileDailyViewClassroom)}
                                    </div>
                                </div>
                            )
                        }
                        // It's a break
                        const breakHeight = slot.name === 'Lunch' ? 'h-10' : 'h-6';
                        return (
                             <div key={slot.startTime} className={`flex items-stretch border-b border-gray-200 dark:border-dark-border ${breakHeight}`}>
                                <div className={`w-24 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-r dark:border-dark-border`}>
                                    {slot.name}
                                </div>
                                <div className="flex-grow bg-gray-50 dark:bg-gray-800/50"></div>
                            </div>
                        )
                    })}
                    {!mobileDailyViewClassroom && <p className="text-center py-8 text-gray-500">No classrooms available to display.</p>}
                    </div>
                </>
            )}
            </div>
        </div>
    )
}

export default BookingCalendar;