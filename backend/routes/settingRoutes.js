
import express from 'express';
const router = express.Router();
import { getSetting, updateSetting } from '../controllers/settingController.js';
import { protect, admin } from '../middleware/auth.js';

router.route('/:key').get(protect, getSetting).put(protect, admin, updateSetting);

export default router;
