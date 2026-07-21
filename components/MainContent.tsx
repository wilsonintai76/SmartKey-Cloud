
import React from 'react';
import {
  KeySlot,
  LogEntry,
  UserAccount as UserProfileData,
  SystemConfig,
  ControllerStatus,
} from '../types';
import { Dashboard } from './Dashboard';
import { AdminHub } from './AdminHub';
import { Analytics } from './Analytics';
import { SettingsView } from './SettingsView';

interface MainContentProps {
  view: 'dashboard' | 'admin' | 'analytics';
  showSettings: boolean;
  settingsTab: 'account' | 'security';
  user: UserProfileData;
  setUser: (user: UserProfileData | null) => void;
  config: SystemConfig;
  setConfig: (config: SystemConfig) => void;
  tempConfig: SystemConfig;
  setTempConfig: (config: SystemConfig) => void;
  registeredUsers: UserProfileData[];
  slots: KeySlot[];
  logs: LogEntry[];
  isAdmin: boolean;
  isSystemLocked: boolean;
  setIsSystemLocked: (locked: boolean) => void;
  bluetoothStatus: string;
  isBluetoothConnected: boolean;
  controllerStatus?: ControllerStatus;
  activeModuleIndex: number;
  setActiveModuleIndex: (index: number) => void;
  activeAdminModuleIndex: number;
  setActiveAdminModuleIndex: (index: number) => void;
  isAddingModule: boolean;
  setIsAddingModule: (adding: boolean) => void;
  recentlyMaintained: number | null;
  unlockQueue: number[];
  isEmergencySequencing: boolean;
  sequenceProgress: string;
  isPostEmergency: boolean;
  setIsPostEmergency: (post: boolean) => void;
  isHardwareTriggerActive: boolean;
  onViewChange: (view: 'dashboard' | 'admin' | 'analytics') => void;
  onUpdateUI: (updates: any) => void;
  onShowToast: (toast: any) => void;
  onAddLog: (userName: string, action: string, keyLabel: string, type: 'success' | 'warning' | 'info') => void;
  onExportLogs: () => void;
  onInitiateUnlock: (id: number) => void;
  onUnlockDoor: () => void;
  handleForceReturn: (id: number) => void;
  handleMaintenanceRequest: (id: number) => void;
  onSaveConfig: () => void;
  onApproveUser: (id: string) => void;
  onToggleUserRole: (id: string) => void;
  onDeactivateUser: (id: string) => void;
  onActivateUser: (id: string) => void;
  onUnlockUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUserCredentials: (user: UserProfileData) => void;
  onAddModule: () => void;
  onDeleteModule: (idx: number) => void;
  onUpdateSlotLabel: (id: number, label: string) => void;
  onUpdateSlot?: (id: number, updates: Partial<KeySlot>) => void;
  onToggleSlotLock: (id: number) => void;
  onSwitchToLocalMode: () => void;
  onConnectBluetooth: () => void;
  onConnectCloud: () => Promise<void>;
  onDisconnectCloud: () => void;
  networkMode: 'cloud' | 'local';
  setNetworkMode: (mode: 'cloud' | 'local') => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  view,
  showSettings,
  settingsTab,
  user,
  setUser,
  config,
  setConfig,
  tempConfig,
  setTempConfig,
  registeredUsers,
  slots,
  logs,
  isAdmin,
  isSystemLocked,
  setIsSystemLocked,
  isBluetoothConnected,
  bluetoothStatus,
  controllerStatus,
  activeModuleIndex,
  setActiveModuleIndex,
  activeAdminModuleIndex,
  setActiveAdminModuleIndex,
  isAddingModule,
  setIsAddingModule,
  recentlyMaintained,
  unlockQueue,
  isEmergencySequencing,
  sequenceProgress,
  isPostEmergency,
  setIsPostEmergency,
  isHardwareTriggerActive,
  onUpdateUI,
  onShowToast,
  onAddLog,
  onExportLogs,
  onInitiateUnlock,
  onUnlockDoor,
  handleForceReturn,
  handleMaintenanceRequest,
  onSaveConfig,
  onApproveUser,
  onToggleUserRole,
  onDeactivateUser,
  onActivateUser,
  onUnlockUser,
  onDeleteUser,
  onUpdateUserCredentials,
  onAddModule,
  onDeleteModule,
  onUpdateSlotLabel,
  onUpdateSlot,
  onToggleSlotLock,
  onSwitchToLocalMode,
  onConnectBluetooth,
  onConnectCloud,
  onDisconnectCloud,
  networkMode,
  setNetworkMode
}) => {
  return (
    <main className="flex-1 p-3 md:p-8 max-w-[1920px] mx-auto w-full pb-24 md:pb-8">
      {showSettings ? (
        <SettingsView
          user={user}
          setUser={setUser}
          config={config}
          setConfig={setConfig}
          subTab={settingsTab}
          setSubTab={(tab) => onUpdateUI({ settingsTab: tab })}
          onClose={() => onUpdateUI({ showSettings: false })}
          onShowToast={onShowToast}
        />
      ) : view === "dashboard" ? (
        <Dashboard
          slots={slots}
          activeModuleIndex={activeModuleIndex}
          setActiveModuleIndex={setActiveModuleIndex}
          isAdminMode={isAdmin}
          initiateUnlock={onInitiateUnlock}
          onUnlockDoor={onUnlockDoor}
          handleForceReturn={handleForceReturn}
          handleMaintenanceRequest={handleMaintenanceRequest}
          config={config}
          user={user}
          logs={logs}
          isSystemLocked={isSystemLocked}
          addLog={onAddLog}
          exportLogs={onExportLogs}
          unlockQueue={unlockQueue}
          isEmergencySequencing={isEmergencySequencing}
          sequenceProgress={sequenceProgress}
          isPostEmergency={isPostEmergency}
          onSystemReset={() => setIsPostEmergency(false)}
          isHardwareTriggerActive={isHardwareTriggerActive}
          controllerStatus={controllerStatus}
          isBluetoothConnected={isBluetoothConnected}
          bluetoothStatus={bluetoothStatus}
          onSwitchToLocalMode={onSwitchToLocalMode}
          onConnectBluetooth={onConnectBluetooth}
          onUpdateSlot={onUpdateSlot}
        />
      ) : view === "admin" ? (
        <AdminHub
          slots={slots}
          registeredUsers={registeredUsers}
          config={config}
          tempConfig={tempConfig}
          setTempConfig={setTempConfig}
          saveConfig={onSaveConfig}
          onUpdateConfig={(updates) => setConfig({ ...config, ...updates })}
          isSystemLocked={isSystemLocked}
          setIsSystemLocked={setIsSystemLocked}
          isAdminMode={isAdmin}
          isBluetoothConnected={isBluetoothConnected}
          bluetoothStatus={bluetoothStatus}
          onApproveUser={onApproveUser}
          onToggleUserRole={onToggleUserRole}
          onDeactivateUser={onDeactivateUser}
          onActivateUser={onActivateUser}
          onUnlockUser={onUnlockUser}
          onDeleteUser={onDeleteUser}
          onUpdateUserCredentials={onUpdateUserCredentials}
          onAddModule={onAddModule}
          onDeleteModule={onDeleteModule}
          onUpdateSlotLabel={onUpdateSlotLabel}
          onToggleSlotLock={onToggleSlotLock}
          onMaintenanceRequest={handleMaintenanceRequest}
          onUnlockDoor={onUnlockDoor}
          recentlyMaintained={recentlyMaintained}
          isUserBorrowing={(name) => slots.some((s) => s.borrowedBy === name)}
          activeAdminModuleIndex={activeAdminModuleIndex}
          setActiveAdminModuleIndex={setActiveAdminModuleIndex}
          isAddingModule={isAddingModule}
          setIsAddingModule={setIsAddingModule}
          onConnect={() => {}}
          onDisconnect={() => {}}
          networkMode={networkMode}
          setNetworkMode={setNetworkMode}
          onConnectBluetooth={onConnectBluetooth}
          currentUser={user}
          onEmergencyRelease={async () => {
            onUpdateUI({ isEmergencySequencing: true, sequenceProgress: "INIT" });
          }}
          isEmergencySequencing={isEmergencySequencing}
          sequenceProgress={sequenceProgress}
          isHardwareTriggerActive={isHardwareTriggerActive}
          controllerStatus={controllerStatus}
        />
      ) : view === "analytics" ? (
        <Analytics
          slots={slots}
          logs={logs}
          config={config}
          isAdminMode={isAdmin}
          user={user}
        />
      ) : null}
    </main>
  );
};
