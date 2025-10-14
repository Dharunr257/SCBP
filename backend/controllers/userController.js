
import { User } from '../models.js';
import { createLog } from '../utils/logger.js';

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
export const updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            await createLog(user, 'Password Changed', `Changed password for user ${user.name}`);
            res.json({ message: 'Password updated successfully!' });
        } else {
            res.status(401).json({ message: 'Incorrect current password.' });
        }
    } catch (error) {
         res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const { name, email } = req.body;
            
            // Check if email is already taken by another user
            if (email && email !== user.email) {
                const userExists = await User.findOne({ email, _id: { $ne: user._id } });
                if (userExists) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
            }

            user.name = name || user.name;
            user.email = email || user.email;

            const updatedUser = await user.save();
            
            const userResponse = updatedUser.toObject();
            delete userResponse.password;
            
            await createLog(user, 'User Edited', `Updated own profile details`);
            res.json(userResponse);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: 'Error updating profile', error: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin/Dean)
export const createUser = async (req, res) => {
    try {
        const { role } = req.body;

        if (role === 'Faculty') {
            const facultyExists = await User.findOne({ role: 'Faculty' });
            if (facultyExists) {
                return res.status(400).json({ message: 'A general Faculty account already exists. Cannot create another.' });
            }
        }

        const newUser = await User.create(req.body);
        const userResponse = newUser.toObject();
        delete userResponse.password;
        await createLog(req.user, 'User Added', `Added new user: ${newUser.name} (${newUser.role})`);
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ message: 'Error creating user' });
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin/Dean)
export const updateUser = async (req, res) => {
    try {
        const { name, email, department, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.params.id, { name, email, department, role }, { new: true }).select('-password');
        if (updatedUser) {
            await createLog(req.user, 'User Edited', `Updated user details for ${updatedUser.name}`);
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating user' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin/Dean)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
            await createLog(req.user, 'User Deleted', `Deleted user: ${user.name}`);
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};