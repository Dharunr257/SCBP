

import React from 'react';
import { Notification } from '../types';

// FIX: Omit the '_id' field from the base Notification type as it's not present in toast notifications.
interface ToastNotification extends Omit<Notification, '_id' | 'timestamp' | 'read' | 'userId'> {
    id: number; // Keep a temporary numeric ID for toasts
}

interface ToastNotificationCenterProps {
  notifications: ToastNotification[];
}

const NotificationCenter: React.FC<ToastNotificationCenterProps> = ({ notifications }) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
    }
  };

  const getColor = (type: Notification['type']) => {
     switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
    }
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow-lg ${getColor(notif.type)}`}
          role="alert"
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-white/20">
            {getIcon(notif.type)}
          </div>
          <div className="ml-3 text-sm font-normal">{notif.message}</div>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;