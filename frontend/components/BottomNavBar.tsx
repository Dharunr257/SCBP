import React from 'react';
import { UserRole } from '../types';
import { DashboardIcon, CalendarIcon, RoomIcon, ReportsIcon, HistoryIcon, UserGroupIcon, SettingsIcon } from './Icons';

interface BottomNavBarProps {
  userRole: UserRole;
  activeView: string;
  setActiveView: (view: string) => void;
}

// Fix: Defined an interface for the navigation items to correctly type the optional 'viewName' property.
interface NavItem {
  name: string;
  icon: React.FC<{ className?: string }>;
  viewName?: string;
}

const navItems: Record<UserRole, NavItem[]> = {
  [UserRole.Principal]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'Rooms', viewName: 'Room Management', icon: RoomIcon },
    { name: 'Users', viewName: 'User Management', icon: UserGroupIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
  [UserRole.Dean]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'Users', viewName: 'User Management', icon: UserGroupIcon },
    { name: 'Reports', icon: ReportsIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
  [UserRole.HOD]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'History', viewName: 'History Logs', icon: HistoryIcon },
    { name: 'Reports', icon: ReportsIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
  [UserRole.Faculty]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ userRole, activeView, setActiveView }) => {
  const items = navItems[userRole] || [];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border shadow-lg z-30">
      <ul className="flex justify-around items-center h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const viewName = item.viewName || item.name;
          const isActive = activeView === viewName;
          return (
            <li key={item.name} className="flex-1">
              <button
                onClick={() => setActiveView(viewName)}
                className={`w-full flex flex-col items-center justify-center h-full transition-colors ${
                  isActive ? 'text-primary dark:text-primary-dark' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium mt-1">{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNavBar;