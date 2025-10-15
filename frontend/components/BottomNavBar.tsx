
import React from 'react';
import { User, UserRole } from '../types';
import { DashboardIcon, CalendarIcon, RoomIcon, ReportsIcon, HistoryIcon, UserGroupIcon, SettingsIcon, BellIcon, ClipboardListIcon } from './Icons';

interface BottomNavBarProps {
  currentUser: User;
  activeView: string;
  setActiveView: (view: string) => void;
}

interface NavItem {
  name: string;
  icon: React.FC<{ className?: string }>;
  viewName?: string;
  condition?: (user: User) => boolean;
}

const allNavItems: NavItem[] = [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Approvals', viewName: 'Approval Requests', icon: BellIcon, condition: (user) => !!user.isIqacDean },
    { name: 'Bookings', icon: CalendarIcon },
    { name: 'Rooms', viewName: 'Room Management', icon: RoomIcon, condition: (user) => [UserRole.Principal, UserRole.Dean].includes(user.role) },
    { name: 'Users', viewName: 'User Management', icon: UserGroupIcon, condition: (user) => [UserRole.Principal, UserRole.Dean].includes(user.role) },
    { name: 'History', viewName: 'History Logs', icon: HistoryIcon, condition: (user) => [UserRole.Principal, UserRole.Dean, UserRole.HOD].includes(user.role) },
    { name: 'Reports', icon: ReportsIcon, condition: (user) => [UserRole.Principal, UserRole.Dean, UserRole.HOD].includes(user.role) },
    { name: 'Settings', icon: SettingsIcon },
];


const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentUser, activeView, setActiveView }) => {
  const items = allNavItems.filter(item => !item.condition || item.condition(currentUser));

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
