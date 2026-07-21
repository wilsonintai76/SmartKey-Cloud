import React from 'react';
import { SystemConfig } from '../types';

interface CloudConnectionConfigProps {
  sysConfig: SystemConfig;
  onUpdateSysConfig: (updates: Partial<SystemConfig>) => void;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  isConnected: boolean;
  networkMode: 'cloud' | 'local';
  setNetworkMode: (mode: 'cloud' | 'local') => void;
  onConnectBluetooth?: () => void;
  currentUser: any;
}

export const CloudConnectionConfig: React.FC<CloudConnectionConfigProps> = ({
  onConnectBluetooth,
}) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm transition-all">
      <div className="mb-6">
        <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-3">
          <i className="fa-solid fa-bluetooth text-blue-500"></i>
          Hardware Connection
        </h3>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-7">
          Storage: Local IndexedDB + Cloudflare D1
        </p>
      </div>

      <div className="animate-fadeIn space-y-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-[10px] text-amber-800 leading-relaxed relative overflow-hidden">
          <span className="font-black uppercase mb-1 block">Bluetooth Low Energy</span>
          Pair directly with the ESP32 KeyCabinet hardware via BLE.
          <div className="mt-3 space-y-1">
            <div className="text-[9px] text-amber-700/50 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info italic"></i>
              <span>iOS requires <b>Bluefy</b>/<b>WebBLE</b> browser.</span>
            </div>
            <div className="text-[9px] text-amber-700/50 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info italic"></i>
              <span>Android requires <b>Chrome</b> + <b>Location On</b>.</span>
            </div>
          </div>
          <i className="fa-brands fa-bluetooth absolute -right-3 -bottom-3 text-4xl text-amber-500/10 rotate-12"></i>
        </div>
        <button
          onClick={onConnectBluetooth}
          className="w-full py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 active:scale-95 flex items-center justify-center gap-3"
        >
          <i className="fa-brands fa-bluetooth"></i>
          Connect to Cabinet
        </button>
      </div>
    </div>
  );
};
