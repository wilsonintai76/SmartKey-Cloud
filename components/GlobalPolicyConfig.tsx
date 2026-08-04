
import React from 'react';
import { SystemConfig } from '../types';

interface GlobalPolicyConfigProps {
  tempConfig: SystemConfig;
  setTempConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  onSave: () => void;

  isBluetoothConnected?: boolean;
  bluetoothStatus?: string;
}

export const GlobalPolicyConfig: React.FC<GlobalPolicyConfigProps> = ({
  tempConfig,
  setTempConfig,
  onSave,
  isBluetoothConnected = false,
  bluetoothStatus = 'disconnected'
}) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-3">
          <i className="fa-solid fa-sliders text-blue-600"></i> Global Policy Config
        </h3>
        <div className="flex flex-col items-end gap-1.5">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase ${isBluetoothConnected ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isBluetoothConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
            {isBluetoothConnected ? 'BT Stream Active' : String(bluetoothStatus).toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* System ID */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
            System Identifier
          </label>
          <input 
            type="text" 
            value={tempConfig.systemID} 
            onChange={(e) => setTempConfig({...tempConfig, systemID: e.target.value})} 
            className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
            placeholder="e.g. WKS-01-MY"
          />
        </div>

        {/* Borrow TTL */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Borrow TTL</label>
            <span className="text-[10px] font-bold text-slate-700">{tempConfig.maxBorrowDuration}min</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="180" 
            value={tempConfig.maxBorrowDuration} 
            onChange={(e) => setTempConfig({...tempConfig, maxBorrowDuration: parseInt(e.target.value)})} 
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>

        {/* Grace Period */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Grace Extension</label>
            <span className="text-[10px] font-bold text-amber-600">{tempConfig.gracePeriod}min</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="60" 
            value={tempConfig.gracePeriod} 
            onChange={(e) => setTempConfig({...tempConfig, gracePeriod: parseInt(e.target.value)})} 
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500" 
          />
        </div>

        {/* Data Storage */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">
            Data Storage
          </label>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <i className="fa-solid fa-cloud text-xs"></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700">Cloudflare D1 (SQLite)</p>
                <p className="text-[8px] text-emerald-500">Audit logs &amp; configuration stored in server-side SQLite.</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Session Timeout</label>
            <span className="text-[10px] font-bold text-blue-700">{tempConfig.sessionTimeout}min</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="120" 
            value={tempConfig.sessionTimeout} 
            onChange={(e) => setTempConfig({...tempConfig, sessionTimeout: parseInt(e.target.value)})} 
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>

        {/* Maintenance Threshold */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Cycle Threshold (CBM)</label>
            <span className="text-[10px] font-bold text-blue-600">{tempConfig.maintenanceThreshold} Cyc</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="300" 
            step="10" 
            value={tempConfig.maintenanceThreshold} 
            onChange={(e) => setTempConfig({...tempConfig, maintenanceThreshold: parseInt(e.target.value)})} 
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4" 
          />
        </div>

        {/* Save Button */}
        <button 
          onClick={onSave} 
          className="w-full py-3 mt-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
        >
          <i className="fa-solid fa-save"></i> Save Protocols
        </button>
      </div>
    </div>
  );
};
