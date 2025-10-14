
import { Booking, Setting, User, Notification } from '../models.js';
import { createLog } from '../utils/logger.js';

// @desc    Create or update a booking
// @route   POST /api/bookings
// @access  Private
export const createOrUpdateBooking = async (req, res) => {
    try {
        const approvalSetting = await Setting.findOne({ key: 'deanApprovalRequired' });
        const isApprovalRequired = approvalSetting ? approvalSetting.value === 'true' : false;

        if (req.user.role === 'Faculty') {
            return res.status(403).json({ message: 'Faculty members do not have permission to create bookings.' });
        }

        if (req.body._id) { // Editing
             const { _id, periods, ...updateData } = req.body;
             // Editing logic remains simple: update the existing booking.
             // Complex approval for edits is not part of this scope.
             const updatedBooking = await Booking.findByIdAndUpdate(_id, updateData, { new: true });
             await createLog(req.user, 'Edited', `Edited booking for subject ${updatedBooking.subject}`);
             res.status(200).json(updatedBooking);
        } else { // Creating new bookings
            let status = 'confirmed';
            if (isApprovalRequired && req.user.role !== 'Principal' && !req.user.isIqacDean) {
                status = 'pending';
            }

            const newBookingsData = req.body.bookings.map(b => ({ ...b, status }));
            const newBookings = await Booking.create(newBookingsData);

            if (status === 'pending') {
                const iqacDean = await User.findOne({ isIqacDean: true });
                if (iqacDean) {
                    await Notification.create({
                        userId: iqacDean._id,
                        message: `New booking request from ${req.user.name} for ${newBookings[0].subject} needs your approval.`,
                        type: 'info'
                    });
                }
                 await Notification.create({
                    userId: req.user._id,
                    message: 'Your booking request has been sent to the IQAC Dean for approval.',
                    type: 'info'
                });
            }
            
            await createLog(req.user, 'Created', `Created ${newBookings.length} booking(s) for subject ${req.body.bookings[0].subject} with status: ${status}`);
            res.status(201).json(newBookings);
        }
    } catch (error) {
        res.status(400).json({ message: 'Error saving booking', error: error.message });
    }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
             return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Allow deletion only by the user who booked it, or an admin/dean
        const isOwner = booking.userId.toString() === req.user._id.toString();
        const isAdminOrDean = ['Principal', 'Dean'].includes(req.user.role) || req.user.isIqacDean;

        if (!isOwner && !isAdminOrDean) {
            return res.status(403).json({ message: 'You are not authorized to delete this booking.' });
        }
        
        await Booking.findByIdAndDelete(req.params.id);
        await createLog(req.user, 'Deleted', `Deleted booking for subject ${booking.subject}`);
        res.json({ message: 'Booking removed' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update booking status (Approve/Decline)
// @route   PUT /api/bookings/:id/status
// @access  Private (IQAC Dean/Principal)
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const isAuthorized = req.user.role === 'Principal' || req.user.isIqacDean;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'You are not authorized to change booking status.' });
        }

        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        if(booking) {
            const action = status === 'confirmed' ? 'Booking Approved' : 'Booking Declined';
            await createLog(req.user, action, `Set status for booking ${booking.subject} to ${status}`);
            
            // Send notification to the original requester
            await Notification.create({
                userId: booking.userId,
                message: `Your booking for ${booking.subject} on ${booking.date} has been ${status}.`,
                type: status === 'confirmed' ? 'success' : 'error'
            });

            // If approved, reject all other pending requests for the same slot
            if (status === 'confirmed') {
                const otherRequests = await Booking.find({
                    classroomId: booking.classroomId,
                    date: booking.date,
                    period: booking.period,
                    _id: { $ne: booking._id },
                    status: 'pending'
                });

                if (otherRequests.length > 0) {
                    const otherUserIds = otherRequests.map(r => r.userId);
                    await Booking.updateMany({ _id: { $in: otherRequests.map(r => r._id) } }, { status: 'declined' });
                    
                    // Notify other users that the slot was booked
                    const notifications = otherUserIds.map(userId => ({
                        userId: userId,
                        message: `The slot you requested for ${booking.date} at period ${booking.period} was assigned to another user.`,
                        type: 'info'
                    }));
                    await Notification.insertMany(notifications);
                    await createLog(req.user, 'Booking Declined', `Auto-declined ${otherRequests.length} other request(s) for the same slot.`);
                }
            }

            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};