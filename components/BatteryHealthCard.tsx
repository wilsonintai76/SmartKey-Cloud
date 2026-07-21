import React, { useMemo } from 'react';
import { KeySlot } from '../types';

interface BatteryHealthCardProps {
  slots: KeySlot[];
}

export const BatteryHealthCard: React.FC<BatteryHealthCardProps> = ({ slots }) => {
  // Use the voltage from the first slot, or default to 12.5 if not available
  const currentVoltage = slots.length > 0 && slots[0].voltage ? slots[0].voltage : 12.5;
  
  // Logic for a typical 12V SLA backup battery
  // > 13.0V -> Charging (AC Power present)
  // 12.7V -> 100% (Discharging)
  // 11.5V -> 0% (Discharging)
  const isCharging = currentVoltage > 13.0;
  
  // Cap at 12.7 for percentage calculation if discharging, or just say 100% if charging
  const calcVoltage = Math.min(Math.max(currentVoltage, 11.5), 12.7);
  const percentage = isCharging ? 100 : Math.round(((calcVoltage - 11.5) / (12.7 - 11.5)) * 100);

  // Estimate time remaining: say max 24 hours at 100%
  const timeRemainingHours = (percentage / 100) * 24;
  const hours = Math.floor(timeRemainingHours);
  const minutes = Math.floor((timeRemainingHours - hours) * 60);

  return (
    <div className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Battery Health</h3>
        <div className={`px-2 py-1 rounded-md flex items-center gap-1.5 ${isCharging ? 'bg-emerald-50 text-emerald-600' : percentage < 20 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
          <i className={`fa-solid text-[10px] ${isCharging ? 'fa-bolt animate-pulse' : percentage < 20 ? 'fa-battery-quarter' : 'fa-battery-three-quarters'}`}></i>
          <span className="text-[9px] font-black uppercase tracking-wider">
            {isCharging ? 'AC Power / Charging' : 'On Battery'}
          </span>
        </div>
      </div>

      <div className="space-y-5 relative z-10">
        {/* Main Status */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Current Level</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{percentage}%</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Input Voltage</p>
             <span className="text-lg font-mono font-black text-slate-600">{currentVoltage.toFixed(2)}V</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isCharging ? 'bg-emerald-500' : percentage < 20 ? 'bg-rose-500' : 'bg-blue-500'}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Time Remaining Estimate */}
        {!isCharging && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${percentage < 20 ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                <i className="fa-solid fa-clock text-[10px]"></i>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Est. Time Remaining</p>
                <p className="text-xs font-black text-slate-700">{hours}h {minutes}m</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <i className={`fa-solid fa-car-battery absolute -bottom-4 -right-4 text-7xl text-slate-50 group-hover:scale-110 transition-transform ${isCharging ? 'text-emerald-50 opacity-50' : ''}`}></i>
    </div>
  );
};
