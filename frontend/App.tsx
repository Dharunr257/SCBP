
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { axiosInstance } from './utils/axios';

// Import types
import { User, UserRole, Booking, Classroom, WaitlistEntry, RoomBlock, HistoryLog, Setting, Notification as AppNotification } from './types';
import { PERIODS } from './constants';

// Import components and screens
import LoginScreen from './screens/LoginScreen';
import { Header } from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import Dashboard from './screens/Dashboard';
import BookingCalendar from './screens/BookingCalendar';
import RoomManagement from './screens/RoomManagement';
import UserManagement from './screens/UserManagement';
import Reports from './screens/Reports';
import { HistoryLogs } from './screens/HistoryLogs';
import Settings from './screens/Settings';
import Waitlist from './screens/Waitlist';
import ApprovalRequests from './screens/ApprovalRequests';
import { BookingModal } from './components/BookingModal';
import NotificationCenter from './components/Notification';
import { Spinner } from './components/Spinner';

interface ToastNotification extends Omit<AppNotification, '_id' | 'timestamp' | 'read' | 'userId'> {
    id: number;
}

type Theme = 'light' | 'dark';

const App: React.FC = () => {
    // State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState<Theme>('light');

    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
    const [settings, setSettings] = useState<Setting[]>([]);

    // Modal states
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<(Booking & { date: string; startTime: string; endTime: string; }) | null>(null);
    const [initialSlot, setInitialSlot] = useState<{ date: string; startTime: string; classroomId: string } | undefined>(undefined);
    const [isOverriding, setIsOverriding] = useState(false);

    const isApprovalEnabled = useMemo(() => settings.find(s => s.key === 'deanApprovalRequired')?.value === 'true', [settings]);
    
    // Theme logic
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const showToast = useCallback((message: string, type: 'success' | 'info' | 'error') => {
        const newToast: ToastNotification = { id: Date.now(), message, type };
        setToastNotifications(prev => [...prev, newToast]);
        setTimeout(() => {
            setToastNotifications(prev => prev.filter(t => t.id !== newToast.id));
        }, 5000);
    }, []);
    
    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('token');
        setActiveView('Dashboard');
        showToast('You have been logged out.', 'info');
    }, [showToast]);
    
    const fetchAllData = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get('/data/all');
            setUsers(data.users);
            setClassrooms(data.classrooms);
            setBookings(data.bookings);
            setWaitlist(data.waitlist);
            setRoomBlocks(data.roomBlocks);
            setHistoryLogs(data.historyLogs);
            setNotifications(data.notifications);
            setSettings(data.settings);
        } catch (error: any) {
            console.error("Failed to fetch data:", error);
            const message = error.response?.data?.message || 'Failed to load application data.';
            showToast(message, 'error');
        }
    }, [showToast]);

    // Auth logic
    useEffect(() => {
        const responseInterceptor = axiosInstance.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );

        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data: user } = await axiosInstance.get('/auth/me');
                    setCurrentUser(user);
                    await fetchAllData();
                } catch (error) {
                    console.error("Login check failed", error);
                }
            }
            setIsLoading(false);
        };
        
        checkLoggedIn();

        return () => {
            axiosInstance.interceptors.response.eject(responseInterceptor);
        };
    }, [fetchAllData, handleLogout]);
    
    const handleLogin = async (email: string, password: string) => {
        setLoginError(null);
        try {
            const { data } = await axiosInstance.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            const { token, ...user } = data;
            setCurrentUser(user);
            await fetchAllData();
            showToast('Login successful!', 'success');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Invalid email or password.';
            setLoginError(message);
            showToast('Login failed.', 'error');
        }
    };
    
    // Data modification handlers
    const handleSaveBooking = async (bookingData: Omit<Booking, '_id' | 'status' | 'period' | 'startTime' | 'endTime' | 'createdAt'> & { _id?: string; periods: number[] }, isOverride: boolean): Promise<boolean> => {
        if (!currentUser) return false;
        
        try {
            if (bookingData._id) { // Editing
                const periodInfo = PERIODS.find(p => p.period === bookingData.periods[0]);
                if (!periodInfo) return false;
                const payload = { ...bookingData, period: bookingData.periods[0], startTime: periodInfo.startTime, endTime: periodInfo.endTime };
                await axiosInstance.post(`/bookings`, payload);
                showToast('Booking updated successfully!', 'success');
            } else { // Creating
                const newBookingPayloads = bookingData.periods.map(period => {
                    const periodInfo = PERIODS.find(p => p.period === period);
                    return {
                        ...bookingData,
                        userId: currentUser._id,
                        period,
                        startTime: periodInfo?.startTime || "00:00",
                        endTime: periodInfo?.endTime || "00:00",
                    }
                });
                const { data: newBookings } = await axiosInstance.post('/bookings', { bookings: newBookingPayloads });
                const isPending = newBookings[0]?.status === 'pending';
                showToast(isPending ? 'Booking request sent for approval!' : `Successfully created ${newBookings.length} booking(s)!`, isPending ? 'info' : 'success');
            }
            
            await fetchAllData();
            setIsBookingModalOpen(false);
            setBookingToEdit(null);
            setInitialSlot(undefined);
            setIsOverriding(false);
            return true;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save booking.';
            showToast(message, 'error');
            return false;
        }
    };
    
    const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
        try {
            const { data } = await axiosInstance.put('/users/password', { currentPassword, newPassword });
            await fetchAllData();
            return { success: true, message: data.message };
        } catch (error: any) {
            const message = error.response?.data?.message || 'An error occurred.';
            return { success: false, message };
        }
    };
    
    const handleUpdateProfile = async (userData: { name: string; email: string; }): Promise<{ success: boolean; message: string; }> => {
        try {
            const { data: updatedUser } = await axiosInstance.put('/users/profile', userData);
            setCurrentUser(updatedUser);
            await fetchAllData();
            return { success: true, message: 'Profile updated successfully!' };
        } catch (error: any) {
            const message = error.response?.data?.message || 'An error occurred.';
            return { success: false, message };
        }
    };

    const handleDeleteBooking = async (bookingId: string) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await axiosInstance.delete(`/bookings/${bookingId}`);
                await fetchAllData();
                showToast('Booking deleted!', 'success');
            } catch (error: any) {
                const message = error.response?.data?.message || 'Failed to delete booking.';
                showToast(message, 'error');
            }
        }
    };

    const handleApproveBooking = async (bookingId: string) => {
        if (window.confirm('Are you sure you want to APPROVE this booking? This may reject other pending requests for the same slot.')) {
            try {
                await axiosInstance.put(`/bookings/${bookingId}/status`, { status: 'confirmed' });
                await fetchAllData();
                showToast('Booking approved!', 'success');
            } catch(e: any) { 
                const message = e.response?.data?.message || 'Failed to approve booking';
                showToast(message, 'error');
            }
        }
    };

    const handleDeclineBooking = async (bookingId: string) => {
         if (window.confirm('Are you sure you want to DECLINE this booking request?')) {
            try {
                await axiosInstance.put(`/bookings/${bookingId}/status`, { status: 'declined' });
                await fetchAllData();
                showToast('Booking declined!', 'info');
            } catch(e: any) { 
                const message = e.response?.data?.message || 'Failed to decline booking';
                showToast(message, 'error');
            }
        }
    };
    
    const handleAddClassroom = async (name: string) => {
        try {
            await axiosInstance.post('/classrooms', { name });
            await fetchAllData();
            showToast(`Classroom "${name}" added successfully.`, 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to add classroom.';
            showToast(message, 'error');
        }
    };
    
    const handleDeleteClassroom = async (classroomId: string) => {
        try {
            await axiosInstance.delete(`/classrooms/${classroomId}`);
            await fetchAllData();
            showToast('Classroom removed successfully.', 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to remove classroom.';
            showToast(message, 'error');
        }
    };

    const handleUpdateClassroom = async (classroom: Classroom) => {
        try {
            await axiosInstance.put(`/classrooms/${classroom._id}`, { status: classroom.status });
            await fetchAllData();
            showToast(`Classroom ${classroom.name} status updated.`, 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to update classroom';
            showToast(message, 'error');
        }
    };

    const handleAddBlock = async (blockData: Omit<RoomBlock, '_id' | 'userId'>) => {
        try {
            await axiosInstance.post('/classrooms/blocks', blockData);
            await fetchAllData();
            showToast('Room blocked successfully.', 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to block room.';
            showToast(message, 'error');
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        try {
            await axiosInstance.delete(`/classrooms/blocks/${blockId}`);
            await fetchAllData();
            showToast('Room block removed.', 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to remove block.';
            showToast(message, 'error');
        }
    };

    const handleAddUser = async (userData: Omit<User, '_id' | 'password'>) => {
        try {
            await axiosInstance.post('/users', { ...userData, password: 'password123' });
            await fetchAllData();
            showToast('User added successfully!', 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to add user.';
            showToast(message, 'error');
        }
    };

    const handleUpdateUser = async (user: User) => {
        try {
            await axiosInstance.put(`/users/${user._id}`, user);
            await fetchAllData();
            showToast('User updated successfully!', 'success');
        } catch(e: any) { 
            const message = e.response?.data?.message || 'Failed to update user.';
            showToast(message, 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
       try {
           await axiosInstance.delete(`/users/${userId}`);
           await fetchAllData();
           showToast('User deleted successfully!', 'success');
       } catch(e: any) { 
           const message = e.response?.data?.message || 'Failed to delete user.';
           showToast(message, 'error');
       }
    };
    
    const handleUpdateSetting = async (key: string, value: string) => {
        try {
            await axiosInstance.put(`/settings/${key}`, { value });
            await fetchAllData();
            showToast('Settings updated successfully!', 'success');
        } catch(e: any) {
            const message = e.response?.data?.message || 'Failed to update setting.';
            showToast(message, 'error');
        }
    };


    // UI handlers
    const handleOpenBookingModal = (slot?: { date: string, startTime: string, classroomId: string }) => {
        setInitialSlot(slot);
        setBookingToEdit(null);
        setIsOverriding(false);
        setIsBookingModalOpen(true);
    };

    const handleEditBooking = (booking: Booking) => {
        const fullBooking = {
            ...booking,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
        };
        setBookingToEdit(fullBooking);
        setInitialSlot(undefined);
        setIsOverriding(false);
        setIsBookingModalOpen(true);
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
                <Spinner size="lg" />
            </div>
        );
    }
    
    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} error={loginError} />;
    }

    const unreadNotifications = notifications.filter(n => !n.read);

    const renderActiveView = () => {
        switch (activeView) {
            case 'Dashboard':
                return <Dashboard 
                            currentUser={currentUser} 
                            bookings={bookings} 
                            classrooms={classrooms} 
                            waitlist={waitlist} 
                            users={users} 
                            onQuickBook={handleOpenBookingModal}
                            onApproveBooking={handleApproveBooking}
                            onDeclineBooking={handleDeclineBooking}
                            isApprovalEnabled={isApprovalEnabled}
                        />;
            case 'Bookings':
                return <BookingCalendar 
                    currentUser={currentUser}
                    bookings={bookings}
                    classrooms={classrooms}
                    waitlist={waitlist}
                    users={users}
                    roomBlocks={roomBlocks}
                    onBookSlot={handleOpenBookingModal}
                    onEditBooking={handleEditBooking}
                    onDeleteBooking={handleDeleteBooking}
                />;
             case 'Approval Requests':
                return <ApprovalRequests
                    currentUser={currentUser}
                    bookings={bookings}
                    classrooms={classrooms}
                    users={users}
                    onApproveBooking={handleApproveBooking}
                    onDeclineBooking={handleDeclineBooking}
                />;
            case 'Room Management':
                return <RoomManagement 
                    currentUser={currentUser}
                    classrooms={classrooms}
                    roomBlocks={roomBlocks}
                    users={users}
                    onUpdateClassroom={handleUpdateClassroom}
                    onAddBlock={handleAddBlock}
                    onDeleteBlock={handleDeleteBlock}
                    onAddClassroom={handleAddClassroom}
                    onDeleteClassroom={handleDeleteClassroom}
                />;
            case 'User Management':
                return <UserManagement 
                    currentUser={currentUser}
                    users={users}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                />;
            case 'Reports':
                return <Reports 
                    bookings={bookings}
                    users={users}
                    classrooms={classrooms}
                    currentUser={currentUser}
                />;
            case 'History Logs':
                return <HistoryLogs logs={historyLogs} />;
            case 'Settings':
                return <Settings 
                    currentUser={currentUser} 
                    onChangePassword={handleChangePassword}
                    onUpdateProfile={handleUpdateProfile}
                    settings={settings}
                    onUpdateSetting={handleUpdateSetting}
                />;
            default:
                return <Dashboard 
                            currentUser={currentUser} 
                            bookings={bookings} 
                            classrooms={classrooms} 
                            waitlist={waitlist} 
                            users={users} 
                            onQuickBook={handleOpenBookingModal}
                            onApproveBooking={handleApproveBooking}
                            onDeclineBooking={handleDeclineBooking}
                            isApprovalEnabled={isApprovalEnabled}
                        />;
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-gray-100">
            <Sidebar 
                currentUser={currentUser}
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed}
            />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <Header 
                    user={currentUser} 
                    onLogout={handleLogout}
                    onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
                    notifications={notifications}
                    unreadCount={unreadNotifications.length}
                    onMarkNotificationsAsRead={() => {}}
                    theme={theme}
                    onThemeToggle={handleThemeToggle}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
                    {renderActiveView()}
                </main>
                <BottomNavBar 
                    currentUser={currentUser}
                    activeView={activeView}
                    setActiveView={setActiveView}
                />
            </div>
            {isBookingModalOpen && (
                <BookingModal 
                    isOpen={isBookingModalOpen}
                    onClose={() => {
                        setIsBookingModalOpen(false);
                        setBookingToEdit(null);
                        setInitialSlot(undefined);
                    }}
                    onSave={handleSaveBooking}
                    classrooms={classrooms}
                    currentUser={currentUser}
                    bookingToEdit={bookingToEdit}
                    initialSlot={initialSlot}
                    isOverriding={isOverriding}
                    isApprovalEnabled={isApprovalEnabled}
                    users={users}
                />
            )}
            <NotificationCenter notifications={toastNotifications} />
        </div>
    );
};

export default App;
