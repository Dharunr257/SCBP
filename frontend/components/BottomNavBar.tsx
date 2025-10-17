import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole } from '../types';
import { 
    DashboardIcon, CalendarIcon, RoomIcon, ReportsIcon, HistoryIcon, 
    UserGroupIcon, SettingsIcon, BellIcon, MoreHorizontalIcon, CloseIcon, ClipboardListIcon 
} from './Icons';

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
    { name: 'My Waitlist', icon: ClipboardListIcon },
    { name: 'Rooms', viewName: 'Room Management', icon: RoomIcon, condition: (user) => [UserRole.Principal, UserRole.Dean].includes(user.role) },
    { name: 'Users', viewName: 'User Management', icon: UserGroupIcon, condition: (user) => [UserRole.Principal, UserRole.Dean].includes(user.role) },
    { name: 'History', viewName: 'History Logs', icon: HistoryIcon, condition: (user) => [UserRole.Principal, UserRole.Dean, UserRole.HOD].includes(user.role) },
    { name: 'Reports', icon: ReportsIcon, condition: (user) => [UserRole.Principal, UserRole.Dean, UserRole.HOD].includes(user.role) },
    { name: 'Settings', icon: SettingsIcon },
];


const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentUser, activeView, setActiveView }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const handleCloseMoreMenu = () => {
    setIsMoreMenuOpen(false);
  };

  const handleItemClick = (viewName: string) => {
    setActiveView(viewName);
    handleCloseMoreMenu();
  };

  const allFilteredItems = useMemo(() => 
    allNavItems.filter(item => !item.condition || item.condition(currentUser)),
    [currentUser]
  );

  const mainItems = allFilteredItems.length > 6 ? allFilteredItems.slice(0, 5) : allFilteredItems;
  const moreItems = allFilteredItems.length > 6 ? allFilteredItems.slice(5) : [];

  useEffect(() => {
    if (isMoreMenuOpen && moreMenuRef.current) {
        const focusableElements = Array.from(
            moreMenuRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseMoreMenu();
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }
  }, [isMoreMenuOpen]);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border shadow-lg z-30">
        <ul className="flex justify-around items-center h-16">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const viewName = item.viewName || item.name;
            const isActive = activeView === viewName && !isMoreMenuOpen;
            return (
              <li key={item.name} className="flex-1">
                <button
                  onClick={() => handleItemClick(viewName)}
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
          {moreItems.length > 0 && (
             <li className="flex-1">
                <button
                    onClick={() => setIsMoreMenuOpen(prev => !prev)}
                    className={`w-full flex flex-col items-center justify-center h-full transition-colors ${
                        isMoreMenuOpen || moreItems.some(item => activeView === (item.viewName || item.name)) ? 'text-primary dark:text-primary-dark' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-haspopup="true"
                    aria-expanded={isMoreMenuOpen}
                    aria-controls="more-menu"
                >
                    {isMoreMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MoreHorizontalIcon className="h-6 w-6" />}
                    <span className="text-xs font-medium mt-1">More</span>
                </button>
             </li>
          )}
        </ul>
      </nav>

      {/* More Menu Drawer */}
      {moreItems.length > 0 && (
        <>
            <div 
                className={`fixed inset-0 bg-black z-30 transition-opacity duration-300 ease-in-out md:hidden ${
                    isMoreMenuOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
                }`}
                onClick={handleCloseMoreMenu}
                aria-hidden="true"
            ></div>
            <div
                id="more-menu"
                ref={moreMenuRef}
                className={`fixed bottom-16 left-0 right-0 bg-white dark:bg-dark-card z-40 rounded-t-lg shadow-2xl p-4 transition-transform duration-300 ease-in-out md:hidden ${
                    isMoreMenuOpen ? 'transform translate-y-0' : 'transform translate-y-full'
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="more-menu-title"
            >
                <h3 id="more-menu-title" className="text-lg font-bold text-gray-800 dark:text-white mb-4 px-2">More Options</h3>
                <ul className="space-y-2">
                    {moreItems.map(item => {
                        const Icon = item.icon;
                        const viewName = item.viewName || item.name;
                        const isActive = activeView === viewName;
                        return (
                           <li key={item.name}>
                                <button
                                    onClick={() => handleItemClick(viewName)}
                                    className={`w-full text-left flex items-center space-x-4 p-3 rounded-lg font-medium transition-colors ${
                                        isActive ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-dark' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <Icon className="h-6 w-6"/>
                                    <span>{item.name}</span>
                                </button>
                           </li>
                        )
                    })}
                </ul>
            </div>
        </>
      )}
    </>
  );
};

export default BottomNavBar;