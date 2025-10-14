
import express from 'express';
const router = express.Router();
import { updateUserPassword, createUser, updateUser, deleteUser, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

router.route('/').post(protect, createUser);
router.put('/password', protect, updateUserPassword);
router.put('/profile', protect, updateUserProfile);
router.route('/:id').put(protect, updateUser).delete(protect, deleteUser);

export default router;