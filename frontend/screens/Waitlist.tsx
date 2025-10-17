

import React, { useMemo } from 'react';
import { WaitlistEntry, Classroom, User } from '../types';
import { TrashIcon } from '../components/Icons';
import { PERIODS } from '../constants';

interface WaitlistProps {
  currentUser: User;
  waitlist: WaitlistEntry[];
  classrooms: Classroom[];
  onRemoveFromWaitlist: (id: string) => void;
}

const Waitlist: React.FC<WaitlistProps> = ({ currentUser, waitlist, classrooms, onRemoveFromWaitlist }) => {
  const userWaitlist = useMemo(() => {
    const myEntries = waitlist.filter(w => w.userId === currentUser._id);
    
    return myEntries.map(entry => {
      const slotWaitlist = waitlist
        .filter(w => w.classroomId === entry.classroomId && w.date === entry.date && w.period === entry.period)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const position = slotWaitlist.findIndex(w => w._id === entry._id) + 1;
      const total = slotWaitlist.length;
      
      return { ...entry, position, total };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.period - b.period);

  }, [waitlist, currentUser._id]);

  const handleLeaveClick = (id: string) => {
    if (window.confirm("Are you sure you want to leave the waitlist for this slot?")) {
      onRemoveFromWaitlist(id);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Waitlisted Slots</h2>
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md">
        {userWaitlist.length > 0 ? (
          <>
            {/* Mobile View */}
            <div className="md:hidden">
              <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                {userWaitlist.map((entry) => {
                  const room = classrooms.find(c => c._id === entry.classroomId);
                  const periodInfo = PERIODS.find(p => p.period === entry.period);
                  return (
                    <li key={entry._id} className="p-4">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{room?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(entry.date).toLocaleDateString()} - Period {periodInfo?.period}
                            </p>
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-2xl text-primary dark:text-primary-dark">{entry.position}</span>
                            <span className="text-xs block text-gray-500 dark:text-gray-400">/ {entry.total}</span>
                          </div>
                       </div>
                       <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{entry.subject} ({entry.classYear})</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.staffName}</p>
                       </div>
                       <div className="mt-3 flex justify-between items-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Joined: {new Date(entry.timestamp).toLocaleString()}</p>
                          <button onClick={() => handleLeaveClick(entry._id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center font-semibold text-sm">
                            <TrashIcon className="w-4 h-4 mr-1" /> Leave
                          </button>
                       </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* Desktop View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classroom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Slot Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Your Booking Info</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined On</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                  {userWaitlist.map((entry) => {
                    const room = classrooms.find(c => c._id === entry.classroomId);
                    const periodInfo = PERIODS.find(p => p.period === entry.period);
                    return (
                      <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{room?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div>{new Date(entry.date).toLocaleDateString()}</div>
                            <div>Period {periodInfo?.period}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{entry.subject} ({entry.classYear})</div>
                            <div>{entry.staffName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-lg text-primary dark:text-primary-dark">{entry.position}</span>
                            <span className="text-xs"> / {entry.total}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(entry.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => handleLeaveClick(entry._id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center ml-auto font-semibold">
                            <TrashIcon className="w-4 h-4 mr-1" /> Leave
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Not on any Waitlists</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">You can join a waitlist from the main booking calendar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Waitlist;
