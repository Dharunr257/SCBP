

import { User, Classroom, Booking, WaitlistEntry, RoomBlock, HistoryLog, Notification, Setting } from '../models.js';

// @desc    Fetch all application data
// @route   GET /api/data/all
// @access  Private
export const getAllData = async (req, res) => {
    try {
        // Automatically mark past confirmed bookings as 'completed'
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        const todayStr = `${year}-${month}-${day}`;
        const currentTimeStr = `${hours}:${minutes}`;

        await Booking.updateMany(
            {
                status: { $in: ['confirmed', 'overridden'] },
                $or: [
                    { date: { $lt: todayStr } },
                    { date: todayStr, endTime: { $lt: currentTimeStr } }
                ]
            },
            { $set: { status: 'completed' } }
        );

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