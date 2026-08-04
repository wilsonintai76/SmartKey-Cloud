
import React from 'react';
import { KeyStatus, KeySlot, LogEntry, SystemConfig, ControllerStatus, UserAccount } from '../types';
import { EmergencyBanners } from './EmergencyBanners';
import { ConnectivityStatus } from './ConnectivityStatus';
import { ResourcesPanel } from './ResourcesPanel';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardProps {
  slots: KeySlot[];
  activeModuleIndex: number;
  setActiveModuleIndex: (index: number) => void;
  isAdminMode: boolean;
  initiateUnlock: (id: number) => void;
  onUnlockDoor: () => void;
  handleForceReturn: (id: number) => void;
  handleMaintenanceRequest: (id: number) => void;
  config: SystemConfig;
  user: UserAccount;
  logs: LogEntry[];
  isSystemLocked: boolean;
  addLog: (userName: string, action: string, keyLabel: string, type: 'success' | 'warning' | 'info') => void;
  exportLogs: () => void;
  unlockQueue?: number[]; 
  isEmergencySequencing?: boolean; 
  sequenceProgress?: string;       
  isPostEmergency?: boolean;
  onSystemReset?: () => void;
  isHardwareTriggerActive?: boolean;
  controllerStatus?: ControllerStatus;
  isCloudConnected?: boolean;
  isBluetoothConnected?: boolean;
  bluetoothStatus?: string;
  onSwitchToLocalMode: () => void;
  onConnectBluetooth?: () => void;
  onUpdateSlot?: (id: number, updates: Partial<KeySlot>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  slots,
  activeModuleIndex,
  setActiveModuleIndex,
  isAdminMode,
  initiateUnlock,
  onUnlockDoor,
  handleForceReturn,
  handleMaintenanceRequest,
  config,
  user,
  logs,
  isSystemLocked,
  addLog,
  exportLogs,
  unlockQueue = [],
  isEmergencySequencing = false,
  sequenceProgress = "",
  isPostEmergency = false,
  onSystemReset,
  isHardwareTriggerActive = false,
  controllerStatus,
  isCloudConnected = false,
  isBluetoothConnected = false,
  bluetoothStatus = 'disconnected',
  onSwitchToLocalMode,
  onConnectBluetooth,
  onUpdateSlot
}) => {
  const [showOfflineCode, setShowOfflineCode] = React.useState(false);

  // Utility to group slots into racks of 4
  const chunkedSlots: KeySlot[][] = [];
  for (let i = 0; i < slots.length; i += 4) {
    chunkedSlots.push(slots.slice(i, i + 4));
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1920px] mx-auto">
      
      <EmergencyBanners
        isEmergencySequencing={isEmergencySequencing}
        sequenceProgress={sequenceProgress}
        isCloudConnected={isCloudConnected}
        isBluetoothConnected={isBluetoothConnected}
        user={user}
        isAdminMode={isAdminMode}
        isHardwareTriggerActive={isHardwareTriggerActive}
        isPostEmergency={isPostEmergency}
        isSystemLocked={isSystemLocked}
        onSystemReset={onSystemReset}
        showOfflineCode={showOfflineCode}
        setShowOfflineCode={setShowOfflineCode}
      />

      <ConnectivityStatus 
        isCloudConnected={isCloudConnected || false}
        controllerStatus={controllerStatus}
        onSwitchToLocalMode={onSwitchToLocalMode}
        isEmergencySequencing={isEmergencySequencing}
        isHardwareTriggerActive={isHardwareTriggerActive}
        isPostEmergency={isPostEmergency}
      />

      {/* Key Slot Status Overview */}
      <div className="bg-white p-4 md:p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Live Status Overview</h3>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${isHardwareTriggerActive ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <i className={`fa-solid ${isHardwareTriggerActive ? 'fa-triangle-exclamation animate-pulse' : 'fa-shield-check'}`}></i>
            HW Trigger: {isHardwareTriggerActive ? 'Active' : 'Normal'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {slots.map(slot => {
            let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let dotColor = 'bg-emerald-500';
            let icon = 'fa-check';

            if (slot.status === KeyStatus.BORROWED) {
              badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
              dotColor = 'bg-blue-500';
              icon = 'fa-user-tag';
            } else if (slot.status === KeyStatus.UNLOCKED) {
              badgeBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
              dotColor = 'bg-yellow-500 animate-pulse';
              icon = 'fa-unlock';
            }

            return (
              <div key={slot.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${badgeBg}`}>
                <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  CH-{String(slot.id).padStart(2, '0')}: {slot.status}
                </span>
                <i className={`fa-solid ${icon} text-[10px] ml-1 opacity-70`}></i>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <ResourcesPanel
          chunkedSlots={chunkedSlots}
          activeModuleIndex={activeModuleIndex}
          setActiveModuleIndex={setActiveModuleIndex}
          isBluetoothConnected={isBluetoothConnected}
          initiateUnlock={initiateUnlock}
          onUnlockDoor={onUnlockDoor}
          doorOpen={controllerStatus?.doorOpen}
          handleForceReturn={handleForceReturn}
          handleMaintenanceRequest={handleMaintenanceRequest}
          isAdminMode={isAdminMode}
          isSystemLocked={isSystemLocked || isPostEmergency || isHardwareTriggerActive}
          config={config}
          unlockQueue={unlockQueue}
          currentUser={user}
          onUpdateSlot={onUpdateSlot}
          onAddLog={addLog}
          onConnectBluetooth={onConnectBluetooth}
        />

        <DashboardSidebar
          controllerStatus={controllerStatus}
          logs={logs}
          isAdminMode={isAdminMode}
          onExport={exportLogs}
          slots={slots}
        />
      </div>
    </div>
  );
};
