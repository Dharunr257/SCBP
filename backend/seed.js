
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { User, Classroom, Booking, WaitlistEntry, RoomBlock, HistoryLog, Notification, Setting } from './models.js';

const users = [
    { name: 'Dr. Evelyn Reed', role: 'Principal', department: 'Administration', email: 'principal@college.edu', password: 'password123' },
    { name: 'Dr. Samuel Chen', role: 'Dean', department: 'Academics', email: 'dean@college.edu', password: 'password123', isIqacDean: true },
    { name: 'Prof. Aisha Khan', role: 'HOD', department: 'Computer Science', email: 'hod.cs@college.edu', password: 'password123' },
    { name: 'General Faculty', role: 'Faculty', department: 'General', email: 'faculty@college.edu', password: 'password123' },
];

const classrooms = [
    { name: 'Seminar Hall A', status: 'available' },
    { name: 'Smart Room 101', status: 'available' },
    { name: 'Smart Room 102', status: 'maintenance' },
    { name: 'Digital Lab', status: 'available' },
];


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};


const importData = async () => {
  try {
    await User.deleteMany();
    await Classroom.deleteMany();
    await Booking.deleteMany();
    await WaitlistEntry.deleteMany();
    await RoomBlock.deleteMany();
    await HistoryLog.deleteMany();
    await Notification.deleteMany();
    await Setting.deleteMany();

    // Manually hash passwords to ensure they are stored correctly
    const usersWithHashedPasswords = await Promise.all(
        users.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            return user;
        })
    );

    // Using insertMany avoids triggering the pre-save hook again, which is desired here
    await User.insertMany(usersWithHashedPasswords);
    console.log('Users Imported!');
    
    await Classroom.insertMany(classrooms);
    console.log('Classrooms Imported!');

    await Setting.create({ key: 'deanApprovalRequired', value: 'true' });
    console.log('Settings Imported!');

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Classroom.deleteMany();
    await Booking.deleteMany();
    await WaitlistEntry.deleteMany();
    await RoomBlock.deleteMany();
    await HistoryLog.deleteMany();
    await Notification.deleteMany();
    await Setting.deleteMany();
    
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

connectDB().then(() => {
    if (process.argv[2] === '-d') {
      destroyData();
    } else {
      importData();
    }
});