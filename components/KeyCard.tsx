
import React, { useState, useEffect } from 'react';
import { KeyStatus, KeySlot } from '../types';

interface KeyCardProps {
  slot: KeySlot;
  onUnlock: (id: number) => void;
  onForceReturn: (id: number) => void;
  onMaintenance: (id: number) => void;
  isAdminMode: boolean;
  isSystemLocked: boolean;
  maxDuration: number;
  gracePeriod: number;
  maintenanceThreshold: number;
  isQueued?: boolean; // New Prop
  isBluetoothConnected?: boolean;
  currentUser?: { name: string; id: string } | null;
  onUpdateSlot?: (id: number, updates: Partial<KeySlot>) => void;
  onAddLog?: (userName: string, action: string, message: string, type: "success" | "info" | "warning" | "error", userId?: string, slotId?: number) => void;
}

export const KeyCard: React.FC<KeyCardProps> = ({ 
  slot, 
  onUnlock, 
  onForceReturn, 
  onMaintenance, 
  isAdminMode, 
  isSystemLocked, 
  maxDuration, 
  gracePeriod, 
  maintenanceThreshold,
  isQueued = false,
  isBluetoothConnected = false,
  currentUser,
  onUpdateSlot,
  onAddLog
}) => {
  const isAvailable = slot.status === KeyStatus.AVAILABLE;
  const isUnlocked = slot.status === KeyStatus.UNLOCKED;
  const isOccupied = slot.status === KeyStatus.BORROWED;
  const isEffectivelyLocked = (slot.isLocked || false) || isSystemLocked;
  
  const handleKeyWithdrawn = () => {
    // Guard: skip if microswitch already detected the physical removal
    if (slot.status !== KeyStatus.UNLOCKED) return;
    if (currentUser && onUpdateSlot && onAddLog) {
      onUpdateSlot(slot.id, {
        status: KeyStatus.BORROWED,
        borrowedBy: currentUser.name,
        borrowerId: currentUser.id,
        borrowedAt: new Date().toISOString(),
        usageCount: slot.usageCount + 1,
      });
      onAddLog(currentUser.name, "Key Withdrawn", slot.label, "success", currentUser.id, slot.id);
    }
  };
  
  const [elapsed, setElapsed] = useState<number>(0);

  // Usage cycle health (real borrow counter vs maintenance threshold)
  const usageRatio = Math.min(1, slot.usageCount / maintenanceThreshold);
  const healthPercent = Math.round((1 - usageRatio) * 100);
  
  const isCritical = healthPercent < 20;
  const isWarning = healthPercent < 50 && healthPercent >= 20;

  useEffect(() => {
    let interval: number;
    if (isOccupied && slot.borrowedAt) {
      const calculate = () => {
        const start = new Date(slot.borrowedAt!).getTime();
        const now = new Date().getTime();
        setElapsed(Math.floor((now - start) / 60000));
      };
      calculate();
      interval = window.setInterval(calculate, 10000); 
    }
    return () => clearInterval(interval);
  }, [isOccupied, slot.borrowedAt]);

  const isOverdue = isOccupied && elapsed >= (maxDuration + gracePeriod);

  // Dynamic Theme Logic: Security (Red) > Maintenance (Amber) > Usage (Blue) > Idle (White)
  const getCardTheme = () => {
    if (isSystemLocked) return 'bg-rose-50/10 border-rose-100';
    if (isOverdue) return 'bg-rose-50 border-rose-200 ring-4 ring-rose-500/10';
    if (isCritical) return 'bg-amber-50 border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.15)]'; // Maintenance Priority
    if (isOccupied) return 'bg-blue-50/30 border-blue-100 shadow-[0_15px_40px_rgba(37,99,235,0.06)]';
    if (isQueued) return 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-400/20'; // Queue State
    return 'bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:scale-[1.02]';
  };

  const getAccentColor = () => {
    if (isQueued) return 'bg-yellow-400';
    if (isOverdue || isSystemLocked) return 'bg-rose-500';
    if (isCritical) return 'bg-amber-500'; // Maintenance Accent
    if (isOccupied) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getIconStyle = () => {
    if (isQueued) return 'bg-yellow-400 text-white border-yellow-300 animate-pulse';
    if (isOverdue) return 'bg-rose-500 text-white border-rose-400 animate-pulse';
    if (isCritical && !isSystemLocked) return 'bg-amber-500 text-white border-amber-400';
    if (isOccupied) return 'bg-blue-600 text-white border-blue-400';
    if (isEffectivelyLocked) return 'bg-slate-200 text-slate-500 border-slate-300';
    return 'bg-emerald-500 text-white border-emerald-400';
  };

  return (
    <div className={`group p-4 md:p-8 rounded-[32px] md:rounded-[40px] transition-all duration-500 flex flex-col h-full relative overflow-hidden border ${getCardTheme()}`}>
      
      {/* Decorative Brand Accent */}
      <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${getAccentColor()}`}></div>

      {/* Header Info */}
      <div className="flex justify-between items-start mb-4 md:mb-6 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
             <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm transition-all ${getIconStyle()}`}>
               {isQueued ? <i className="fa-solid fa-hourglass-start text-[9px]"></i> :
                isOverdue ? <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> : 
                isCritical && !isSystemLocked ? <i className="fa-solid fa-wrench text-[9px]"></i> :
                isOccupied ? <i className="fa-solid fa-user-tag text-[9px]"></i> :
                isEffectivelyLocked ? <i className="fa-solid fa-lock text-[9px]"></i> :
                <i className="fa-solid fa-door-open text-[9px]"></i>}
             </div>
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
               CH-{String(slot.id).padStart(2, '0')}
             </span>
             {isCritical && !isSystemLocked && (
               <span className="ml-auto text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                 Service Req
               </span>
             )}
          </div>
          
          <h3 className="font-black text-sm md:text-2xl text-slate-900 leading-tight tracking-tight truncate">
            {slot.label}
          </h3>
        </div>
      </div>

      {/* Core Actuation UI */}
      <div className="flex flex-col items-center py-2 md:py-4 flex-grow relative z-10">
        <button
          onClick={() => isUnlocked ? handleKeyWithdrawn() : onUnlock(slot.id)}
          disabled={(isUnlocked && !currentUser) || isOccupied || isEffectivelyLocked || isQueued}
          className={`w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center text-2xl md:text-4xl font-black transition-all shadow-[0_15px_45px_rgba(0,0,0,0.1)] relative active:scale-90
            ${isQueued ? 'bg-yellow-400 text-white cursor-wait opacity-90' :
              isUnlocked ? 'bg-emerald-400 text-white animate-pulse' : 
              isSystemLocked ? 'bg-slate-900 text-rose-500 opacity-90' :
              isCritical ? 'bg-amber-100 text-amber-600 border-2 border-amber-200 hover:bg-amber-200' :
              isOccupied ? 'bg-white text-blue-600 border border-blue-100 shadow-none' : 
              'bg-slate-950 text-white hover:bg-slate-800'} 
          `}
        >
          {isQueued ? <i className="fa-solid fa-hourglass-half animate-pulse"></i> :
           isUnlocked ? <i className="fa-solid fa-hand-holding"></i> : 
           isOccupied ? <i className="fa-solid fa-user-check"></i> : 
           isCritical ? <i className="fa-solid fa-screwdriver-wrench text-3xl"></i> :
           <i className="fa-solid fa-power-off"></i>}
           
           {isAvailable && !isEffectivelyLocked && !isCritical && !isQueued && (
             <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></span>
           )}
        </button>
        
        {/* Status Messaging */}
        <div className="mt-4 md:mt-6 flex flex-col items-center gap-1 md:gap-2">
           {isOccupied ? (
             <div className="flex flex-col items-center animate-fadeIn">
               <span className="text-[8px] font-black uppercase text-blue-500 tracking-[0.2em] mb-1">Key Removed</span>
               <div className="bg-blue-600 px-4 py-1.5 rounded-full shadow-lg shadow-blue-200">
                 <p className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                   {slot.borrowedBy || 'Guest'}
                 </p>
               </div>
             </div>
           ) : (
             <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isQueued ? 'text-yellow-600' : isCritical ? 'text-amber-600' : 'text-slate-400'}`}>
               {isQueued ? 'Waiting for Door...' : isUnlocked ? 'Door Unlocked...' : isSystemLocked ? 'Lockdown Active' : isCritical ? 'Maintenance Due' : isBluetoothConnected ? 'Key Detected' : 'No Signal'}
             </p>
           )}
        </div>
      </div>

      {/* Hardware Health Footer */}
      <div className={`mt-auto space-y-3 md:space-y-4 pt-4 md:pt-6 border-t relative z-10 ${isCritical ? 'border-amber-200' : 'border-slate-100'}`}>
        
        {/* Electromechanical Integrity Rail */}
        <div className={`rounded-xl p-2 md:p-3 border ${isCritical ? 'bg-white/60 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <i className={`fa-solid fa-gears text-[10px] ${isCritical ? 'text-rose-500' : 'text-slate-400'}`}></i>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isCritical ? 'text-amber-700' : 'text-slate-500'}`}>Usage Cycles</span>
            </div>
            <span className={`text-[9px] font-black ${isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
              {healthPercent}%
            </span>
          </div>
          
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-1.5">
            <div 
              className={`h-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${healthPercent}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
             <span className={`text-[7px] font-black uppercase tracking-wider ${isCritical ? 'text-amber-600' : 'text-slate-400'}`}>
               {slot.usageCount} / {maintenanceThreshold} Cycles
             </span>
             {isCritical && (
               <span className="text-[7px] font-black text-rose-500 uppercase animate-pulse">Service Due</span>
             )}
          </div>
        </div>

        {/* Session Timer (Only if occupied) */}
        {isOccupied && (
          <div className="flex justify-between items-center">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Session Time</span>
             <div className="flex items-center gap-2 bg-slate-900 text-white px-2 py-1 rounded-md">
               <i className={`fa-solid fa-clock text-[7px] ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-blue-400'}`}></i>
               <span className="text-[9px] font-mono font-black">{elapsed}m</span>
             </div>
          </div>
        )}

        {isAdminMode && isOccupied && (
          <button 
            onClick={() => onForceReturn(slot.id)} 
            className="w-full py-2.5 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100 border-dashed"
          >
            Force Close Log
          </button>
        )}
      </div>
    </div>
  );
};
