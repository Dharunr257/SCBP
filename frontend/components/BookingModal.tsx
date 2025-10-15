
import React, { useState, useEffect, useMemo } from 'react';
import { Booking, Classroom, User, UserRole } from '../types';
import { CloseIcon, TrashIcon } from './Icons';
import { PERIODS, formatTime12h } from '../constants';
import { Spinner } from './Spinner';

type BookingModalMode = 'create' | 'edit' | 'override';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, '_id' | 'status' | 'period' | 'startTime' | 'endTime' | 'createdAt'> & { _id?: string; periods: number[] }, mode: BookingModalMode) => Promise<boolean>;
  onDelete: (bookingId: string) => Promise<void>;
  classrooms: Classroom[];
  currentUser: User;
  users: User[];
  bookingToEdit?: (Booking & { date: string; startTime: string; endTime: string }) | null;
  initialSlot?: { date: string; startTime: string; classroomId: string };
  mode: BookingModalMode;
  isApprovalEnabled: boolean;
}

const canEditBooking = (currentUser: User, booking: Booking, users: User[]): boolean => {
    return currentUser._id === booking.userId;
};


export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, onDelete, classrooms, currentUser, bookingToEdit, initialSlot, mode, isApprovalEnabled, users }) => {
  const [subject, setSubject] = useState('');
  const [classYear, setClassYear] = useState('');
  const [classroomId, setClassroomId] = useState<string>(classrooms.length === 1 ? classrooms[0]._id : '');
  const [date, setDate] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [staffName, setStaffName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState(PERIODS);

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  
  const isSingleClassroom = classrooms.length === 1;

  const bookingOwner = useMemo(() => {
    return bookingToEdit ? users.find(u => u._id === bookingToEdit.userId) : null;
  }, [bookingToEdit, users]);

  const isEditable = useMemo(() => {
    if (mode === 'create' || mode === 'override') return true;
    if (!bookingToEdit) return false;
    return canEditBooking(currentUser, bookingToEdit, users);
  }, [currentUser, bookingToEdit, users, mode]);
  
  useEffect(() => {
    if (mode === 'create') {
        const isToday = date === new Date().toISOString().split('T')[0];
        if (isToday) {
            const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const futurePeriods = PERIODS.filter(p => p.startTime > currentTime);
            setAvailablePeriods(futurePeriods);
            setSelectedPeriods(prev => prev.filter(p => futurePeriods.some(fp => fp.period === p)));
        } else {
            setAvailablePeriods(PERIODS);
        }
    } else {
        setAvailablePeriods(PERIODS);
    }
  }, [date, mode, isOpen]);


  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError('');

      if (mode === 'edit' && bookingToEdit) {
        setSubject(bookingToEdit.subject);
        setClassYear(bookingToEdit.classYear);
        setClassroomId(bookingToEdit.classroomId);
        setDate(bookingToEdit.date);
        setSelectedPeriods([bookingToEdit.period]);
        setStaffName(bookingToEdit.staffName);
        setContactNo(bookingToEdit.contactNo);
      } else if (mode === 'override' && bookingToEdit) {
        // For override, pre-fill location/time, but reset other fields for the new user
        setSubject('');
        setClassYear('');
        setClassroomId(bookingToEdit.classroomId);
        setDate(bookingToEdit.date);
        setSelectedPeriods([bookingToEdit.period]);
        setStaffName(currentUser.name);
        setContactNo('');
      } else if (mode === 'create' && initialSlot) {
        setDate(initialSlot.date);
        setClassroomId(initialSlot.classroomId);
        const initialPeriod = PERIODS.find(p => p.startTime === initialSlot.startTime);
        setSelectedPeriods(initialPeriod ? [initialPeriod.period] : []);
        setSubject('');
        setClassYear('');
        setStaffName(currentUser.name);
        setContactNo('');
      } else {
        // Reset form for a fresh 'create'
        const today = new Date().toISOString().split('T')[0];
        setSubject('');
        setClassYear('');
        setClassroomId(isSingleClassroom ? classrooms[0]._id : '');
        setDate(today);
        setSelectedPeriods([]);
        setStaffName(currentUser.name);
        setContactNo('');
      }
    }
  }, [isOpen, mode, bookingToEdit, initialSlot, isSingleClassroom, classrooms, currentUser.name]);

  const handlePeriodChange = (period: number) => {
    setSelectedPeriods(prev => 
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === UserRole.Faculty && mode !== 'edit') {
        setError('Faculty members cannot create bookings.');
        return;
    }
    if (!subject || !classYear || !classroomId || !date || selectedPeriods.length === 0 || !staffName || !contactNo) {
      setError('All fields are required, and at least one period must be selected.');
      return;
    }
    
    setLoading(true);
    setError('');

    const newBookingData = {
      _id: bookingToEdit?._id,
      userId: currentUser._id,
      classroomId: classroomId,
      date,
      subject,
      classYear,
      staffName,
      contactNo,
      periods: selectedPeriods,
    };
    
    const success = await onSave(newBookingData, mode);

    if (!success) {
        setError('Failed to save booking. The slot might be taken, or an error occurred.');
    }
    setLoading(false);
  };
  
  const requiresApproval = isApprovalEnabled && mode === 'create' && currentUser.role !== UserRole.Principal && !currentUser.isIqacDean;

  const modalTitle = {
    create: 'Create Booking',
    edit: 'Edit Booking',
    override: 'Override Booking'
  };

  const saveButtonText = {
    create: requiresApproval ? 'Request Booking' : 'Book',
    edit: 'Update',
    override: 'Override'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <CloseIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{modalTitle[mode]}</h2>
        
        {mode === 'override' && bookingOwner && (
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4" role="alert">
                <p className="font-bold">Overriding Booking</p>
                <p className="text-sm">You are overriding a booking made by {bookingOwner.name} ({bookingOwner.department}). They will be notified of this change.</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={mode === 'edit' ? bookingOwner?.name : currentUser.name} disabled className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
            <input type="text" value={mode === 'edit' ? bookingOwner?.department : currentUser.department} disabled className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
            <input id="staffName" type="text" placeholder="Staff Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required disabled={!isEditable} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-800" />
            <input id="contactNo" type="tel" placeholder="Contact No." value={contactNo} onChange={(e) => setContactNo(e.target.value)} required disabled={!isEditable} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-800" />
            <input id="subject" type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required disabled={!isEditable} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-800" />
            <input id="classYear" type="text" placeholder="Class Year (e.g., II Year)" value={classYear} onChange={(e) => setClassYear(e.target.value)} required disabled={!isEditable} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-800" />
             
            {isSingleClassroom ? (
                 <input type="text" value={classrooms[0].name} disabled className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
            ) : (
                <select id="classroom" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} required disabled={!isEditable} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary h-[42px] disabled:bg-gray-100 dark:disabled:bg-gray-800">
                    <option value="" disabled>Select classroom</option>
                    {classrooms.filter(c => c.status === 'available' || c._id === classroomId).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            )}

            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={todayStr} max={maxDateStr} disabled={!isEditable} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periods (Select multiple hours)</label>
            {mode === 'edit' || mode === 'override' ? (
                 <select id="period" value={selectedPeriods[0] || ''} disabled className="mt-1 block w-full border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 rounded-md shadow-sm p-2">
                    <option value={bookingToEdit?.period}>Period {bookingToEdit?.period} ({formatTime12h(bookingToEdit?.startTime || '')}-{formatTime12h(bookingToEdit?.endTime || '')})</option>
                </select>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border dark:border-gray-600 rounded-lg">
                    {availablePeriods.map(p => (
                        <label key={p.period} className={`flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer ${selectedPeriods.includes(p.period) ? 'bg-primary/20 dark:bg-primary-dark/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <input
                                type="checkbox"
                                checked={selectedPeriods.includes(p.period)}
                                onChange={() => handlePeriodChange(p.period)}
                                className="h-4 w-4 rounded text-primary focus:ring-primary-dark"
                            />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                P{p.period} ({formatTime12h(p.startTime)})
                            </span>
                        </label>
                    ))}
                    {availablePeriods.length === 0 && date === todayStr && (
                        <p className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-4">No available time slots left for today.</p>
                    )}
                </div>
            )}
             {(mode === 'edit' || mode === 'override') && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Multi-period editing/overriding is not supported. Please create a new booking for multiple slots.</p>}
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-between items-center pt-4">
            <div>
              {mode === 'edit' && bookingToEdit && isEditable && (
                  <button type="button" onClick={() => onDelete(bookingToEdit._id)} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 flex items-center space-x-2">
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete Booking</span>
                  </button>
              )}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
              {isEditable &&
                <button type="submit" disabled={loading || (currentUser.role === UserRole.Faculty && mode !== 'edit')} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 disabled:bg-gray-500 w-40 text-center">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Spinner size="sm" color="text-white" />
                      <span className="ml-2">Saving...</span>
                    </span>
                  ) : (saveButtonText[mode])}
                </button>
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};