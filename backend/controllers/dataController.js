
import { User, Classroom, Booking, WaitlistEntry, RoomBlock, HistoryLog, Notification, Setting } from '../models.js';

// @desc    Fetch all application data
// @route   GET /api/data/all
// @access  Private
export const getAllData = async (req, res) => {
    try {
        // Automatically mark past confirmed bookings as 'completed'
        // This logic assumes the application operates in a single timezone, India Standard Time (UTC+5:30),
        // to correct for server time differences (e.g., server running in UTC).
        const now = new Date();

        // Convert current time to IST (UTC+5:30) by adding a 5.5-hour offset to the UTC time.
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);

        // Use UTC methods on the offset date to get the correct date/time components for IST.
        const year = istNow.getUTCFullYear();
        const month = (istNow.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = istNow.getUTCDate().toString().padStart(2, '0');
        const hours = istNow.getUTCHours().toString().padStart(2, '0');
        const minutes = istNow.getUTCMinutes().toString().padStart(2, '0');
        
        const todayStr = `${year}-${month}-${day}`;
        const currentTimeStr = `${hours}:${minutes}`;

        await Booking.updateMany(
            {
                status: { $in: ['confirmed', 'overridden'] },
                $or: [
                    { date: { $lt: todayStr } },
                    { date: todayStr, endTime: { $lte: currentTimeStr } }
                ]
            },
            { $set: { status: 'completed' } }
        );

        // Auto-delete notifications older than two days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        await Notification.deleteMany({ timestamp: { $lt: twoDaysAgo } });

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