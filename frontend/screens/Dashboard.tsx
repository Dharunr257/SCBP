import React, { useMemo } from 'react';
import { Booking, User, Classroom, UserRole, WaitlistEntry } from '../types';
import { formatTime12h } from '../constants';

interface DashboardProps {
  currentUser: User;
  bookings: Booking[];
  classrooms: Classroom[];
  waitlist: WaitlistEntry[];
  users: User[];
  onQuickBook: () => void;
  onApproveBooking: (bookingId: string) => void;
  onDeclineBooking: (bookingId: string) => void;
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
            .filter(b => b.createdAt >= twoMonthsAgo && b.status === 'confirmed')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5) // Show top 5 recent for dashboard
            .map((b, index) => {
                const user = users.find(u => u._id === b.userId);
                return {
                    _id: b._id,
                    'S.NO': index + 1,
                    'Staff Name': b.staffName,
                    'Department': user?.department || 'N/A',
                    'Booking On': b.createdAt.toLocaleDateString(),
                    'Class On': new Date(b.date).toLocaleDateString(),
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
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Department']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Booking On']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Class On']}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Period']}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No recent booking records found.</td>
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
    onApprove: (id: string) => void,
    onDecline: (id: string) => void
}> = ({ pendingBookings, users, onApprove, onDecline }) => (
    <DashboardCard title="Pending Booking Approvals" className="lg:col-span-4">
        <div className="space-y-3 max-h-72 overflow-y-auto">
            {pendingBookings.length > 0 ? pendingBookings.map(b => {
                const user = users.find(u => u._id === b.userId);
                return (
                    <div key={b._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{b.subject} ({b.classYear})</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Requested by {user?.name} ({user?.department}) for {new Date(b.date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                             <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">{`P${b.period}`}</span>
                             <button onClick={() => onDecline(b._id)} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-1 px-3 rounded-lg">Decline</button>
                             <button onClick={() => onApprove(b._id)} className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-1 px-3 rounded-lg">Approve</button>
                        </div>
                    </div>
                )
            }) : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No pending approvals.</p>}
        </div>
    </DashboardCard>
);


const Dashboard: React.FC<DashboardProps> = ({ currentUser, bookings, classrooms, waitlist, users, onQuickBook, onApproveBooking, onDeclineBooking }) => {
  const today = new Date();
  today.setHours(0,0,0,0);

  const userBookings = bookings.filter(b => b.userId === currentUser._id && new Date(b.date) >= today && b.status === 'confirmed');
  userBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const userWaitlist = waitlist.filter(w => w.userId === currentUser._id);

  const totalBookings = bookings.filter(b => b.status === 'confirmed').length;
  const availableRooms = classrooms.filter(c => c.status === 'available').length;
  const blockedRooms = classrooms.filter(c => c.status === 'maintenance');
  
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending').sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime()), [bookings]);

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
            {[UserRole.Principal, UserRole.Dean].includes(currentUser.role) && (
                <>
                    <ApprovalDashboard pendingBookings={pendingBookings} users={users} onApprove={onApproveBooking} onDecline={onDeclineBooking} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard title="System Stats">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Bookings</span><span className="font-bold text-2xl text-primary dark:text-primary-dark">{totalBookings}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Your Bookings</span><span className="font-bold text-2xl text-secondary dark:text-secondary-dark">{userBookings.length}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Users</span><span className="font-bold text-2xl text-yellow-500">{users.length}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Available Rooms</span><span className="font-bold text-2xl text-green-500">{availableRooms}</span></div>
                            </div>
                        </DashboardCard>
                        
                        <DashboardCard title="Blocked Rooms" className="lg:col-span-1">
                           <div className="space-y-2 max-h-48 overflow-y-auto">
                                {blockedRooms.length > 0 ? (
                                    blockedRooms.map(r => ( <div key={r._id} className="p-2 bg-red-100 dark:bg-red-900/50 rounded-md text-center"><p className="font-semibold text-red-800 dark:text-red-300 text-sm truncate">{r.name}</p></div>))
                                ) : <p className="text-gray-500 dark:text-gray-400 text-center pt-12">No rooms are currently blocked.</p>}
                            </div>
                        </DashboardCard>

                        <DashboardCard title="Upcoming Bookings" className="lg:col-span-2">
                           <div className="space-y-3 max-h-48 overflow-y-auto">
                                {userBookings.length > 0 ? userBookings.slice(0, 5).map(b => {
                                    const room = classrooms.find(c => c._id === b.classroomId);
                                    return (
                                        <div key={b._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center">
                                            <div><p className="font-semibold text-gray-800 dark:text-gray-200">{b.subject} ({b.classYear})</p><p className="text-sm text-gray-500 dark:text-gray-400">{room?.name} on {new Date(b.date).toLocaleDateString()}</p></div>
                                            <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                                        </div>
                                    )
                                }) : <p className="text-gray-500 dark:text-gray-400">You have no upcoming bookings.</p>}
                            </div>
                        </DashboardCard>
                    </div>
                    <BookingRecordDetailsCard bookings={bookings} users={users} currentUser={currentUser} />
                </>
            )}

            {currentUser.role === UserRole.HOD && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard title="System Stats">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Bookings</span><span className="font-bold text-2xl text-primary dark:text-primary-dark">{totalBookings}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Your Bookings</span><span className="font-bold text-2xl text-secondary dark:text-secondary-dark">{userBookings.length}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Users</span><span className="font-bold text-2xl text-yellow-500">{users.length}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Available Rooms</span><span className="font-bold text-2xl text-green-500">{availableRooms}</span></div>
                            </div>
                        </DashboardCard>
                         <DashboardCard title="Quick Actions">
                            <button onClick={onQuickBook} className="w-full bg-primary dark:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors text-lg">
                                Book a Slot
                            </button>
                        </DashboardCard>
                        <DashboardCard title="Upcoming Bookings" className="lg:col-span-2">
                             <div className="space-y-3 max-h-48 overflow-y-auto">
                                {userBookings.length > 0 ? userBookings.slice(0, 5).map(b => {
                                    const room = classrooms.find(c => c._id === b.classroomId);
                                    return (
                                        <div key={b._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center">
                                            <div><p className="font-semibold text-gray-800 dark:text-gray-200">{b.subject} ({b.classYear})</p><p className="text-sm text-gray-500 dark:text-gray-400">{room?.name} on {new Date(b.date).toLocaleDateString()}</p></div>
                                            <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                                        </div>
                                    )
                                }) : <p className="text-gray-500 dark:text-gray-400">You have no upcoming bookings.</p>}
                            </div>
                        </DashboardCard>
                         {userWaitlist.length > 0 && (
                            <DashboardCard title="My Waitlisted Slots" className="lg:col-span-4">
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {userWaitlist.map(w => {
                                        const room = classrooms.find(c => c._id === w.classroomId);
                                        return (<div key={w._id} className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-md flex justify-between items-center"><div><p className="font-semibold text-orange-800 dark:text-orange-200">{room?.name}</p><p className="text-sm text-orange-600 dark:text-orange-400">On {new Date(w.date).toLocaleDateString()}</p></div><span className="font-mono text-sm bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200 px-2 py-1 rounded">{formatTime12h(w.startTime)} - {formatTime12h(w.endTime)}</span></div>)
                                    })}
                                </div>
                            </DashboardCard>
                        )}
                    </div>
                    <BookingRecordDetailsCard bookings={bookings} users={users} currentUser={currentUser} />
                </>
            )}

            {currentUser.role === UserRole.Faculty && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard title="System Stats">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Bookings</span><span className="font-bold text-2xl text-primary dark:text-primary-dark">{totalBookings}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Total Users</span><span className="font-bold text-2xl text-yellow-500">{users.length}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-400">Available Rooms</span><span className="font-bold text-2xl text-green-500">{availableRooms}</span></div>
                        </div>
                    </DashboardCard>
                    <DashboardCard title="Upcoming Bookings" className="lg:col-span-3">
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {userBookings.length > 0 ? userBookings.slice(0, 5).map(b => {
                                const room = classrooms.find(c => c._id === b.classroomId);
                                return (
                                    <div key={b._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center">
                                        <div><p className="font-semibold text-gray-800 dark:text-gray-200">{b.subject} ({b.classYear})</p><p className="text-sm text-gray-500 dark:text-gray-400">{room?.name} on {new Date(b.date).toLocaleDateString()}</p></div>
                                        <span className="font-mono text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                                    </div>
                                )
                            }) : <p className="text-gray-500 dark:text-gray-400">No bookings are assigned to this general account.</p>}
                        </div>
                    </DashboardCard>
                </div>
            )}
      </div>
    </div>
  );
};

export default Dashboard;