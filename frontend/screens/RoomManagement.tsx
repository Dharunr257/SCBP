import React, { useState, useEffect } from 'react';
import { Classroom, User, UserRole, LogAction, RoomBlock } from '../types';
import { PlusIcon, TrashIcon, CloseIcon, EditIcon } from '../components/Icons';
import { PERIODS } from '../constants';
import { Spinner } from '../components/Spinner';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, name: string) => Promise<void>;
  room: Classroom | null;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({ isOpen, onClose, onSave, room }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (room) {
            setName(room.name);
        }
    }, [room]);

    if (!isOpen || !room) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        await onSave(room._id, name.trim());
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <CloseIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Classroom</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Classroom Name</label>
                        <input id="room-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 w-36 h-10 flex justify-center items-center disabled:bg-gray-400">
                            {loading ? <Spinner size="sm" color="text-white" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface BlockRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: Omit<RoomBlock, '_id' | 'userId'>) => Promise<void>;
  classrooms: Classroom[];
  currentUser: User;
}

const BlockRoomModal: React.FC<BlockRoomModalProps> = ({ isOpen, onClose, onSave, classrooms, currentUser }) => {
    const [classroomId, setClassroomId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [periods, setPeriods] = useState<number[]>([]);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    
    if (!isOpen) return null;

    const handleSave = async () => {
        if (!classroomId || !date || periods.length === 0 || !reason) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        await onSave({ classroomId: classroomId, date, periods, reason });
        setLoading(false);
        onClose();
        // Reset state
        setClassroomId('');
        setDate(todayStr);
        setPeriods([]);
        setReason('');
        setError('');
    };
    
    const handlePeriodChange = (period: number) => {
        setPeriods(prev => prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]);
    };
    
    const handleSelectAllPeriods = () => {
        if (periods.length === PERIODS.length) {
            setPeriods([]);
        } else {
            setPeriods(PERIODS.map(p => p.period));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <CloseIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Block a Classroom</h2>
                <div className="space-y-4">
                    <select value={classroomId} onChange={e => setClassroomId(e.target.value)} className="w-full p-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-md">
                        <option value="" disabled>Select a classroom</option>
                        {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} min={todayStr} className="w-full p-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for blocking (e.g., Projector Maintenance)" className="w-full p-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-md" rows={3}></textarea>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Periods to Block</label>
                             <button onClick={handleSelectAllPeriods} className="text-sm font-semibold text-primary dark:text-primary-dark hover:underline">
                                {periods.length === PERIODS.length ? 'Deselect All' : 'Select All (Full Day)'}
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 p-3 border dark:border-gray-600 rounded-lg">
                            {PERIODS.map(p => (
                                <label key={p.period} className={`flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer ${periods.includes(p.period) ? 'bg-primary/20 dark:bg-primary-dark/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <input type="checkbox" checked={periods.includes(p.period)} onChange={() => handlePeriodChange(p.period)} className="h-4 w-4 rounded text-primary focus:ring-primary-dark" />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">P{p.period}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 w-32 flex justify-center items-center disabled:bg-gray-400">
                        {loading ? <Spinner size="sm" color="text-white" /> : 'Block Room'}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface RoomManagementProps {
  currentUser: User;
  classrooms: Classroom[];
  roomBlocks: RoomBlock[];
  users: User[];
  onUpdateClassroom: (classroomId: string, updates: Partial<Pick<Classroom, 'name' | 'status'>>) => Promise<void>;
  onAddBlock: (blockData: Omit<RoomBlock, '_id' | 'userId'>) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  onAddClassroom: (name: string) => Promise<void>;
  onDeleteClassroom: (classroomId: string) => Promise<void>;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ currentUser, classrooms, roomBlocks, users, onUpdateClassroom, onAddBlock, onDeleteBlock, onAddClassroom, onDeleteClassroom }) => {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Classroom | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [actionsLoading, setActionsLoading] = useState<{[key: string]: boolean}>({});

  
  if (![UserRole.Principal, UserRole.Dean].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleToggleMaintenance = async (room: Classroom) => {
    setActionsLoading(prev => ({...prev, [`status-${room._id}`]: true}));
    const newStatus = room.status === 'available' ? 'maintenance' : 'available';
    await onUpdateClassroom(room._id, { status: newStatus });
    setActionsLoading(prev => ({...prev, [`status-${room._id}`]: false}));
  };
  
  const handleAddNewRoom = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newRoomName.trim()) {
          setIsAddingRoom(true);
          await onAddClassroom(newRoomName.trim());
          setNewRoomName('');
          setIsAddingRoom(false);
      }
  };

  const handleEditRoom = (room: Classroom) => {
    setRoomToEdit(room);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteRoom = async (id: string, name: string) => {
      if (window.confirm(`Are you sure you want to delete "${name}"? This action is irreversible and will remove all associated bookings and blocks.`)) {
          setActionsLoading(prev => ({...prev, [`delete-room-${id}`]: true}));
          await onDeleteClassroom(id);
          setActionsLoading(prev => ({...prev, [`delete-room-${id}`]: false}));
      }
  }

  const handleDeleteBlockAction = async (id: string) => {
    setActionsLoading(prev => ({...prev, [`delete-block-${id}`]: true}));
    await onDeleteBlock(id);
    setActionsLoading(prev => ({...prev, [`delete-block-${id}`]: false}));
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-dark-bg min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Room Management</h2>
      
       <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Add New Classroom</h3>
            <form onSubmit={handleAddNewRoom} className="flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="new-room-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Classroom Name</label>
                    <input id="new-room-name" type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm p-2" />
                </div>
                <button type="submit" disabled={isAddingRoom} className="bg-primary dark:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 flex items-center justify-center space-x-2 h-[42px] w-36 disabled:bg-gray-400">
                    {isAddingRoom ? <Spinner size="sm" color="text-white"/> : <><PlusIcon className="h-5 w-5" /><span>Add Room</span></>}
                </button>
            </form>
        </div>
      
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 flex flex-col items-start justify-center mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Temporary Room Block</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Block a room for specific periods on a certain date for maintenance or other events.</p>
            <button onClick={() => setIsBlockModalOpen(true)} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">
            Block Room
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden mb-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 p-6">Classroom List & Status</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Permanent Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {classrooms.map(room => (
                <tr key={room._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{room.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${room.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                        {room.status}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEditRoom(room)} className="font-bold py-1 px-3 rounded-lg text-xs bg-gray-500 hover:bg-gray-600 text-white w-20 h-7 flex justify-center items-center"><EditIcon className="w-4 h-4 mr-1"/> Edit</button>
                        <button onClick={() => handleToggleMaintenance(room)} disabled={actionsLoading[`status-${room._id}`]} className={`font-bold py-1 px-3 rounded-lg text-xs w-32 h-7 flex justify-center items-center ${room.status === 'available' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white'} disabled:bg-gray-400`}>
                            {actionsLoading[`status-${room._id}`] ? <Spinner size="sm" color="text-white"/> : (room.status === 'available' ? 'Set Maintenance' : 'Set Available')}
                        </button>
                        <button onClick={() => handleDeleteRoom(room._id, room.name)} disabled={actionsLoading[`delete-room-${room._id}`]} className="font-bold py-1 px-3 rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white w-20 h-7 flex justify-center items-center disabled:bg-gray-400">
                            {actionsLoading[`delete-room-${room._id}`] ? <Spinner size="sm" color="text-white"/> : 'Delete'}
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 p-6">Current Temporary Blocks</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classroom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Periods</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Blocked By</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                    {roomBlocks.length > 0 ? roomBlocks.map(block => {
                        const room = classrooms.find(c => c._id === block.classroomId);
                        const user = users.find(u => u._id === block.userId);
                        return (
                            <tr key={block._id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{room?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{block.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {block.periods.length === PERIODS.length ? 'All Day' : `P: ${block.periods.join(', ')}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{block.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDeleteBlockAction(block._id)} disabled={actionsLoading[`delete-block-${block._id}`]} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 w-28 h-7 flex justify-center items-center disabled:text-gray-400">
                                        {actionsLoading[`delete-block-${block._id}`] ? <Spinner size="sm" /> : 'Remove Block'}
                                    </button>
                                </td>
                            </tr>
                        )
                    }) : (
                        <tr><td colSpan={6} className="text-center p-8 text-gray-500 dark:text-gray-400">No temporary room blocks found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <BlockRoomModal 
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSave={onAddBlock}
        classrooms={classrooms}
        currentUser={currentUser}
      />
      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        room={roomToEdit}
        onSave={async (id, name) => await onUpdateClassroom(id, { name })}
      />
    </div>
  );
};

export default RoomManagement;