

import React from 'react';
import { WaitlistEntry, Classroom, User } from '../types';
import { TrashIcon } from '../components/Icons';
import { formatTime12h } from '../constants';

interface WaitlistProps {
  currentUser: User;
  waitlist: WaitlistEntry[];
  classrooms: Classroom[];
  onRemoveFromWaitlist: (id: string) => void;
}

const Waitlist: React.FC<WaitlistProps> = ({ currentUser, waitlist, classrooms, onRemoveFromWaitlist }) => {
  const userWaitlist = waitlist.filter(w => w.userId === currentUser._id)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const handleLeaveClick = (id: string) => {
    if (window.confirm("Are you sure you want to leave the waitlist for this slot?")) {
      onRemoveFromWaitlist(id);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Waitlisted Slots</h2>
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classroom</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time Slot</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined On</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {userWaitlist.length > 0 ? userWaitlist.map((entry) => {
                const room = classrooms.find(c => c._id === entry.classroomId);
                return (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{room?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatTime12h(entry.startTime)} - {formatTime12h(entry.endTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.timestamp.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleLeaveClick(entry._id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center ml-auto">
                        <TrashIcon className="w-4 h-4 mr-1" /> Leave
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">You are not on any waitlists.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;