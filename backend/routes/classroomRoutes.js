import express from 'express';
const router = express.Router();
import { 
    updateClassroom, 
    createRoomBlock, 
    deleteRoomBlock,
    createClassroom,
    deleteClassroom
} from '../controllers/classroomController.js';
import { protect } from '../middleware/auth.js';

router.route('/')
    .post(protect, createClassroom);

router.route('/:id')
    .put(protect, updateClassroom)
    .delete(protect, deleteClassroom);

router.route('/blocks')
    .post(protect, createRoomBlock);

router.route('/blocks/:id')
    .delete(protect, deleteRoomBlock);

export default router;