
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole } from '../types';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from '../components/Icons';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    user: User | null;
    currentUser: User;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSave, user, currentUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Faculty);
    const [isIqacDean, setIsIqacDean] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setDepartment(user.department);
            setRole(user.role);
            setIsIqacDean(!!user.isIqacDean);
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...user, name, email, department, role, isIqacDean });
        onClose();
    };
    
    const canChangeRole = currentUser.role === UserRole.Principal;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                  <CloseIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit User</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input id="edit-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
                    </div>
                     <div>
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                        <input id="edit-department" type="text" value={department} onChange={e => setDepartment(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select id="edit-role" value={role} onChange={e => setRole(e.target.value as UserRole)} required disabled={!canChangeRole || user.role === UserRole.Principal || user.role === UserRole.Faculty} className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2 disabled:bg-gray-200 dark:disabled:bg-gray-800">
                           {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                         {(!canChangeRole || user.role === UserRole.Principal || user.role === UserRole.Faculty) && <p className="text-xs text-gray-500 mt-1">Role cannot be changed for this user.</p>}
                    </div>
                     {role === UserRole.Dean && canChangeRole && (
                        <div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isIqacDean}
                                    onChange={e => setIsIqacDean(e.target.checked)}
                                    className="h-4 w-4 rounded text-primary focus:ring-primary-dark"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as IQAC Dean (Approval Authority)</span>
                            </label>
                             <p className="text-xs text-gray-500 mt-1">Checking this will remove the IQAC Dean role from any other user.</p>
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: Omit<User, '_id' | 'password'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [isIqacDean, setIsIqacDean] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const facultyAccountExists = useMemo(() => users.some(user => user.role === UserRole.Faculty), [users]);

  const availableRoles = useMemo(() => {
    let baseRoles = currentUser.role === UserRole.Principal 
      ? [UserRole.Dean, UserRole.HOD, UserRole.Faculty]
      : [UserRole.HOD, UserRole.Faculty];
    
    if (facultyAccountExists) {
      return baseRoles.filter(r => r !== UserRole.Faculty);
    }
    return baseRoles;
  }, [currentUser.role, facultyAccountExists]);
  
  const [role, setRole] = useState<UserRole>(availableRoles[0] || UserRole.Faculty);

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    }
    // Reset IQAC Dean checkbox if role is not Dean
    if (role !== UserRole.Dean) {
      setIsIqacDean(false);
    }
  }, [availableRoles, role]);
  
  if (![UserRole.Principal, UserRole.Dean].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }
    
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !department || !role) return;
    onAddUser({ name, email, department, role, isIqacDean });
    setName('');
    setEmail('');
    setDepartment('');
    setIsIqacDean(false);
    if(availableRoles.length > 0) {
        setRole(availableRoles[0]);
    }
  };
  
  const handleEditClick = (user: User) => {
      setUserToEdit(user);
      setIsEditModalOpen(true);
  }

  const handleDeleteClick = (userId: string, userName: string) => {
      if(window.confirm(`Are you sure you want to delete the user "${userName}"?`)) {
          onDeleteUser(userId);
      }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">User Management</h2>
      
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Create New User</h3>
        {facultyAccountExists && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700 p-4 mb-4 rounded-md" role="alert">
                <p>A general Faculty account already exists. The option to create another Faculty account is disabled.</p>
            </div>
        )}
        <form onSubmit={handleAddUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                <input id="department" type="text" value={department} onChange={e => setDepartment(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2">
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {currentUser.role === UserRole.Principal && role === UserRole.Dean && (
                <div className="mt-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isIqacDean}
                            onChange={e => setIsIqacDean(e.target.checked)}
                            className="h-4 w-4 rounded text-primary focus:ring-primary-dark"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as IQAC Dean (Approval Authority)</span>
                    </label>
                </div>
            )}
            <div className="mt-6 flex justify-end">
                <button type="submit" disabled={availableRoles.length === 0} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 flex items-center justify-center space-x-2 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                    <PlusIcon className="h-5 w-5" />
                    <span>Add User</span>
                </button>
            </div>
        </form>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {users.map(user => {
                    let canEdit = false;
                    if (currentUser.role === UserRole.Principal) {
                        canEdit = user.role !== UserRole.Principal;
                    } else if (currentUser.role === UserRole.Dean) {
                        canEdit = ![UserRole.Principal, UserRole.Dean].includes(user.role);
                    }
                    if (user._id === currentUser._id) {
                        canEdit = false; // Cannot edit self in this panel
                    }

                    let canDelete = false;
                    if (currentUser.role === UserRole.Principal) {
                        canDelete = user.role !== UserRole.Principal;
                    } else if (currentUser.role === UserRole.Dean) {
                        canDelete = ![UserRole.Principal, UserRole.Dean].includes(user.role);
                    }
                    if (user._id === currentUser._id) {
                        canDelete = false; // Cannot delete self
                    }

                    return (
                        <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className='flex items-center space-x-2'>
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {user.role}
                                </span>
                                {user.isIqacDean && (
                                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                        IQAC Dean
                                    </span>
                                )}
                            </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                <button onClick={() => handleEditClick(user)} disabled={!canEdit} className="text-primary dark:text-primary-dark hover:underline inline-flex items-center disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed disabled:no-underline"><EditIcon className="w-4 h-4 mr-1"/>Edit</button>
                                <button onClick={() => handleDeleteClick(user._id, user.name)} disabled={!canDelete} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed inline-flex items-center"><TrashIcon className="w-4 h-4 mr-1"/>Delete</button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        </div>
      </div>
      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onUpdateUser}
        user={userToEdit}
        currentUser={currentUser}
      />
    </div>
  );
};

export default UserManagement;
