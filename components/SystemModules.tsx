
import React from 'react';
import { SystemConfig } from '../types';

interface SystemModulesProps {
  config: SystemConfig;
  onUpdateConfig: (updates: Partial<SystemConfig>) => void;
}

export const SystemModules: React.FC<SystemModulesProps> = ({ config, onUpdateConfig }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
      <h3 className="font-black text-slate-900 text-sm uppercase mb-6 flex items-center gap-3">
        <i className="fa-solid fa-microchip text-blue-600"></i> System Modules
      </h3>
      
      <div className="space-y-4">
        {/* Placeholder for future modules */}
        <div className="p-4 rounded-[24px] border border-dashed border-slate-200 opacity-40">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
               <i className="fa-solid fa-plus text-slate-300"></i>
             </div>
             <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Add Custom Extension</span>
           </div>
        </div>
      </div>
    </div>
  );
};
