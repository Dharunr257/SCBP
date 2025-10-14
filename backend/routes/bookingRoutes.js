
import express from 'express';
const router = express.Router();
import { createOrUpdateBooking, deleteBooking, updateBookingStatus } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

router.route('/').post(protect, createOrUpdateBooking);
router.route('/:id').delete(protect, deleteBooking);
router.route('/:id/status').put(protect, updateBookingStatus);

export default router;