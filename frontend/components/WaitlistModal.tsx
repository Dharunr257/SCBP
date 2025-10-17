import React, { useState, useEffect } from 'react';
import { User, WaitlistEntry } from '../types';
import { CloseIcon } from './Icons';
import { Spinner } from './Spinner';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (waitlistData: Omit<WaitlistEntry, '_id' | 'userId' | 'timestamp'>) => Promise<boolean>;
  currentUser: User;
  initialSlot: { date: string; period: number; classroomId: string; } | null;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, onSave, currentUser, initialSlot }) => {
  const [subject, setSubject] = useState('');
  const [classYear, setClassYear] = useState('');
  const [staffName, setStaffName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError('');
      setSubject('');
      setClassYear('');
      setStaffName(currentUser.name);
      setContactNo('');
    }
  }, [isOpen, currentUser.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !classYear || !staffName || !contactNo || !initialSlot) {
      setError('All fields are required.');
      return;
    }
    
    setLoading(true);
    setError('');

    const waitlistData = {
      ...initialSlot,
      subject,
      classYear,
      staffName,
      contactNo,
    };
    
    const success = await onSave(waitlistData);
    if (!success) {
        setError('Failed to join waitlist. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start md:items-center z-50 p-4 pt-12 md:p-0">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <CloseIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Join Waitlist</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This slot is currently occupied. Join the waitlist, and you'll be notified if it becomes available.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input id="staffName" type="text" placeholder="Staff Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
            <input id="contactNo" type="tel" placeholder="Contact No." value={contactNo} onChange={(e) => setContactNo(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
            <input id="subject" type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" />
            <div>
              <label htmlFor="classYear" className="sr-only">Class Year</label>
              <select
                id="classYear"
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary h-[42px]"
              >
                <option value="" disabled>Select Class Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end items-center pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-500 w-40 text-center h-10 flex items-center justify-center">
              {loading ? (
                <span className="flex items-center justify-center">
                  <Spinner size="sm" color="text-white" />
                  <span className="ml-2">Joining...</span>
                </span>
              ) : 'Join Waitlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaitlistModal;