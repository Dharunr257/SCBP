
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { User, Classroom, Booking, WaitlistEntry, RoomBlock, HistoryLog, Notification, Setting } from './models.js';

const users = [
    { name: 'Dr. Senthil kumar', role: 'Principal', department: 'Administration', email: 'principal@pmctech.org', password: 'password123' },
    { name: 'Dr. Gnana Sekhar', role: 'Dean IQAC', department: 'IQAC', email: 'dean.iqac@pmctech.org', password: 'password123', isIqacDean: true },
    { name: 'General Faculty', role: 'Faculty', department: 'General', email: 'faculty@pmctech.org', password: 'password123' },
    { name: 'HOD of AI and DS', role: 'HOD', department: 'AI and DS', email: 'hod.aiandds@pmctech.org', password: 'password123' },
    { name: 'HOD of CSBS', role: 'HOD', department: 'CSBS', email: 'hod.csbs@pmctech.org', password: 'password123' },
    { name: 'HOD of SH V2', role: 'HOD', department: 'SH V2', email: 'hod.shv2@pmctech.org', password: 'password123' },
    { name: 'HOD of SH V3', role: 'HOD', department: 'SH V3', email: 'hod.shv3@pmctech.org', password: 'password123' },
    { name: 'HOD of Chemistry', role: 'HOD', department: 'Chemistry', email: 'hod.chem@pmctech.org', password: 'password123' },
    { name: 'HOD of Aeronautical', role: 'HOD', department: 'Aeronautical', email: 'hod.aero@pmctech.org', password: 'password123' },
    { name: 'HOD of Civil', role: 'HOD', department: 'Civil', email: 'hod.civil@pmctech.org', password: 'password123' },
    { name: 'HOD of CSE', role: 'HOD', department: 'CSE', email: 'hod.cse@pmctech.org', password: 'password123' },
    { name: 'HOD of ECE', role: 'HOD', department: 'ECE', email: 'hod.ece@pmctech.org', password: 'password123' },
    { name: 'HOD of EEE', role: 'HOD', department: 'EEE', email: 'hod.eee@pmctech.org', password: 'password123' },
    { name: 'HOD of IT', role: 'HOD', department: 'IT', email: 'hod.it@pmctech.org', password: 'password123' },
    { name: 'HOD of MBA', role: 'HOD', department: 'MBA', email: 'hod.mba@pmctech.org', password: 'password123' },
    { name: 'HOD of MCA', role: 'HOD', department: 'MCA', email: 'hod.mca@pmctech.org', password: 'password123' },
    { name: 'HOD of MCO', role: 'HOD', department: 'MCO', email: 'hod.mco@pmctech.org', password: 'password123' },
    { name: 'HOD of Mechanical', role: 'HOD', department: 'Mechanical', email: 'hod.mech@pmctech.org', password: 'password123' },
    { name: 'HOD of Science and Humanities', role: 'HOD', department: 'Science and Humanities', email: 'hod.sh@pmctech.org', password: 'password123' },
];

const classrooms = [
    { name: 'IQAC Smart Classroom', status: 'available' },
    { name: 'CSE Smart classroom', status: 'available' },
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