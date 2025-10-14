
import { WaitlistEntry, Booking } from '../models.js';
import { createLog } from '../utils/logger.js';

// @desc    Add a user to a waitlist for a slot
// @route   POST /api/waitlist
// @access  Private
export const addToWaitlist = async (req, res) => {
    try {
        const { classroomId, date, period, subject, classYear, staffName, contactNo } = req.body;
        const userId = req.user._id;

        // Check if user already has a booking for this slot
        const existingBooking = await Booking.findOne({ userId, classroomId, date, period, status: { $in: ['confirmed', 'pending'] } });
        if (existingBooking) {
            return res.status(400).json({ message: 'You already have a booking or pending request for this slot.' });
        }

        // Check if user is already on the waitlist for this slot
        const existingWaitlist = await WaitlistEntry.findOne({ userId, classroomId, date, period });
        if (existingWaitlist) {
            return res.status(400).json({ message: 'You are already on the waitlist for this slot.' });
        }
        
        const waitlistData = { userId, classroomId, date, period, subject, classYear, staffName, contactNo };
        const newWaitlistEntry = await WaitlistEntry.create(waitlistData);
        
        await createLog(req.user, 'Joined Waitlist', `Joined waitlist for subject ${subject} on ${date} period ${period}`);
        
        res.status(201).json(newWaitlistEntry);

    } catch (error) {
        res.status(400).json({ message: 'Error joining waitlist', error: error.message });
    }
};

// @desc    Remove a user from a waitlist
// @route   DELETE /api/waitlist/:id
// @access  Private
export const removeFromWaitlist = async (req, res) => {
    try {
        const waitlistEntry = await WaitlistEntry.findById(req.params.id);
        
        if (!waitlistEntry) {
            return res.status(404).json({ message: 'Waitlist entry not found' });
        }
        
        if (waitlistEntry.userId.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'You are not authorized to remove this waitlist entry.' });
        }
        
        await WaitlistEntry.findByIdAndDelete(req.params.id);
        
        await createLog(req.user, 'Left Waitlist', `Left waitlist for subject ${waitlistEntry.subject} on ${waitlistEntry.date}`);
        
        res.json({ message: 'Removed from waitlist' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
