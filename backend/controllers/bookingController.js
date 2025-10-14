
import { Booking } from '../models.js';
import { createLog } from '../utils/logger.js';

// @desc    Create or update a booking
// @route   POST /api/bookings
// @access  Private
export const createOrUpdateBooking = async (req, res) => {
    try {
        if (req.body._id) { // Editing
             const { _id, periods, ...updateData } = req.body;
             const updatedBooking = await Booking.findByIdAndUpdate(_id, updateData, { new: true });
             await createLog(req.user, 'Edited', `Edited booking for subject ${updatedBooking.subject}`);
             res.status(200).json(updatedBooking);
        } else { // Creating new bookings
            const newBookings = await Booking.create(req.body.bookings);
            await createLog(req.user, 'Created', `Created ${newBookings.length} booking(s) for subject ${req.body.bookings[0].subject}`);
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
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (booking) {
            await createLog(req.user, 'Deleted', `Deleted booking for subject ${booking.subject}`);
            res.json({ message: 'Booking removed' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if(booking) {
            const action = status === 'confirmed' ? 'Booking Approved' : 'Booking Declined';
            await createLog(req.user, action, `Set status for booking ${booking.subject} to ${status}`);
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};