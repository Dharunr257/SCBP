
import { Classroom, RoomBlock, Booking, WaitlistEntry } from '../models.js';
import { createLog } from '../utils/logger.js';

// @desc    Create a new classroom
// @route   POST /api/classrooms
// @access  Private
export const createClassroom = async (req, res) => {
    const { name } = req.body;
    try {
        const classroomExists = await Classroom.findOne({ name });
        if (classroomExists) {
            return res.status(400).json({ message: 'Classroom with this name already exists' });
        }
        const classroom = await Classroom.create({ name, status: 'available' });
        await createLog(req.user, 'Room Added', `Added new classroom: ${classroom.name}`);
        res.status(201).json(classroom);
    } catch (error) {
        res.status(400).json({ message: 'Error creating classroom', error: error.message });
    }
};

// @desc    Delete a classroom
// @route   DELETE /api/classrooms/:id
// @access  Private
export const deleteClassroom = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Cascade delete related documents
        await Booking.deleteMany({ classroomId: req.params.id });
        await RoomBlock.deleteMany({ classroomId: req.params.id });
        await WaitlistEntry.deleteMany({ classroomId: req.params.id });
        
        await Classroom.findByIdAndDelete(req.params.id);

        await createLog(req.user, 'Room Removed', `Removed classroom: ${classroom.name}`);
        res.json({ message: 'Classroom and all associated data removed' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// @desc    Update classroom status
// @route   PUT /api/classrooms/:id
// @access  Private
export const updateClassroomStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const classroom = await Classroom.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if(classroom) {
            const action = status === 'maintenance' ? 'Maintenance Set' : 'Maintenance Cleared';
            await createLog(req.user, action, `Set status for ${classroom.name} to ${status}`);
            res.json(classroom);
        } else {
            res.status(404).json({ message: 'Classroom not found' });
        }
    } catch(error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a room block
// @route   POST /api/classrooms/blocks
// @access  Private
export const createRoomBlock = async (req, res) => {
    try {
        const newBlock = await RoomBlock.create({ ...req.body, userId: req.user._id });
        const classroom = await Classroom.findById(newBlock.classroomId);
        await createLog(req.user, 'Room Blocked', `Blocked ${classroom?.name} for periods ${newBlock.periods.join(', ')} on ${newBlock.date}`);
        res.status(201).json(newBlock);
    } catch (error) {
        res.status(400).json({ message: 'Error creating block' });
    }
};

// @desc    Delete a room block
// @route   DELETE /api/classrooms/blocks/:id
// @access  Private
export const deleteRoomBlock = async (req, res) => {
    try {
        const block = await RoomBlock.findByIdAndDelete(req.params.id);
        if (block) {
            const classroom = await Classroom.findById(block.classroomId);
            await createLog(req.user, 'Room Unblocked', `Unblocked ${classroom?.name} for ${block.date}`);
            res.json({ message: 'Block removed' });
        } else {
            res.status(404).json({ message: 'Block not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};