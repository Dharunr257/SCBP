import React from 'react';
import { UserRole } from '../types';
import { DashboardIcon, CalendarIcon, RoomIcon, ReportsIcon, HistoryIcon, SettingsIcon, WaitlistIcon, UserGroupIcon } from './Icons';

interface SidebarProps {
  userRole: UserRole;
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
}

const navItems = {
  [UserRole.Principal]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'My Waitlist', icon: WaitlistIcon },
    { name: 'Room Management', icon: RoomIcon },
    { name: 'User Management', icon: UserGroupIcon },
    { name: 'Reports', icon: ReportsIcon },
    { name: 'History Logs', icon: HistoryIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
  [UserRole.Dean]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'My Waitlist', icon: WaitlistIcon },
    { name: 'Room Management', icon: RoomIcon },
    { name: 'User Management', icon: UserGroupIcon },
    { name: 'Reports', icon: ReportsIcon },
    { name: 'History Logs', icon: HistoryIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
  [UserRole.HOD]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'My Waitlist', icon: WaitlistIcon },
    { name: 'Reports', icon: ReportsIcon },
    { name: 'History Logs', icon: HistoryIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
  [UserRole.Faculty]: [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'Settings', icon: SettingsIcon },
  ],
};

const Sidebar: React.FC<SidebarProps> = ({ userRole, activeView, setActiveView, isCollapsed }) => {
  const items = navItems[userRole] || [];

  return (
    <aside className={`bg-gray-50 dark:bg-dark-card p-4 space-y-2 h-full hidden md:flex flex-col dark:border-r dark:border-dark-border transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <nav className="flex-grow">
        <ul>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.name;
            return (
              <li key={item.name} title={isCollapsed ? item.name : undefined}>
                <button
                  onClick={() => setActiveView(item.name)}
                  className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-dark'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="h-6 w-6" />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;