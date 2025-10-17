import React, { useState } from 'react';
import { User, Notification } from '../types';
import { CollegeLogo, BellIcon, MenuIcon, CloseIcon, SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkNotificationsAsRead: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const NotificationPanel: React.FC<{ notifications: Notification[], onClose: () => void }> = ({ notifications, onClose }) => {
    return (
        <div className="absolute top-16 right-4 left-4 sm:left-auto sm:w-80 bg-white dark:bg-dark-card rounded-lg shadow-xl border dark:border-dark-border z-50">
            <div className="p-4 border-b dark:border-dark-border flex justify-between items-center">
                <h4 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h4>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <CloseIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div key={notif._id} className="p-4 border-b dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800">
                            <p className={`text-sm ${notif.type === 'error' ? 'text-red-500' : notif.type === 'success' ? 'text-green-500' : 'text-gray-700 dark:text-gray-300'}`}>{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.timestamp.toLocaleString()}</p>
                        </div>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
                )}
            </div>
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar, notifications, unreadCount, onMarkNotificationsAsRead, theme, onThemeToggle }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const handleToggleNotifications = () => {
    setIsNotificationsOpen(prev => !prev);
    if (!isNotificationsOpen && unreadCount > 0) {
      onMarkNotificationsAsRead();
    }
  };

  return (
    <header className="bg-white dark:bg-dark-card shadow-md p-4 flex items-center justify-between z-20 sticky top-0 dark:border-b dark:border-dark-border">
      <div className="flex items-center space-x-4">
        <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 md:block hidden">
            <MenuIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
        </button>
        <CollegeLogo className="h-10 w-10 text-primary dark:text-primary-dark" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden md:block">
          SmartClass Booking
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
        </button>
        <div className="relative">
            <button onClick={handleToggleNotifications} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-dark transition-colors relative">
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isNotificationsOpen && (
                <NotificationPanel notifications={notifications} onClose={() => setIsNotificationsOpen(false)} />
            )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.role} - {user.department}</p>
          </div>
          <button onClick={onLogout} className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};