

import React, { useMemo } from 'react';
import { Booking, User, Classroom, UserRole } from '../types';
import { DownloadIcon } from '../components/Icons';
import { formatTime12h } from '../constants';

interface ReportsProps {
  bookings: Booking[];
  users: User[];
  classrooms: Classroom[];
  currentUser: User;
}

const ReportCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex justify-between items-center">{title}</h3>
        {children}
    </div>
);

const Reports: React.FC<ReportsProps> = ({ bookings, users, classrooms, currentUser }) => {

    const filteredBookings = useMemo(() => {
        if (currentUser.role === UserRole.HOD) {
            return bookings.filter(b => {
                const user = users.find(u => u._id === b.userId);
                return user?.department === currentUser.department;
            });
        }
        return bookings;
    }, [bookings, users, currentUser]);

    const departmentUsage = useMemo(() => {
        const usage: { [key: string]: number } = {};
        filteredBookings.forEach(b => {
            const user = users.find(u => u._id === b.userId);
            if(user) {
                const duration = (new Date(`1970-01-01T${b.endTime}:00Z`).getTime() - new Date(`1970-01-01T${b.startTime}:00Z`).getTime()) / 3600000;
                usage[user.department] = (usage[user.department] || 0) + duration;
            }
        });
        return Object.entries(usage).sort(([,a],[,b]) => b - a);
    }, [filteredBookings, users]);

    const topUsers = useMemo(() => {
        const userCounts: { [key: string]: number } = {};
        filteredBookings.forEach(b => {
            const user = users.find(u => u._id === b.userId);
            if (user) {
                userCounts[user.name] = (userCounts[user.name] || 0) + 1;
            }
        });
        return Object.entries(userCounts).sort(([,a],[,b]) => b - a).slice(0, 5);
    }, [filteredBookings, users]);

    const roomUtilization = useMemo(() => {
        const roomHours: { [key: string]: number } = {};
        filteredBookings.forEach(b => {
            const room = classrooms.find(r => r._id === b.classroomId);
            if (room) {
                 const duration = (new Date(`1970-01-01T${b.endTime}:00Z`).getTime() - new Date(`1970-01-01T${b.startTime}:00Z`).getTime()) / 3600000;
                roomHours[room.name] = (roomHours[room.name] || 0) + duration;
            }
        });
        const totalHours = 10 * 20; // 10 hours a day, 20 days a month approx
        return Object.entries(roomHours).map(([name, hours]) => ({ name, utilization: (hours / totalHours) * 100 })).sort((a,b) => b.utilization - a.utilization);
    }, [filteredBookings, classrooms]);

    const bookingRecords = useMemo(() => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        return filteredBookings
            .filter(b => new Date(b.createdAt) >= twoMonthsAgo)
            .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((b, index) => {
                const user = users.find(u => u._id === b.userId);
                return {
                    'S.NO': index + 1,
                    'Staff Name': b.staffName,
                    'Department': user?.department || 'N/A',
                    'Contact No': b.contactNo,
                    'Booking On': b.createdAt.toLocaleString(),
                    'Class Conducting On': `${new Date(b.date).toLocaleDateString()} ${formatTime12h(b.startTime)}`,
                    'Hour No': b.period,
                    'Starting Time': formatTime12h(b.startTime),
                    'Ending Time': formatTime12h(b.endTime),
                };
            });
    }, [filteredBookings, users]);
    
    const handleExport = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + data.map(e => headers.map(header => `"${e[header]}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reports & Export</h2>
        {currentUser.role === UserRole.HOD && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-semibold px-4 py-2 rounded-lg">
                Showing reports for {currentUser.department} department
            </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <ReportCard title="Department Usage (Hours)">
              <button onClick={() => handleExport(departmentUsage.map(([dept, hours])=>({Department: dept, Hours: hours.toFixed(1)})), 'department_usage')} className="float-right -mt-12 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><DownloadIcon className="w-5 h-5"/></button>
              <ul className="space-y-2">
                  {departmentUsage.map(([dept, hours]) => (
                      <li key={dept} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{dept}</span>
                          <span className="font-bold text-primary dark:text-primary-dark">{hours.toFixed(1)} hrs</span>
                      </li>
                  ))}
              </ul>
          </ReportCard>
           <ReportCard title="Top 5 Users (by Bookings)">
              <button onClick={() => handleExport(topUsers.map(([user, bookings])=>({User: user, Bookings: bookings})), 'top_users')} className="float-right -mt-12 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><DownloadIcon className="w-5 h-5"/></button>
              <ul className="space-y-2">
                  {topUsers.map(([name, count]) => (
                      <li key={name} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                          <span className="font-semibold px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{count} bookings</span>
                      </li>
                  ))}
              </ul>
          </ReportCard>
          <ReportCard title="Room Utilization (Monthly Est.)">
              <button onClick={() => handleExport(roomUtilization.map(r=>({Room: r.name, 'Utilization (%)': r.utilization.toFixed(1)})), 'room_utilization')} className="float-right -mt-12 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><DownloadIcon className="w-5 h-5"/></button>
              <div className="space-y-3">
                  {roomUtilization.map(({ name, utilization }) => (
                      <div key={name}>
                          <div className="flex justify-between mb-1 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                              <span className="font-medium text-gray-500 dark:text-gray-400">{utilization.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${utilization}%` }}></div>
                          </div>
                      </div>
                  ))}
              </div>
          </ReportCard>

          <div className="col-span-1 lg:col-span-2 xl:col-span-3">
            <ReportCard title="Booking Record Details (Last 2 Months)">
                <button 
                    onClick={() => handleExport(bookingRecords, 'booking_records')} 
                    className="float-right -mt-12 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    disabled={bookingRecords.length === 0}
                    aria-label="Export booking records"
                >
                    <DownloadIcon className="w-5 h-5"/>
                </button>
                <div className="max-h-96 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                                {bookingRecords.length > 0 && Object.keys(bookingRecords[0]).map(header => (
                                    <th key={header} scope="col" className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                            {bookingRecords.length > 0 ? bookingRecords.map((record, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['S.NO']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Staff Name']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Department']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Contact No']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Booking On']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Class Conducting On']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Hour No']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Starting Time']}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{record['Ending Time']}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">No booking records found for the last 2 months.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </ReportCard>
        </div>

      </div>
    </div>
  );
};

export default Reports;