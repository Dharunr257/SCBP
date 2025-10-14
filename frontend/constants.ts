import { UserRole } from './types';

// This data is now seeded into the database via the backend/seed.js script
export const INITIAL_USERS = [];
export const CLASSROOMS = [];
export const BOOKINGS = [];
export const WAITLIST = [];
export const HISTORY_LOGS = [];


export const PERIODS = [
    { period: 1, startTime: '08:45', endTime: '09:35' },
    { period: 2, startTime: '09:35', endTime: '10:25' },
    { period: 3, startTime: '10:35', endTime: '11:25' },
    { period: 4, startTime: '11:25', endTime: '12:45' },
    { period: 5, startTime: '12:45', endTime: '13:35' },
    { period: 6, startTime: '13:35', endTime: '14:25' },
    { period: 7, startTime: '14:35', endTime: '15:25' },
    { period: 8, startTime: '15:25', endTime: '16:15' },
];

export const formatTime12h = (time24: string): string => {
  if (!time24 || !time24.includes(':')) return time24;
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours12}:${paddedMinutes} ${ampm}`;
};

export const TIME_SLOTS = PERIODS.map(p => p.startTime);