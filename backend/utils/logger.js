
import { HistoryLog } from '../models.js';

// Create Log helper function
export const createLog = async (user, action, details) => {
    try {
        await HistoryLog.create({ user: user.name, department: user.department, action, details });
    } catch (error) {
        console.error("Failed to create log:", error);
    }
};