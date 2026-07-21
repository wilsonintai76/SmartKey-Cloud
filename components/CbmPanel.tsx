
import React from 'react';
import { KeySlot, SystemConfig, KeyStatus, ControllerStatus } from '../types';

interface CbmPanelProps {
  slots: KeySlot[];
  config: SystemConfig;
  onMaintenanceRequest: (id: number) => void;
  recentlyMaintained: number | null;
  controllerStatus?: ControllerStatus;
}

export const CbmPanel: React.FC<CbmPanelProps> = ({
  slots,
  config,
  onMaintenanceRequest,
  recentlyMaintained,
  controllerStatus
}) => {
  const rackModules: KeySlot[][] = [];
  for (let i = 0; i < slots.length; i += 4) {
    rackModules.push(slots.slice(i, i + 4));
  }

  const getRackName = (index: number) => `ESP32 Controller ${String(index + 1).padStart(2, '0')}`;
  
  // Calculate if online based on prop presence and value
  const isOnline = controllerStatus ? controllerStatus.online : false;

  return (
    <div className="bg-slate-950 rounded-[40px] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
      <i className="fa-solid fa-network-wired absolute -bottom-12 -right-12 text-[180px] text-white/5 pointer-events-none -rotate-12"></i>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
              <i className="fa-solid fa-microchip text-blue-400 text-sm"></i>
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-white">Maintenance Monitor</h3>
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tracking: Cabinet Solenoid & Key Microswitches</p>
        </div>
        
        <div className="flex gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${isOnline ? 'bg-slate-900 border-white/5' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`}></div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-slate-400' : 'text-rose-400'}`}>
               ESP32: {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-white/5" title="Real Time Clock Battery">
             <i className="fa-solid fa-battery-half text-[10px] text-emerald-400"></i>
             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">RTC 3.0V</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        <div className="xl:col-span-8 space-y-8 max-h-[700px] overflow-y-auto custom-scrollbar pr-4 pb-4">
          {rackModules.map((module, mIdx) => {
            const firstSlot = module[0];
            const sharedVoltage = firstSlot?.voltage || 12.00;
            const sharedLatency = firstSlot?.networkLatency || 45;
            const isVoltageStable = sharedVoltage >= 11.5 && sharedVoltage <= 12.5;

            return (
              <div key={mIdx} className="bg-[#0f172a]/40 rounded-[32px] border border-white/5 overflow-hidden">
                <div className="bg-white/5 p-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-blue-400 border border-white/10">
                      <i className="fa-solid fa-server"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-100">{getRackName(mIdx)}</span>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Input Voltage</span>
                      <span className={`text-[10px] font-mono font-black ${isVoltageStable ? 'text-slate-300' : 'text-amber-400'}`}>
                        {sharedVoltage.toFixed(2)}VDC
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Ping</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black text-slate-300">
                          {sharedLatency}ms
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Hardware</span>
                      <span className="text-[10px] font-mono font-black text-blue-400">ESP32</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {module.map(s => {
                    const healthPercent = Math.max(0, 100 - (s.usageCount / config.maintenanceThreshold * 100));
                    const isCritical = healthPercent < 20;
                    const isFreshlyMaintained = recentlyMaintained === s.id;

                    return (
                      <div 
                        key={s.id} 
                        className={`p-4 rounded-[24px] border transition-all duration-1000 ${
                          isFreshlyMaintained 
                          ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                          : isCritical 
                            ? 'bg-rose-500/5 border-rose-500/30' 
                            : 'bg-black/20 border-white-[0.03] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => onMaintenanceRequest(s.id)}
                            disabled={isFreshlyMaintained}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-md shrink-0 ${
                              isFreshlyMaintained 
                              ? 'bg-emerald-500 text-white animate-pulse' 
                              : isCritical 
                                ? 'bg-rose-600 text-white hover:bg-rose-500' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                            }`}
                          >
                            <i className={`fa-solid ${isFreshlyMaintained ? 'fa-check' : 'fa-wrench'} text-[10px]`}></i>
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-[9px] font-black uppercase text-slate-200 truncate">{s.label.split('-')[1] || s.label}</span>
                              <span className={`text-[10px] font-mono font-black ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {s.usageCount} <span className="text-[6px] opacity-40 uppercase">Clicks</span>
                              </span>
                            </div>
                            
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 rounded-full ${
                                  isCritical ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${healthPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center px-1">
                          <div className="flex items-center gap-1.5">
                            <i className="fa-solid fa-gears text-[7px] text-blue-400"></i>
                            <span className="text-[7px] font-black uppercase text-slate-500 tracking-tighter">Usage (Microswitch)</span>
                          </div>
                          <span className={`text-[7px] font-black uppercase ${isCritical ? 'text-rose-500' : 'text-slate-500'}`}>
                            {Math.round(healthPercent)}% Life
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="bg-[#0f172a]/60 p-6 rounded-[32px] border border-white/5 h-full flex flex-col">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-terminal text-blue-500"></i> ESP32_KERNEL_LOG
            </h4>
            <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[10px] leading-relaxed space-y-3 overflow-y-auto custom-scrollbar border border-white/5">
              <div className="text-blue-400 opacity-80">[BOOT] ESP32-D0WDQ6 (Revision 1)</div>
              {isOnline ? (
                <>
                  <div className="text-emerald-500/70">[BLE] Advertising as KeyCabinet</div>
                  <div className="text-slate-500">[MAC] {controllerStatus?.mac || 'XX:XX:XX:XX:XX:XX'}</div>
                  <div className="text-slate-400">[GPIO] Init Door Solenoid Relay</div>
                  <div className="text-slate-400">[GPIO] Init Inputs 1-4 (Microswitches)</div>
                  <div className="text-emerald-400/80">[RTC] Battery Voltage: 3.02V (OK)</div>
                  <div className="text-amber-500/70 italic">[SYS] Heartbeat Active. ({controllerStatus?.lastSeen})</div>
                </>
              ) : (
                <>
                   <div className="text-rose-500/70">[ERR] Cloud Uplink Failed</div>
                   <div className="text-slate-500">[WARN] Switching to Offline Mode...</div>
                   <div className="text-amber-500">[BLE] Advertising as KeyCabinet</div>
                   <div className="text-slate-400">[SYS] Waiting for Local Handshake...</div>
                </>
              )}
              <div className="pt-4 mt-4 border-t border-white/5 text-[9px] text-slate-600">
                Uptime: 03d 12h 45m
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
