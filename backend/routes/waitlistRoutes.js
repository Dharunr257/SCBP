
import express from 'express';
const router = express.Router();
import { addToWaitlist, removeFromWaitlist } from '../controllers/waitlistController.js';
import { protect } from '../middleware/auth.js';

router.route('/').post(protect, addToWaitlist);
router.route('/:id').delete(protect, removeFromWaitlist);

export default router;
