
import React, { useState, useEffect } from 'react';
import { Booking, Classroom, User } from '../types';
import { CloseIcon } from './Icons';
import { PERIODS, formatTime12h } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, '_id' | 'status' | 'period' | 'startTime' | 'endTime' | 'createdAt'> & { _id?: string; periods: number[] }, isOverride: boolean) => Promise<boolean>;
  classrooms: Classroom[];
  currentUser: User;
  bookingToEdit?: (Booking & { date: string; startTime: string; endTime: string }) | null;
  initialSlot?: { date: string; startTime: string; classroomId: string };
  isOverriding?: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, classrooms, currentUser, bookingToEdit, initialSlot, isOverriding }) => {
  const [subject, setSubject] = useState('');
  const [classYear, setClassYear] = useState('');
  const [classroomId, setClassroomId] = useState<string>(classrooms.length === 1 ? classrooms[0]._id : '');
  const [date, setDate] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [staffName, setStaffName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  
  const isSingleClassroom = classrooms.length === 1;

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      if (bookingToEdit) {
        setSubject(bookingToEdit.subject);
        setClassYear(bookingToEdit.classYear);
        setClassroomId(bookingToEdit.classroomId);
        setDate(bookingToEdit.date);
        setSelectedPeriods([bookingToEdit.period]);
        setStaffName(bookingToEdit.staffName);
        setContactNo(bookingToEdit.contactNo);
      } else if (initialSlot) {
        setDate(initialSlot.date);
        setClassroomId(initialSlot.classroomId);
        const initialPeriod = PERIODS.find(p => p.startTime === initialSlot.startTime);
        setSelectedPeriods(initialPeriod ? [initialPeriod.period] : []);
        setSubject('');
        setClassYear('');
        setStaffName(currentUser.name);
        setContactNo('');
      } else {
        // Reset form
        const today = new Date().toISOString().split('T')[0];
        setSubject('');
        setClassYear('');
        setClassroomId(isSingleClassroom ? classrooms[0]._id : '');
        setDate(today);
        setSelectedPeriods([]);
        setStaffName(currentUser.name);
        setContactNo('');
      }
      setError('');
    }
  }, [isOpen, bookingToEdit, initialSlot, isSingleClassroom, classrooms, currentUser.name]);

  const handlePeriodChange = (period: number) => {
    setSelectedPeriods(prev => 
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    
    const success = await onSave(newBookingData, !!isOverriding);

    if (success) {
        onClose();
    } else {
        setError('Failed to save booking. The slot might be taken, or an error occurred.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <CloseIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{bookingToEdit ? 'Edit Booking' : 'Create Booking'}</h2>
        
        {isOverriding && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p className="font-bold">Override Warning</p>
                <p>You are about to book a slot that is already taken. This will override the existing booking.</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={currentUser.name} disabled className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
            <input type="text" value={currentUser.department} disabled className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
            <input id="staffName" type="text" placeholder="Staff Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
            <input id="contactNo" type="tel" placeholder="Contact No." value={contactNo} onChange={(e) => setContactNo(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
            <input id="subject" type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
            <input id="classYear" type="text" placeholder="Class Year (e.g., II Year)" value={classYear} onChange={(e) => setClassYear(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
             
            {isSingleClassroom ? (
                 <input type="text" value={classrooms[0].name} disabled className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
            ) : (
                <select id="classroom" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary h-[42px]">
                    <option value="" disabled>Select classroom</option>
                    {classrooms.filter(c => c.status === 'available' || c._id === classroomId).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            )}

            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={todayStr} max={maxDateStr} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periods (Select multiple hours)</label>
            {bookingToEdit ? (
                 <select id="period" value={selectedPeriods[0] || ''} disabled className="mt-1 block w-full border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 rounded-md shadow-sm p-2">
                    <option value={bookingToEdit.period}>Period {bookingToEdit.period} ({formatTime12h(bookingToEdit.startTime)}-{formatTime12h(bookingToEdit.endTime)})</option>
                </select>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border dark:border-gray-600 rounded-lg">
                    {PERIODS.map(p => (
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
                </div>
            )}
             {bookingToEdit && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Multi-period editing is not supported. Please delete and re-create for multiple slots.</p>}
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 disabled:bg-gray-500">{loading ? 'Saving...' : (bookingToEdit ? 'Update' : isOverriding ? 'Override' : 'Book')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};