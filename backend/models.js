
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserRole = ["Principal", "Dean", "HOD", "Faculty"];
const BookingStatus = ['confirmed', 'cancelled', 'overridden', 'pending', 'declined'];
const LogAction = [
    "Created", "Edited", "Deleted", "Overridden", 
    "Booking Approved", "Booking Declined",
    "Room Blocked", "Room Unblocked", "Room Added", "Room Removed", 
    "Joined Waitlist", "Left Waitlist", 
    "User Added", "User Edited", "User Deleted", 
    "Maintenance Set", "Maintenance Cleared", 
    "PasswordChanged"
];

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: UserRole, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isIqacDean: { type: Boolean, default: false },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const classroomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    status: { type: String, enum: ['available', 'maintenance'], required: true },
});

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true }, // HH:MM
    subject: { type: String, required: true },
    classYear: { type: String, required: true },
    status: { type: String, enum: BookingStatus, required: true },
    staffName: { type: String, required: true },
    contactNo: { type: String, required: true },
    period: { type: Number, required: true },
    originalUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'createdAt' } });


const waitlistEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    period: { type: Number, required: true },
    subject: { type: String, required: true },
    classYear: { type: String, required: true },
    staffName: { type: String, required: true },
    contactNo: { type: String, required: true },
}, { timestamps: { createdAt: 'timestamp' } });

const roomBlockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    periods: [{ type: Number }],
    reason: { type: String, required: true },
});

const historyLogSchema = new mongoose.Schema({
    user: { type: String, required: true },
    department: { type: String, required: true },
    action: { type: String, enum: LogAction, required: true },
    details: { type: String, required: true },
}, { timestamps: { createdAt: 'timestamp' } });

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['success', 'info', 'error'], required: true },
    read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'timestamp' } });

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});

export const User = mongoose.model('User', userSchema);
export const Classroom = mongoose.model('Classroom', classroomSchema);
export const Booking = mongoose.model('Booking', bookingSchema);
export const WaitlistEntry = mongoose.model('WaitlistEntry', waitlistEntrySchema);
export const RoomBlock = mongoose.model('RoomBlock', roomBlockSchema);
export const HistoryLog = mongoose.model('HistoryLog', historyLogSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Setting = mongoose.model('Setting', settingSchema);