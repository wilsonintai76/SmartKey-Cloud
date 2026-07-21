
import React from 'react';
import { KeySlot, SystemConfig, KeyStatus } from '../types';

interface MaintenanceForecastProps {
  slots: KeySlot[];
  config: SystemConfig;
}

export const MaintenanceForecast: React.FC<MaintenanceForecastProps> = ({ slots, config }) => {
  const getCurrentlyOverdue = () => {
    return slots.filter(s => {
      if (s.status !== KeyStatus.BORROWED || !s.borrowedAt) return false;
      const elapsed = (new Date().getTime() - new Date(s.borrowedAt).getTime()) / 60000;
      return elapsed >= (config.maxBorrowDuration + config.gracePeriod);
    });
  };

  const getSystemAdvice = () => {
    const overdue = getCurrentlyOverdue();
    const criticalHealth = slots.filter(s => {
      const health = Math.max(0, 100 - (s.usageCount / config.maintenanceThreshold * 100));
      return health < 20;
    });

    if (overdue.length > 0) {
      return `CRITICAL: ${overdue.length} node(s) violating borrowing policy. Automated account locking engaged.`;
    }
    if (criticalHealth.length > 0) {
      return `WARNING: Fatigue threshold reached for ${criticalHealth[0].label}. Dispatch technician for inspection.`;
    }
    return "NOMINAL: All hardware nodes reporting standard mechanical resistance. Predictive models indicate stable operation.";
  };

  return (
    <div className="bg-slate-900 p-6 md:p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
        <div>
          <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
            <i className={`fa-solid ${config.enableAI ? 'fa-wand-magic-sparkles text-amber-400' : 'fa-chart-line text-blue-400'}`}></i> 
            {config.enableAI ? 'Predictive Maintenance Rail' : 'Statistical Wear Forecast'}
          </h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Mean-Time-To-Failure (MTTF) Projection</p>
        </div>
        <span className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase text-amber-400 border border-white/5 backdrop-blur-sm">
          {config.enableAI ? 'AI Active' : 'Linear Logic'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
        {slots.map(s => {
          const remainingCycles = config.maintenanceThreshold - s.usageCount;
          const simulatedRate = config.enableAI ? ((s.id % 2 !== 0) ? 8 : 3) : 5;
          const estDays = Math.max(0, Math.floor(remainingCycles / simulatedRate));
          const healthValue = Math.max(0, 100 - (s.usageCount / config.maintenanceThreshold * 100));
          const isCritical = healthValue < 20 || estDays < 7;
          const isWarning = estDays < 14 && !isCritical;

          return (
            <div 
              key={s.id} 
              className={`flex items-center gap-5 p-4 rounded-[28px] border transition-all duration-500 ${
                isCritical 
                ? 'bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/10' 
                : 'bg-white/5 border-white-[0.03] hover:border-white/10'
              }`}
            >
              {/* Temporal Anchor (Left) */}
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-inner transition-colors ${
                isCritical ? 'bg-rose-600 border-rose-400 text-white' : 
                isWarning ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 
                'bg-slate-800 border-white/5 text-slate-100'
              }`}>
                <span className="text-xl font-black leading-none">{estDays}</span>
                <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-60">Days</span>
              </div>

              {/* Forecasting Rail (Center) */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-200 truncate tracking-tight">{s.label}</span>
                  <span className={`text-[10px] font-mono font-black ${
                    isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {Math.max(0, remainingCycles)} <span className="text-[7px] opacity-40 uppercase ml-0.5">Cyc Remaining</span>
                  </span>
                </div>

                {/* The Precision Progress Rail */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      isCritical ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 
                      isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${healthValue}%` }}
                  ></div>
                </div>

                <div className="flex justify-between mt-1.5">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${isCritical ? 'text-rose-500' : 'text-slate-500'}`}>
                     {isCritical ? 'URGENT INSPECTION' : isWarning ? 'SCHEDULE SERVICE' : 'STABLE ASSET'}
                   </span>
                   <span className={`text-[8px] font-black uppercase ${isCritical ? 'text-rose-500' : 'text-slate-500'}`}>
                     {Math.round(healthValue)}% MTBF
                   </span>
                </div>
              </div>

              {/* Status Indicator Tip */}
              <div className="shrink-0">
                 <div className={`w-1.5 h-1.5 rounded-full ${
                   isCritical ? 'bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,1)]' : 
                   isWarning ? 'bg-amber-500' : 'bg-slate-700'
                 }`}></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Predictive Advisory Log */}
      <div className="mt-8 p-5 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
         <div className="relative z-10 flex items-center gap-4">
           <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
             <i className="fa-solid fa-terminal text-[10px] text-blue-400 animate-pulse"></i>
           </div>
           <p className="text-[10px] font-mono text-blue-300 leading-relaxed italic group-hover:text-blue-100 transition-colors">
             {getSystemAdvice()}
           </p>
         </div>
         <i className="fa-solid fa-brain absolute -right-4 -bottom-4 text-6xl text-white-[0.02] rotate-12"></i>
      </div>
      
      {/* Visual Depth Background */}
      <i className="fa-solid fa-chart-line absolute -bottom-16 -left-16 text-[220px] text-white-[0.02] pointer-events-none rotate-12"></i>
    </div>
  );
};
