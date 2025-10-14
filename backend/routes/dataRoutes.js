
import express from 'express';
const router = express.Router();
import { getAllData } from '../controllers/dataController.js';
import { protect } from '../middleware/auth.js';

router.get('/all', protect, getAllData);

export default router;