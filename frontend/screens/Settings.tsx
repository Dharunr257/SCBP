import React, { useState, useEffect } from 'react';
import { User, Setting, UserRole } from '../types';
import { Spinner } from '../components/Spinner';

interface SettingsProps {
    currentUser: User;
    onChangePassword: (current: string, newPass: string) => Promise<{ success: boolean, message: string }>;
    onUpdateProfile: (userData: { name: string, email: string }) => Promise<{ success: boolean, message: string }>;
    settings: Setting[];
    onUpdateSetting: (key: string, value: string) => void;
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onChangePassword, onUpdateProfile, settings, onUpdateSetting, onLogout }) => {
    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    // Profile State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    const approvalSetting = settings.find(s => s.key === 'deanApprovalRequired');
    const isApprovalEnabled = approvalSetting?.value === 'true';
    
    useEffect(() => {
        if(currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
        }
    }, [currentUser]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        setIsPasswordLoading(true);

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            setIsPasswordLoading(false);
            return;
        }

        const result = await onChangePassword(currentPassword, newPassword);
        setIsPasswordLoading(false);

        if (result.success) {
            setPasswordSuccess(result.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordError(result.message);
        }
    };
    
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setIsProfileLoading(true);

        const result = await onUpdateProfile({ name, email });
        setIsProfileLoading(false);
        
        if (result.success) {
            setProfileSuccess(result.message);
        } else {
            setProfileError(result.message);
        }
    };

    const handleApprovalToggle = () => {
        const action = isApprovalEnabled ? 'DISABLE' : 'ENABLE';
        const confirmationMessage = `Are you sure you want to ${action} the Dean Approval System?`;
        if (window.confirm(confirmationMessage)) {
            onUpdateSetting('deanApprovalRequired', (!isApprovalEnabled).toString());
        }
    };

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {currentUser.role === UserRole.Principal && (
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">System Controls</h3>
                <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Dean Approval System</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">If enabled, all bookings from Deans/HODs will require approval from the IQAC Dean.</p>
                    </div>
                    <button onClick={handleApprovalToggle} className={`font-bold py-2 px-4 rounded-lg text-sm ${isApprovalEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                        {isApprovalEnabled ? 'Disable' : 'Enable'}
                    </button>
                </div>
              </div>
          )}

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Profile Settings</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
              <div>
                  <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
               {profileError && <p className="text-red-500 text-sm">{profileError}</p>}
               {profileSuccess && <p className="text-green-500 text-sm">{profileSuccess}</p>}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isProfileLoading} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 w-36 h-10 flex justify-center items-center disabled:bg-gray-400">
                    {isProfileLoading ? <Spinner size="sm" color="text-white"/> : "Update Profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                  <input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
              <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
              <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                  <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
               {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
               {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isPasswordLoading} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 w-40 h-10 flex justify-center items-center disabled:bg-gray-400">
                    {isPasswordLoading ? <Spinner size="sm" color="text-white"/> : "Update Password"}
                </button>
              </div>
            </form>
          </div>

           <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Account Actions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Logging out will end your current session and require you to sign in again.
                </p>
                <button
                    onClick={onLogout}
                    className="w-full md:w-auto text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Logout
                </button>
            </div>

        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Account Security</h3>
             <p className="text-gray-600 dark:text-gray-400 text-sm">Regularly updating your password and ensuring your profile information is correct helps keep your account secure.</p>
             <h4 className="font-semibold mt-4 mb-2 dark:text-gray-200">Password Policy</h4>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                <li>Minimum length: 8 characters</li>
                <li>Must contain a special character (e.g., !@#$%)</li>
                <li>Must contain a number (0-9)</li>
                <li>Cannot be a previously used password</li>
            </ul>
             <p className="text-xs text-gray-500 mt-4">(Policy enforcement is for demonstration purposes)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
