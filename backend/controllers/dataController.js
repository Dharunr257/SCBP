
import { User, Classroom, Booking, WaitlistEntry, RoomBlock, HistoryLog, Notification, Setting } from '../models.js';

// @desc    Fetch all application data
// @route   GET /api/data/all
// @access  Private
export const getAllData = async (req, res) => {
    try {
        const [users, classrooms, bookings, waitlist, roomBlocks, historyLogs, notifications, settings] = await Promise.all([
            User.find({}).select('-password'),
            Classroom.find({}).sort({ name: 1 }),
            Booking.find({}),
            WaitlistEntry.find({}),
            RoomBlock.find({}),
            HistoryLog.find({}).sort({ timestamp: -1 }),
            Notification.find({ userId: req.user._id }).sort({ timestamp: -1 }),
            Setting.find({})
        ]);
        res.json({ users, classrooms, bookings, waitlist, roomBlocks, historyLogs, notifications, settings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data" });
    }
};