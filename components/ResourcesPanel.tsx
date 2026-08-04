
import React from 'react';
import { KeySlot, KeyStatus, SystemConfig } from '../types';
import { KeyCard } from './KeyCard';

interface ResourcesPanelProps {
  chunkedSlots: KeySlot[][];
  activeModuleIndex: number;
  setActiveModuleIndex: (index: number) => void;
  isBluetoothConnected: boolean;
  initiateUnlock: (id: number) => void;
  onUnlockDoor: () => void;
  handleForceReturn: (id: number) => void;
  handleMaintenanceRequest: (id: number) => void;
  isAdminMode: boolean;
  isSystemLocked: boolean;
  config: SystemConfig;
  unlockQueue: number[];
  currentUser?: { name: string; id: string } | null;
  onUpdateSlot?: (id: number, updates: Partial<KeySlot>) => void;
  onAddLog?: (userName: string, action: string, message: string, type: "success" | "info" | "warning" | "error", userId?: string, slotId?: number) => void;
  doorOpen?: boolean;
  onConnectBluetooth?: () => void;
}

export const ResourcesPanel: React.FC<ResourcesPanelProps> = ({
  chunkedSlots,
  activeModuleIndex,
  setActiveModuleIndex,
  isBluetoothConnected,
  initiateUnlock,
  onUnlockDoor,
  handleForceReturn,
  handleMaintenanceRequest,
  isAdminMode,
  isSystemLocked,
  config,
  unlockQueue,
  currentUser,
  onUpdateSlot,
  onAddLog,
  doorOpen = false,
  onConnectBluetooth
}) => {
  const getRackName = (index: number) => `Pegboard ${String(index + 1).padStart(2, '0')}`;

  const hasStatusInChunk = (chunk: KeySlot[], status: 'overdue' | 'borrowed') => {
    if (status === 'overdue') {
      return chunk.some(s => {
        if (s.status !== KeyStatus.BORROWED || !s.borrowedAt) return false;
        const elapsed = (new Date().getTime() - new Date(s.borrowedAt).getTime()) / 60000;
        return elapsed >= (config.maxBorrowDuration + config.gracePeriod);
      });
    }
    return chunk.some(s => s.status === KeyStatus.BORROWED);
  };

  return (
    <div className="lg:col-span-8 xl:col-span-9 bg-white p-6 md:p-8 lg:p-10 rounded-[40px] border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Workshop Resources</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Node Monitoring</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                <div className={`w-1 h-1 rounded-full ${isBluetoothConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[8px] font-black uppercase text-slate-500">{isBluetoothConnected ? 'BLE Active' : 'BLE Offline'}</span>
              </div>
              <button 
                onClick={onConnectBluetooth}
                disabled={isBluetoothConnected}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all ${
                  isBluetoothConnected 
                  ? 'bg-blue-50 border-blue-100 text-blue-600' 
                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200 hover:text-amber-600 cursor-pointer'
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${isBluetoothConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[8px] font-black uppercase">{isBluetoothConnected ? 'Bluetooth Active' : 'Connect Bluetooth'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onUnlockDoor}
          disabled={doorOpen || !isBluetoothConnected}
          className={`flex-shrink-0 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg ${
            doorOpen 
            ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200 shadow-emerald-500/10 cursor-default' 
            : isBluetoothConnected
              ? 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700 active:scale-95'
              : 'bg-slate-100 text-slate-400 border-2 border-slate-200 shadow-none cursor-not-allowed'
          } animate-fadeIn`}
        >
          <i className={`fa-solid ${doorOpen ? 'fa-door-open' : 'fa-lock-open'}`}></i>
          {doorOpen ? 'Door Opened' : 'Unlock Main Cabinet'}
        </button>
      </div>

      {/* Rack Selection Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 custom-scrollbar">
        {chunkedSlots.length > 0 ? chunkedSlots.map((chunk, idx) => {
          const isActive = activeModuleIndex === idx;
          const hasOverdue = hasStatusInChunk(chunk, 'overdue');
          const hasBorrowed = hasStatusInChunk(chunk, 'borrowed');
          return (
            <button
              key={idx}
              onClick={() => setActiveModuleIndex(idx)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all border-2 flex items-center gap-2 relative ${
                isActive 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-500'
              }`}
            >
              {getRackName(idx)}
              {hasOverdue && <span className="w-2 h-2 rounded-full bg-rose-50 animate-pulse"></span>}
              {!hasOverdue && hasBorrowed && <span className="w-2 h-2 rounded-full bg-blue-50"></span>}
            </button>
          );
        }) : (
          <div className="text-[10px] font-bold text-slate-300 uppercase p-2">System Empty - Initialize in Control Hub</div>
        )}
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-3 md:gap-6 min-h-[400px]">
        {chunkedSlots[activeModuleIndex] ? (
          chunkedSlots[activeModuleIndex].map(s => (
            <KeyCard 
              key={s.id} 
              slot={s} 
              onUnlock={initiateUnlock} 
              onForceReturn={handleForceReturn}
              onMaintenance={handleMaintenanceRequest}
              isAdminMode={isAdminMode} 
              isSystemLocked={isSystemLocked} 
              maxDuration={config.maxBorrowDuration} 
              gracePeriod={config.gracePeriod}
              maintenanceThreshold={config.maintenanceThreshold}
              isQueued={unlockQueue.includes(s.id)}
              isBluetoothConnected={isBluetoothConnected}
              currentUser={currentUser}
              onUpdateSlot={onUpdateSlot}
              onAddLog={onAddLog}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-300 p-12">
            <i className="fa-solid fa-server text-4xl mb-4"></i>
            <p className="text-sm font-black uppercase">No Pegboards Configured</p>
            {isAdminMode && <p className="text-[10px] mt-2 text-slate-400">Go to Control Hub to initialize hardware.</p>}
          </div>
        )}
      </div>
    </div>
  );
};
