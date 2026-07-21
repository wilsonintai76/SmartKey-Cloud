
import React, { useState } from 'react';
import { UserAccount } from '../types';

interface IdentityListProps {
  users: UserAccount[];
  isUserBorrowing: (name: string) => boolean;
  onApproveUser: (id: string) => void;
  onToggleUserRole: (id: string) => void;
  onDeactivateUser: (id: string) => void;
  onActivateUser: (id: string) => void;
  onUnlockUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUserCredentials?: (user: UserAccount) => void;
}

export const IdentityList: React.FC<IdentityListProps> = ({
  users,
  isUserBorrowing,
  onApproveUser,
  onToggleUserRole,
  onDeactivateUser,
  onActivateUser,
  onUnlockUser,
  onDeleteUser,
  onUpdateUserCredentials
}) => {
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editCabinetId, setEditCabinetId] = useState('');
  const [editPin, setEditPin] = useState('');

  const handleEditClick = (user: UserAccount) => {
    setEditingUser(user);
    setEditCabinetId(user.cabinetId || '');
    setEditPin(user.offlinePin || '');
  };

  const handleSaveCredentials = () => {
    if (editingUser && onUpdateUserCredentials) {
      onUpdateUserCredentials({
        ...editingUser,
        cabinetId: editCabinetId,
        offlinePin: editPin
      });
      setEditingUser(null);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-3">
          <i className="fa-solid fa-users-gear text-blue-600"></i> Identity Access List
        </h3>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto -mx-6 sm:mx-0">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 px-6">Identity</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 px-6">Assigned Role</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 px-6">Offline Auth</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 px-6">Status</th>
              <th className="pb-4 text-right px-6 text-[10px] font-black uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isBorrowing = isUserBorrowing(u.name);
              const hasOffline = u.cabinetId && u.offlinePin;
              return (
                <tr key={u.id} className="border-b border-slate-50 group hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="w-9 h-9 rounded-full shadow-sm border border-slate-100" alt="" />
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-none">{u.name}</p>
                        <p className="text-[9px] text-slate-400 mt-1">{u.phone || u.email}</p>
                        {isBorrowing && <span className="inline-block mt-1 text-[8px] font-black uppercase text-blue-500 tracking-wider">Holding Key</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {u.role || 'Staff'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                     <div className="flex items-center gap-2">
                        {u.macAddress ? <i className="fa-brands fa-bluetooth text-emerald-500 text-[10px]" title="MAC Bound"></i> : <i className="fa-brands fa-bluetooth text-slate-200 text-[10px]" title="No MAC"></i>}
                        {hasOffline ? <i className="fa-solid fa-key text-amber-500 text-[10px]" title="PIN Set"></i> : <i className="fa-solid fa-key text-slate-200 text-[10px]" title="No PIN"></i>}
                     </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : u.status === 'pending' ? 'bg-amber-500 animate-pulse' : u.status === 'inactive' ? 'bg-slate-400' : 'bg-rose-500 animate-pulse'}`}></div>
                      <span className={`text-[9px] font-black uppercase ${u.status === 'active' ? 'text-emerald-600' : u.status === 'pending' ? 'text-amber-600' : u.status === 'inactive' ? 'text-slate-500' : 'text-rose-600'}`}>
                        {u.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.status === 'pending' ? (
                        <button onClick={() => onApproveUser(u.id)} className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Verify User"><i className="fa-solid fa-check text-[10px]"></i></button>
                      ) : (
                        <>
                          <button onClick={() => handleEditClick(u)} className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Edit Offline Creds"><i className="fa-solid fa-id-card text-[10px]"></i></button>
                          <button onClick={() => onToggleUserRole(u.id)} className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm" title="Toggle Role"><i className="fa-solid fa-user-shield text-[10px]"></i></button>
                          {u.status === 'locked' ? (
                            <button onClick={() => onUnlockUser(u.id)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Manual Unlock"><i className="fa-solid fa-unlock text-[10px]"></i></button>
                          ) : u.status === 'inactive' ? (
                            <button onClick={() => onActivateUser(u.id)} className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Activate Account"><i className="fa-solid fa-power-off text-[10px]"></i></button>
                          ) : (
                            <button onClick={() => onDeactivateUser(u.id)} disabled={isBorrowing} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${isBorrowing ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 hover:bg-slate-200 hover:text-slate-600'}`} title="Deactivate"><i className="fa-solid fa-pause text-[10px]"></i></button>
                          )}
                          <button onClick={() => onDeleteUser(u.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ml-2 ${u.status === 'inactive' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'}`} title="Permanently Archive"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users.map(u => {
          const isBorrowing = isUserBorrowing(u.name);
          return (
            <div key={u.id} className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <img src={u.avatar} className="w-10 h-10 rounded-full shadow-sm border border-slate-100 shrink-0 object-cover" alt="" />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-xs font-black text-slate-900 truncate mb-0.5">{u.name}</p>
                <div className="flex items-center gap-2 mt-2">
                   <button onClick={() => handleEditClick(u)} className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Edit Offline ID</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Modal for Editing Offline Creds */}
      {editingUser && (
        <div className="absolute inset-0 z-20 bg-slate-900/10 backdrop-blur-sm rounded-[40px] flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm animate-fadeIn">
              <h4 className="text-sm font-black text-slate-900 mb-4">Manage Offline Access</h4>
              <p className="text-xs text-slate-500 mb-4">Set manual fallback credentials for <strong>{editingUser.name}</strong>.</p>
              
              <div className="space-y-3 mb-6">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Cabinet User ID (4-Digit)</label>
                   <input type="text" maxLength={4} value={editCabinetId} onChange={e => setEditCabinetId(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-slate-50 border p-3 rounded-xl text-sm font-mono font-bold" placeholder="0000" />
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Keypad PIN (6-Digit)</label>
                   <input type="text" maxLength={6} value={editPin} onChange={e => setEditPin(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-slate-50 border p-3 rounded-xl text-sm font-mono font-bold" placeholder="123456" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={handleSaveCredentials} className="flex-1 bg-amber-500 text-white py-3 rounded-xl text-xs font-black uppercase hover:bg-amber-600">Save</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl text-xs font-black uppercase hover:bg-slate-200">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
