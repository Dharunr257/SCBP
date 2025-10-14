
export enum UserRole {
  Principal = "Principal",
  Dean = "Dean",
  HOD = "HOD",
  Faculty = "Faculty",
}

export interface User {
  _id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  password?: string; // Password should not always be sent to frontend
  isIqacDean?: boolean;
}

export enum BookingStatus {
  Available = "available",
  Booked = "booked",
  Blocked = "blocked",
  Waitlist = "waitlist",
}

export interface Classroom {
  _id: string;
  name: string;
  status: 'available' | 'maintenance';
}

export interface Booking {
  _id: string;
  userId: string;
  classroomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  subject: string;
  classYear: string;
  status: 'confirmed' | 'cancelled' | 'overridden' | 'pending' | 'declined';
  staffName: string;
  contactNo: string;
  period: number;
  createdAt: Date;
}

export interface WaitlistEntry {
  _id: string;
  userId: string;
  classroomId: string;
  date: string;
  startTime: string;
  endTime: string;
  timestamp: Date;
}

export interface RoomBlock {
  _id: string;
  userId: string;
  classroomId: string;
  date: string; // YYYY-MM-DD
  periods: number[];
  reason: string;
}

export enum LogAction {
  Created = "Created",
  Edited = "Edited",
  Deleted = "Deleted",
  Overridden = "Overridden",
  BookingApproved = "Booking Approved",
  BookingDeclined = "Booking Declined",
  RoomBlocked = "Room Blocked",
  RoomUnblocked = "Room Unblocked",
  RoomAdded = "Room Added",
  RoomRemoved = "Room Removed",
  WaitlistJoined = "Joined Waitlist",
  WaitlistLeft = "Left Waitlist",
  UserAdded = "User Added",
  UserEdited = "User Edited",
  UserDeleted = "User Deleted",
  MaintenanceSet = "Maintenance Set",
  MaintenanceCleared = "Maintenance Cleared",
  PasswordChanged = "Password Changed",
}

export interface HistoryLog {
  _id: string;
  timestamp: Date;
  user: string;
  department: string;
  action: LogAction;
  details: string;
}

export interface Notification {
  _id: string;
  userId: string; 
  message: string;
  type: 'success' | 'info' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface Setting {
    key: string;
    value: string;
}