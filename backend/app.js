
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route files
import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/waitlist', waitlistRoutes);


// --- DEPLOYMENT ---
if (process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const buildPath = path.join(__dirname, '../frontend/dist');
    
    app.use(express.static(buildPath));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(buildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running for SmartClass Booking System...');
    });
}

export default app;