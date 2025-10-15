

import React, { useMemo, useState } from 'react';
import { Booking, User, Classroom, UserRole, WaitlistEntry } from '../types';
import { formatTime12h } from '../constants';
import { Spinner } from '../components/Spinner';

interface DashboardProps {
  currentUser: User;
  bookings: Booking[];
  classrooms: Classroom[];
  waitlist: WaitlistEntry[];
  users: User[];
  onQuickBook: () => void;
  // FIX: onApproveBooking and onDeclineBooking are async functions, so their types must be updated to return a Promise.
  onApproveBooking: (bookingId: string) => Promise<void>;
  onDeclineBooking: (bookingId: string) => Promise<void>;
  isApprovalEnabled: boolean;
}

const DashboardCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-dark-card rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        {children}
    </div>
);

const BookingRecordDetailsCard: React.FC<{ bookings: Booking[], users: User[], currentUser: User }> = ({ bookings, users, currentUser }) => {
    const bookingRecords = useMemo(() => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        let records = bookings;

        if (currentUser.role === UserRole.HOD) {
            records = records.filter(b => {
                const user = users.find(u => u._id === b.userId);
                return user?.department === currentUser.department;
            });
        }

        return records
            .filter(b => new Date(b.createdAt) >= twoMonthsAgo && b.status === 'completed')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5) // Show top 5 recent for dashboard
            .map((b, index) => {
                const user = users.find(u => u._id === b.userId);
                const [y, m, d] = b.date.split('-').map(Number);
                const classDate = new Date(y, m - 1, d);
                return {
                    _id: b._id,
                    'S.NO': index + 1,
                    'Staff Name': b.staffName,
                    'Subject': b.subject,
                    'Department': user?.department || 'N/A',
                    'Booking On': new Date(b.createdAt).toLocaleDateString(),
                    'Class On': classDate.toLocaleDateString(),
                    'Period': b.period,
                };
            });
    }, [bookings, users, currentUser]);

    return (
        <DashboardCard title={currentUser.role === UserRole.HOD ? "Department Booking Records (Last 2 Months)" : "Booking Record Details (Last 2 Months)"} className="lg:col-span-4">
            <div className="overflow-x-auto max-h-72">
                 <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">S.No</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Staff Name</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Booked On</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class Date</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                        {bookingRecords.length > 0 ? bookingRecords.map(record => (
                            <tr key={record._id}>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['S.NO']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Staff Name']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Subject']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Department']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Booking On']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Class On']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Period']}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">No recent booking records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardCard>
    );
};

const ApprovalDashboard: React.FC<{
    pendingBookings: Booking[],
    users: User[],
    onApprove: (id: string) => Promise<void>,
    onDecline: (id: string) => Promise<void>
}> = ({ pendingBookings, users, onApprove, onDecline }) => {
    const [loadingAction, setLoadingAction] = useState<{type: 'approve' | 'decline', id: string} | null>(null);

    const handleApprove = async (id: string) => {
        setLoadingAction({ type: 'approve', id });
        await onApprove(id);
        setLoadingAction(null);
    }

    const handleDecline = async (id: string) => {
        setLoadingAction({ type: 'decline', id });
        await onDecline(id);
        setLoadingAction(null);
    }
    
    return (
        <DashboardCard title="Pending Booking Approvals" className="lg:col-span-4">
            <div className="space-y-3 max-h-72 overflow-y-auto">
                {pendingBookings.length > 0 ? pendingBookings.map(b => {
                    const user = users.find(u => u._id === b.userId);
                    const isLoading = loadingAction?.id === b._id;
                    const [y, m, d] = b.date.split('-').map(Number);
                    const classDate = new Date(y, m - 1, d);
                    return (
                        <div key={b._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{b.subject} ({b.classYear})</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Requested by {user?.name} ({user?.department}) for {classDate.toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                                 <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">{`P${b.period}`}</span>
                                 <button onClick={() => handleDecline(b._id)} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-1 px-3 rounded-lg w-20 h-6 flex items-center justify-center disabled:bg-gray-400">
                                    {isLoading && loadingAction?.type === 'decline' ? <Spinner size="sm" color="text-white"/> : 'Decline'}
                                 </button>
                                 <button onClick={() => handleApprove(b._id)} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-1 px-3 rounded-lg w-20 h-6 flex items-center justify-center disabled:bg-gray-400">
                                    {isLoading && loadingAction?.type === 'approve' ? <Spinner size="sm" color="text-white"/> : 'Approve'}
                                 </button>
                            </div>
                        </div>
                    )
                }) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No pending approvals.</p>}
            </div>
        </DashboardCard>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ currentUser, bookings, classrooms, users, onQuickBook, onApproveBooking, onDeclineBooking, isApprovalEnabled }) => {
  const today = new Date();
  today.setHours(0,0,0,0);

  const userBookings = bookings.filter(b => {
    const [y,m,d] = b.date.split('-').map(Number);
    const bookingDate = new Date(y, m - 1, d);
    return b.userId === currentUser._id && bookingDate >= today && ['confirmed', 'pending'].includes(b.status);
  });
  userBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const totalBookings = bookings.filter(b => b.status === 'confirmed').length;
  const availableRooms = classrooms.filter(c => c.status === 'available').length;
  
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending').sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [bookings]);

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome back, {currentUser.name}!</h2>
        {currentUser.role !== UserRole.Faculty &&
            <button onClick={onQuickBook} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors hidden sm:block">
                Book a Slot
            </button>
        }
      </div>

      <div className="space-y-6">
            { isApprovalEnabled && currentUser.isIqacDean && (
                 <ApprovalDashboard pendingBookings={pendingBookings} users={users} onApprove={onApproveBooking} onDecline={onDeclineBooking} />
            )}
            
            {currentUser.role === UserRole.Principal && (
                 <BookingRecordDetailsCard bookings={bookings} users={users} currentUser={currentUser} />
            )}

            {[UserRole.Dean, UserRole.HOD, UserRole.Faculty].includes(currentUser.role) && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard title="System Stats">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Confirmed</span><span className="font-bold text-2xl text-primary dark:text-primary-dark">{totalBookings}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">My Bookings</span><span className="font-bold text-2xl text-secondary dark:text-secondary-dark">{userBookings.length}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Available Rooms</span><span className="font-bold text-2xl text-green-500">{availableRooms}</span></div>
                        </div>
                    </DashboardCard>

                    <DashboardCard title="Upcoming/Pending Bookings" className="lg:col-span-3">
                       <div className="space-y-3 max-h-48 overflow-y-auto">
                            {userBookings.length > 0 ? userBookings.slice(0, 5).map(b => {
                                const room = classrooms.find(c => c._id === b.classroomId);
                                const isPending = b.status === 'pending';
                                const [y, m, d] = b.date.split('-').map(Number);
                                const classDate = new Date(y, m - 1, d);
                                return (
                                    <div key={b._id} className={`p-3 rounded-md flex justify-between items-center ${isPending ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                        <div>
                                            <p className={`font-semibold ${isPending ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-800 dark:text-gray-200'}`}>{b.subject} ({b.classYear})</p>
                                            <p className={`text-sm ${isPending ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>{room?.name} on {classDate.toLocaleDateString()}</p>
                                        </div>
                                        <div className='flex items-center space-x-2'>
                                            {isPending && <span className="font-bold text-xs text-yellow-800 dark:text-yellow-200 uppercase">Pending</span>}
                                            <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">{formatTime12h(b.startTime)}</span>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">You have no upcoming bookings or pending requests.</p>}
                        </div>
                    </DashboardCard>
                </div>
            )}
      </div>
    </div>
  );
};

export default Dashboard;