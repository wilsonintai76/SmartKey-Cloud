
import React from 'react';
import { ControllerStatus } from '../types';

interface ConnectivityStatusProps {
  isCloudConnected: boolean;
  controllerStatus?: ControllerStatus;
  onSwitchToLocalMode: () => void;
  isEmergencySequencing?: boolean;
  isHardwareTriggerActive?: boolean;
  isPostEmergency?: boolean;
}

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({
  isCloudConnected,
  controllerStatus,
  onSwitchToLocalMode,
  isEmergencySequencing,
  isHardwareTriggerActive,
  isPostEmergency
}) => {
  // Logic: If Cloud is UP, but Controller is DOWN (and no other emergency is hiding it)
  const isControllerOffline = isCloudConnected && controllerStatus && !controllerStatus.online;
  
  // Don't show this banner if higher priority emergencies are active to avoid clutter
  if (!isControllerOffline || isEmergencySequencing || isHardwareTriggerActive || isPostEmergency) {
    return null;
  }

  return (
    <div className="bg-slate-800 text-white p-4 md:p-5 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-amber-500 animate-fadeIn">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-plug-circle-xmark text-amber-500 text-xl"></i>
         </div>
         <div>
           <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-0.5">Controller Unreachable</h4>
           <p className="text-[10px] text-slate-400 font-medium leading-tight max-w-md">
             The Cloud Dashboard is active, but the Workshop Hardware (ESP32) has stopped sending heartbeats. It may be powered down or internet is lost at the site.
           </p>
         </div>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="hidden md:block text-[9px] font-mono text-slate-500 bg-black/20 px-3 py-1.5 rounded-lg whitespace-nowrap">
           Last Seen: {controllerStatus?.lastSeen ? new Date(controllerStatus.lastSeen).toLocaleTimeString() : 'Unknown'}
        </div>
        <button 
          onClick={onSwitchToLocalMode}
          className="flex-1 md:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-amber-900/20 active:scale-95 whitespace-nowrap"
        >
          <i className="fa-solid fa-tower-broadcast mr-2"></i>
          Switch to Local Mode
        </button>
      </div>
    </div>
  );
};
