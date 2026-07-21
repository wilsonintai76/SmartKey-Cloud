
import React from 'react';
import { UserAccount } from '../types';

interface EmergencyBannersProps {
  isEmergencySequencing: boolean;
  sequenceProgress: string;
  isCloudConnected: boolean;
  isBluetoothConnected: boolean;
  user: UserAccount;
  isAdminMode: boolean;
  isHardwareTriggerActive: boolean;
  isPostEmergency: boolean;
  isSystemLocked: boolean;
  onSystemReset?: () => void;
  showOfflineCode: boolean;
  setShowOfflineCode: (val: boolean) => void;
}

export const EmergencyBanners: React.FC<EmergencyBannersProps> = ({
  isEmergencySequencing,
  sequenceProgress,
  isCloudConnected,
  isBluetoothConnected,
  user,
  isAdminMode,
  isHardwareTriggerActive,
  isPostEmergency,
  isSystemLocked,
  onSystemReset,
  showOfflineCode,
  setShowOfflineCode
}) => {
  return (
    <>
      {/* 1. SEQUENCING BANNER */}
      {isEmergencySequencing && (
        <div className="bg-amber-500 text-white p-6 rounded-[32px] shadow-2xl shadow-amber-500/40 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse border-4 border-amber-300 relative overflow-hidden">
           <i className="fa-solid fa-person-running absolute -right-6 -bottom-6 text-9xl text-amber-600/20 -rotate-12"></i>
           <div className="flex items-center gap-5 relative z-10">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-fire text-4xl text-amber-500 animate-bounce"></i>
             </div>
             <div>
               <h3 className="font-black uppercase tracking-widest text-xl md:text-2xl leading-none">Emergency Release Active</h3>
               <p className="font-bold text-amber-100 text-xs md:text-sm mt-1">Master Cabinet Solenoid Override Engaged</p>
             </div>
           </div>
           <div className="flex flex-col items-end relative z-10">
              <span className="text-[10px] font-black uppercase text-amber-100 tracking-widest mb-1">Release Progress</span>
              <div className="bg-white/20 px-8 py-2 rounded-2xl font-mono font-black text-4xl backdrop-blur-sm border border-white/30">
                 {sequenceProgress}
              </div>
           </div>
        </div>
      )}

      {/* 4. TOTAL OFFLINE ACCESS (No Network, No BT) */}
      {!isCloudConnected && !isBluetoothConnected && (
        <div className="bg-white border-2 border-slate-900 overflow-hidden rounded-[32px] shadow-xl mb-8">
           <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-signal-slash text-rose-500"></i>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep Offline Protocol</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase text-emerald-400">ESP32 DevKitC Storage Ready</span>
              </div>
           </div>
           
           <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <i className="fa-solid fa-keyboard text-2xl text-slate-900"></i>
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 leading-none">Manual Keypad Entry</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Identity verified via Cabinet ID & Local PIN
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="flex-1 md:flex-none flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-w-[100px]">
                    <span className="text-[9px] font-black uppercase text-slate-400">Cabinet ID</span>
                    <span className="text-xl font-mono font-black text-slate-900">{user.cabinetId || '00'}</span>
                 </div>
                 <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                 <div className="flex-1 md:flex-none flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400">Secret PIN Code</span>
                    <div 
                      className={`px-8 py-2 bg-slate-900 text-white rounded-xl text-lg font-mono font-black border-2 border-slate-900 cursor-pointer transition-all ${!showOfflineCode && 'blur-md'}`}
                      onClick={() => setShowOfflineCode(!showOfflineCode)}
                    >
                       {user.offlinePin || '----'}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 text-white px-6 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                       <i className="fa-solid fa-info text-[10px] text-blue-400"></i>
                    </div>
                    <div>
                       <p className="text-[11px] font-bold">Standard Hardware Entry:</p>
                       <p className="text-[10px] text-slate-400 font-mono">CODE: [ID] * [PIN] # (e.g. {user.cabinetId || "01"} * {user.offlinePin || "****"} #)</p>
                    </div>
                 </div>
                 <div className="h-px w-full md:w-px md:h-8 bg-white/10 hidden md:block"></div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <i className="fa-solid fa-bolt text-[9px] text-amber-400"></i>
                    <span className="text-[8px] font-black uppercase text-amber-400">Emergency Override: 00 * [ID] #</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-slate-50 px-6 py-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <i className="fa-solid fa-microchip text-[10px] text-slate-400"></i>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">ESP32 Flash Sync: Local logging enabled</span>
           </div>
        </div>
      )}

      {/* 2. HARDWARE ACTIVE BANNER (RED - LATCHED) */}
      {!isEmergencySequencing && isHardwareTriggerActive && (
         <div className="bg-rose-600 text-white p-6 rounded-[32px] shadow-2xl shadow-rose-900/50 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-rose-400 relative overflow-hidden animate-pulse">
            <i className="fa-solid fa-hand absolute -left-4 -bottom-4 text-9xl text-white/10 rotate-12"></i>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                 <i className="fa-solid fa-power-off text-3xl text-rose-600"></i>
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xl md:text-2xl leading-none text-white">HARDWARE EMERGENCY ACTIVE</h3>
                <p className="font-bold text-rose-100 text-xs md:text-sm mt-1">Physical E-Stop Button is Engaged (Latched).</p>
                <div className="bg-black/20 inline-block px-3 py-1 rounded-lg mt-2">
                  <p className="text-[10px] text-white font-mono font-bold uppercase">Action Required: Twist Button to Release</p>
                </div>
              </div>
            </div>

            {isAdminMode ? (
              <button 
                onClick={onSystemReset}
                className="relative z-10 px-8 py-4 bg-rose-800 text-rose-200 rounded-2xl font-black uppercase tracking-widest shadow-lg border border-rose-500/50 flex items-center gap-3 hover:bg-rose-700 transition-colors"
                title="Will fail until hardware is released"
              >
                <i className="fa-solid fa-rotate-left"></i> Attempt Reset
              </button>
            ) : (
               <div className="relative z-10 px-6 py-3 bg-rose-800 rounded-2xl border border-rose-700 text-center">
                 <p className="text-[10px] font-black uppercase text-rose-200">System Locked by Hardware</p>
               </div>
            )}
         </div>
      )}

      {/* 3. POST-EMERGENCY BANNER (AMBER - SAFE TO RESET) */}
      {!isEmergencySequencing && !isHardwareTriggerActive && isPostEmergency && (
         <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl shadow-slate-900/50 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700 relative overflow-hidden">
            <i className="fa-solid fa-triangle-exclamation absolute -left-4 -bottom-4 text-9xl text-white/5 rotate-12"></i>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                 <i className="fa-solid fa-check text-3xl text-white"></i>
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-xl md:text-2xl leading-none text-emerald-400">System Reset Required</h3>
                <p className="font-bold text-slate-400 text-xs md:text-sm mt-1">Hardware E-Stop has been released. Cabinet door locked.</p>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">To resume normal operations, an Admin must acknowledge this event.</p>
              </div>
            </div>

            {isAdminMode ? (
              <button 
                onClick={onSystemReset}
                className="relative z-10 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-3"
              >
                <i className="fa-solid fa-check-circle"></i> Acknowledge & Reset
              </button>
            ) : (
               <div className="relative z-10 px-6 py-3 bg-slate-800 rounded-2xl border border-slate-700 text-center">
                 <p className="text-[10px] font-black uppercase text-slate-400">Admin Authorization Needed</p>
               </div>
            )}
         </div>
      )}

      {/* LOCKDOWN BANNER (Only if no higher priority emergency) */}
      {isSystemLocked && !isEmergencySequencing && !isPostEmergency && !isHardwareTriggerActive && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-xl shadow-rose-200 mb-8 flex items-center justify-center gap-3 animate-pulse border border-rose-400">
          <i className="fa-solid fa-lock text-xl"></i>
          <span className="font-black uppercase tracking-widest text-xs md:text-sm">Emergency Protocols Active: Workshop Lockdown</span>
        </div>
      )}
    </>
  );
};
