
import React, { useMemo, useState } from 'react';
import { Booking, Classroom, User, UserRole } from '../types';
import { formatTime12h, PERIODS } from '../constants';
import { Spinner } from '../components/Spinner';

interface ApprovalRequestsProps {
    currentUser: User;
    bookings: Booking[];
    classrooms: Classroom[];
    users: User[];
    // FIX: onApproveBooking and onDeclineBooking are async functions, so their types must be updated to return a Promise to allow 'await'.
    onApproveBooking: (bookingId: string) => Promise<void>;
    onDeclineBooking: (bookingId: string) => Promise<void>;
}

const ApprovalRequests: React.FC<ApprovalRequestsProps> = ({ currentUser, bookings, classrooms, users, onApproveBooking, onDeclineBooking }) => {
    const [loadingAction, setLoadingAction] = useState<{type: 'approve' | 'decline', id: string} | null>(null);

    const handleApprove = async (id: string) => {
        setLoadingAction({ type: 'approve', id });
        await onApproveBooking(id);
        setLoadingAction(null);
    }

    const handleDecline = async (id: string) => {
        setLoadingAction({ type: 'decline', id });
        await onDeclineBooking(id);
        setLoadingAction(null);
    }

    const pendingBookings = useMemo(() => {
        return bookings
            .filter(b => b.status === 'pending')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [bookings]);

    const groupedRequests = useMemo(() => {
        const groups: { [key: string]: Booking[] } = {};
        pendingBookings.forEach(booking => {
            const key = `${booking.classroomId}-${booking.date}-${booking.period}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(booking);
        });
        return Object.values(groups);
    }, [pendingBookings]);

    if (!currentUser.isIqacDean) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Approval Requests</h2>

            {groupedRequests.length > 0 ? (
                <div className="space-y-8">
                    {groupedRequests.map((requestGroup, index) => {
                        const firstRequest = requestGroup[0];
                        const classroom = classrooms.find(c => c._id === firstRequest.classroomId);
                        const periodInfo = PERIODS.find(p => p.period === firstRequest.period);

                        return (
                            <div key={index} className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-dark-border">
                                    <h3 className="font-bold text-lg text-primary dark:text-primary-dark">{classroom?.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(firstRequest.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        {' - '}
                                        Period {periodInfo?.period} ({formatTime12h(periodInfo?.startTime || '')})
                                    </p>
                                </div>
                                <div className="divide-y dark:divide-dark-border">
                                    {requestGroup.map(booking => {
                                        const user = users.find(u => u._id === booking.userId);
                                        const isLoading = loadingAction?.id === booking._id;
                                        return (
                                            <div key={booking._id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <div className='flex-grow'>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{booking.subject} ({booking.classYear})</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Requested by: <span className="font-medium">{user?.name}</span> ({user?.department})
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        Staff: {booking.staffName}, Contact: {booking.contactNo}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                                                    <button onClick={() => handleDecline(booking._id)} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors w-24 h-8 flex justify-center items-center disabled:bg-gray-400">
                                                        {isLoading && loadingAction?.type === 'decline' ? <Spinner size="sm" color="text-white" /> : 'Decline'}
                                                    </button>
                                                    <button onClick={() => handleApprove(booking._id)} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors w-24 h-8 flex justify-center items-center disabled:bg-gray-400">
                                                        {isLoading && loadingAction?.type === 'approve' ? <Spinner size="sm" color="text-white" /> : 'Approve'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-dark-card rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">All Clear!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">There are no pending booking requests to review.</p>
                </div>
            )}
        </div>
    );
};

export default ApprovalRequests;