
import React, { useState } from 'react';
import { KeySlot, UserAccount, SystemConfig, ControllerStatus } from '../types';
import { IdentityList } from './IdentityList';
import { CbmPanel } from './CbmPanel';
import { GlobalPolicyConfig } from './GlobalPolicyConfig';
import { HardwareRegistration } from './HardwareRegistration';
import { RackTopology } from './RackTopology';
import { SystemModules } from './SystemModules';
import { CloudConnectionConfig } from './CloudConnectionConfig';
import { ConnectivityStatus } from './ConnectivityStatus';

interface AdminHubProps {
  slots: KeySlot[];
  registeredUsers: UserAccount[];
  config: SystemConfig;
  tempConfig: SystemConfig;
  setTempConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  saveConfig: () => void;
  onUpdateConfig: (updates: Partial<SystemConfig>) => void;
  isSystemLocked: boolean;
  setIsSystemLocked: (val: boolean) => void;
  isAdminMode: boolean;
  onApproveUser: (id: string) => void;
  onToggleUserRole: (id: string) => void;
  onDeactivateUser: (id: string) => void;
  onActivateUser: (id: string) => void;
  onUnlockUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUserCredentials?: (user: UserAccount) => void;
  onAddUser?: (name: string, userId: string, pin: string, role: 'staff' | 'admin') => void;
  onAddModule: () => void;
  onDeleteModule: (idx: number) => void;
  onUpdateSlotLabel: (id: number, label: string) => void;
  onToggleSlotLock: (id: number) => void;
  onMaintenanceRequest: (id: number) => void;
  recentlyMaintained: number | null;
  isUserBorrowing: (name: string) => boolean;
  activeAdminModuleIndex: number;
  setActiveAdminModuleIndex: (idx: number) => void;
  isAddingModule: boolean;
  setIsAddingModule: (val: boolean) => void;
  isBluetoothConnected: boolean;
  bluetoothStatus: string;
  onConnectBluetooth?: () => void;
  currentUser: any;
  onEmergencyRelease: () => Promise<void>;
  onUnlockDoor: () => void;
  isEmergencySequencing: boolean;
  sequenceProgress: string;
  isHardwareTriggerActive?: boolean;
  controllerStatus?: ControllerStatus;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  slots,
  registeredUsers,
  config,
  tempConfig,
  setTempConfig,
  saveConfig,
  onUpdateConfig,
  isSystemLocked,
  setIsSystemLocked,
  isAdminMode,
  onApproveUser,
  onToggleUserRole,
  onDeactivateUser,
  onActivateUser,
  onUnlockUser,
  onDeleteUser,
  onUpdateUserCredentials,
  onAddUser,
  onAddModule,
  onDeleteModule,
  onUpdateSlotLabel,
  onToggleSlotLock,
  onMaintenanceRequest,
  recentlyMaintained,
  isUserBorrowing,
  activeAdminModuleIndex,
  setActiveAdminModuleIndex,
  isAddingModule,
  setIsAddingModule,
  isBluetoothConnected,
  bluetoothStatus,
  onConnectBluetooth,
  currentUser,
  onEmergencyRelease,
  onUnlockDoor,
  isEmergencySequencing,
  sequenceProgress,
  isHardwareTriggerActive,
  controllerStatus
}) => {
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionType: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: 'Confirm',
    actionType: 'danger',
    onConfirm: () => {}
  });

  const confirmAction = (title: string, message: string, actionLabel: string, actionType: 'danger' | 'warning' | 'info', onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      actionLabel,
      actionType,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirmSubmit = () => {
    confirmModal.onConfirm();
    closeConfirm();
  };

  if (!isAdminMode) return null;

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'staff' | 'admin'>('staff');

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserId || newUserId.length !== 4 || !newUserPin || newUserPin.length < 4) return;
    onAddUser?.(newUserName.trim(), newUserId, newUserPin, newUserRole);
    setNewUserName(''); setNewUserId(''); setNewUserPin(''); setNewUserRole('staff');
    setShowAddUser(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn relative">
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
              confirmModal.actionType === 'danger' ? 'bg-red-50 text-red-600' :
              confirmModal.actionType === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              <i className={`fa-solid text-2xl ${
                confirmModal.actionType === 'danger' ? 'fa-triangle-exclamation' :
                confirmModal.actionType === 'warning' ? 'fa-circle-exclamation' :
                'fa-circle-info'
              }`}></i>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              {confirmModal.title}
            </h3>
            
            <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
              {confirmModal.message}
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={closeConfirm}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSubmit}
                className={`flex-1 py-4 rounded-xl font-black transition-all text-white shadow-lg text-sm uppercase tracking-wider ${
                  confirmModal.actionType === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                  confirmModal.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConnectivityStatus
        isCloudConnected={false}
        controllerStatus={controllerStatus}
        onSwitchToLocalMode={() => {}}
        isEmergencySequencing={isEmergencySequencing}
        isHardwareTriggerActive={isHardwareTriggerActive}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Add User Section */}
          <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-3">
                <i className="fa-solid fa-user-plus text-emerald-600"></i> User Management
              </h3>
              <button onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                <i className={`fa-solid ${showAddUser ? 'fa-times' : 'fa-plus'} mr-1`}></i>
                {showAddUser ? 'Cancel' : 'Add User'}
              </button>
            </div>
            {showAddUser && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Full Name</label>
                    <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)}
                      placeholder="e.g. Ahmad"
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Role</label>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as 'staff' | 'admin')}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-400">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">User ID (4-Digit)</label>
                    <input type="text" maxLength={4} value={newUserId} onChange={e => setNewUserId(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0000"
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">PIN (4-6 Digit)</label>
                    <input type="password" maxLength={6} value={newUserPin} onChange={e => setNewUserPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••••"
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-400" />
                  </div>
                </div>
                <button onClick={handleAddUser}
                  className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-colors">
                  Create User
                </button>
              </div>
            )}
          </div>

          <IdentityList 
            users={registeredUsers}
            isUserBorrowing={isUserBorrowing}
            onApproveUser={(id) => confirmAction(
              'Approve User',
              'Are you sure you want to approve this user? This will grant them access to the system.',
              'Approve',
              'info',
              () => onApproveUser(id)
            )}
            onToggleUserRole={(id) => confirmAction(
              'Change User Role',
              'Are you sure you want to change this user\'s role? This will alter their permissions across the system.',
              'Change Role',
              'warning',
              () => onToggleUserRole(id)
            )}
            onDeactivateUser={(id) => confirmAction(
              'Deactivate User',
              'Are you sure you want to deactivate this user? They will not be able to access the system until reactivated.',
              'Deactivate',
              'warning',
              () => onDeactivateUser(id)
            )}
            onActivateUser={(id) => confirmAction(
              'Activate User',
              'Are you sure you want to activate this user? They will regain access to the system.',
              'Activate',
              'info',
              () => onActivateUser(id)
            )}
            onUnlockUser={(id) => confirmAction(
              'Unlock User',
              'Are you sure you want to unlock this user? Their account will be accessible again.',
              'Unlock',
              'info',
              () => onUnlockUser(id)
            )}
            onDeleteUser={(id) => confirmAction(
              'Delete User',
              'Are you sure you want to permanently delete this user? This action cannot be undone and will remove all their access credentials.',
              'Delete User',
              'danger',
              () => onDeleteUser(id)
            )}
            onUpdateUserCredentials={onUpdateUserCredentials}
          />

          <CbmPanel 
            slots={slots}
            config={config}
            onMaintenanceRequest={onMaintenanceRequest}
            recentlyMaintained={recentlyMaintained}
            controllerStatus={controllerStatus}
          />

        </div>

        <div className="lg:col-span-4 space-y-6">
          <CloudConnectionConfig
            sysConfig={config}
            onUpdateSysConfig={onUpdateConfig}
            onConnect={async () => {}}
            onDisconnect={() => {}}
            isConnected={false}
            networkMode="local"
            setNetworkMode={() => {}}
            onConnectBluetooth={onConnectBluetooth}
            currentUser={currentUser}
          />

          <SystemModules 
            config={config}
            onUpdateConfig={onUpdateConfig}
          />

          <GlobalPolicyConfig
            tempConfig={tempConfig}
            setTempConfig={setTempConfig}
            onSave={saveConfig}
            isMqttConnected={false}
            isBluetoothConnected={isBluetoothConnected}
            bluetoothStatus={bluetoothStatus}
          />

          <HardwareRegistration 
            isAddingModule={isAddingModule}
            setIsAddingModule={setIsAddingModule}
            onAddModule={onAddModule}
            currentRackCount={Math.ceil(slots.length / 4)}
          />

          <RackTopology 
            slots={slots}
            activeAdminModuleIndex={activeAdminModuleIndex}
            setActiveAdminModuleIndex={setActiveAdminModuleIndex}
            onUpdateSlotLabel={onUpdateSlotLabel}
            onToggleSlotLock={onToggleSlotLock}
            onDeleteModule={(idx) => confirmAction(
              'Decommission Module',
              'Are you sure you want to decommission this module? All associated keys will be permanently unassigned from this physical pegboard.',
              'Decommission',
              'danger',
              () => onDeleteModule(idx)
            )}
            isSystemLocked={isSystemLocked}
            setIsSystemLocked={setIsSystemLocked}
            onEmergencyRelease={onEmergencyRelease}
            onUnlockDoor={onUnlockDoor}
            isEmergencySequencing={isEmergencySequencing}
            sequenceProgress={sequenceProgress}
            isHardwareTriggerActive={isHardwareTriggerActive}
            doorOpen={controllerStatus?.doorOpen}
          />
        </div>
      </div>
    </div>
  );
};
