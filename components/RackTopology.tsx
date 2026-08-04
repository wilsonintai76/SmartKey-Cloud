
import React from 'react';
import { KeySlot, KeyStatus, ControllerStatus } from '../types';

interface RackTopologyProps {
  slots: KeySlot[];
  activeAdminModuleIndex: number;
  setActiveAdminModuleIndex: (idx: number) => void;
  onUpdateSlotLabel: (id: number, label: string) => void;
  onToggleSlotLock: (id: number) => void;
  onDeleteModule: (idx: number) => void;
  isSystemLocked: boolean;
  setIsSystemLocked: (val: boolean) => void;
  onEmergencyRelease: () => Promise<void>;
  onUnlockDoor?: () => void;
  isEmergencySequencing: boolean;
  isHardwareTriggerActive?: boolean; 
  doorOpen?: boolean;
  controllerStatus?: ControllerStatus;
}

export const RackTopology: React.FC<RackTopologyProps> = ({
  slots,
  activeAdminModuleIndex,
  setActiveAdminModuleIndex,
  onUpdateSlotLabel,
  onToggleSlotLock,
  onDeleteModule,
  isSystemLocked,
  setIsSystemLocked,
  onEmergencyRelease,
  onUnlockDoor,
  isEmergencySequencing,
  isHardwareTriggerActive,
  doorOpen = false,
  controllerStatus
}) => {
  const isOnline = controllerStatus?.online ?? false;
  const getRackName = (index: number) => `Pegboard ${String(index + 1).padStart(2, '0')}`;

  const chunkedSlots: KeySlot[][] = [];
  for (let i = 0; i < slots.length; i += 4) {
    chunkedSlots.push(slots.slice(i, i + 4));
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-3">
          <i className="fa-solid fa-network-wired text-blue-600"></i> Pegboard Topology
        </h3>
        {isSystemLocked && (
          <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest border border-rose-200">
            Bus Inhibited
          </span>
        )}
      </div>

      {/* Tabbed Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
        {chunkedSlots.map((chunk, idx) => {
          const hasActivity = chunk.some(s => s.status !== KeyStatus.AVAILABLE);
          return (
            <button 
              key={idx} 
              onClick={() => setActiveAdminModuleIndex(idx)} 
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all relative ${
                activeAdminModuleIndex === idx 
                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
              }`}
            >
              {getRackName(idx)}
              {isSystemLocked && <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></div>}
            </button>
          );
        })}
      </div>

      {/* Node List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar py-2">
        {chunkedSlots[activeAdminModuleIndex]?.map(s => {
          const isNodeLocked = s.isLocked || isSystemLocked;
          
          return (
            <div key={s.id} className="group animate-fadeIn">
              <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={s.label} 
                    disabled={isSystemLocked}
                    onChange={(e) => onUpdateSlotLabel(s.id, e.target.value)} 
                    className={`w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[11px] font-bold transition-all ${
                      isSystemLocked ? 'text-slate-400 cursor-not-allowed italic' : 'text-slate-700 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5'
                    }`} 
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase ${isSystemLocked ? 'text-rose-400' : 'text-slate-300'}`}>
                    {isSystemLocked ? 'BUS_LOCK' : `Node ${s.id}`}
                  </span>
                </div>
                
                <button 
                  onClick={() => onToggleSlotLock(s.id)} 
                  disabled={isSystemLocked}
                  className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isSystemLocked 
                    ? 'bg-rose-600 text-white cursor-not-allowed shadow-rose-200 animate-pulse' 
                    : s.isLocked 
                      ? 'bg-amber-500 text-white shadow-amber-100 scale-105' 
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-blue-500'
                  }`}
                  title={isSystemLocked ? "Global System Lockdown Active" : s.isLocked ? "Individual Maintenance Unlock" : "Lock Node for Maintenance"}
                >
                  <i className={`fa-solid ${isSystemLocked ? 'fa-shield-halved' : s.isLocked ? 'fa-lock' : 'fa-lock-open'} text-xs`}></i>
                </button>
              </div>
            </div>
          );
        })}

        {chunkedSlots.length === 0 && (
          <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase">No Hardware Mapped</p>
          </div>
        )}
      </div>

      {/* Global Actions for this Rack */}
      <div className="pt-6 border-t border-slate-50 mt-4 space-y-3">
        {chunkedSlots.length > 0 && (
          <button 
            onClick={() => onDeleteModule(activeAdminModuleIndex)} 
            disabled={isSystemLocked || isHardwareTriggerActive}
            className={`w-full py-3 text-[10px] font-black uppercase rounded-xl transition-colors flex items-center justify-center gap-2 ${
              isSystemLocked || isHardwareTriggerActive ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'
            }`}
          >
            <i className="fa-solid fa-trash-can"></i> Decommission {getRackName(activeAdminModuleIndex)}
          </button>
        )}
        
        <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setIsSystemLocked(!isSystemLocked)} 
              disabled={isHardwareTriggerActive}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex flex-col items-center justify-center gap-2 ${
                isSystemLocked 
                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                : isHardwareTriggerActive 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 text-white shadow-slate-200 hover:bg-slate-700'
              }`}
            >
              <i className={`fa-solid ${isSystemLocked ? 'fa-shield-halved' : 'fa-bolt-lightning'} text-lg`}></i>
              {isSystemLocked ? 'Clear Lockdown' : 'Soft Lockdown'}
            </button>

            {/* CONTROLLER STATUS INDICATOR (Non-Interactive) */}
            <div 
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-500 border border-rose-200' 
              } ${isEmergencySequencing ? 'opacity-80' : ''}`}
            >
               <i className={`fa-solid ${isOnline ? 'fa-wifi' : 'fa-plug-circle-xmark'} text-lg`}></i>
               <span>{isOnline ? 'Controller Online' : 'Controller Offline'}</span>
            </div>
        </div>
        <div className="pt-3">
          <button 
            onClick={onUnlockDoor} 
            disabled={doorOpen || isHardwareTriggerActive}
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-2 ${
              doorOpen 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : isHardwareTriggerActive 
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'
            }`}
          >
            <i className={`fa-solid ${doorOpen ? 'fa-door-open' : 'fa-key'}`}></i>
            {doorOpen ? 'Cabinet Open' : 'Release Master Lock'}
          </button>
        </div>

        <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-1">
          {isOnline ? "Controller link active." : "Controller unreachable. Connect via BLE."}
        </p>
      </div>
    </div>
  );
};
