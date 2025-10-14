
import { Setting } from '../models.js';

// @desc    Get a setting by key
// @route   GET /api/settings/:key
// @access  Private
export const getSetting = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });
        if (setting) {
            res.json(setting);
        } else {
            res.status(404).json({ message: 'Setting not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a setting
// @route   PUT /api/settings/:key
// @access  Private (Admin)
export const updateSetting = async (req, res) => {
    try {
        const { value } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key: req.params.key },
            { value },
            { new: true, upsert: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(400).json({ message: 'Error updating setting', error: error.message });
    }
};
