
import React from 'react';
import { KeySlot, SystemConfig } from '../types';

interface ResourceUtilizationProps {
  slots: KeySlot[];
  config: SystemConfig;
}

export const ResourceUtilization: React.FC<ResourceUtilizationProps> = ({ slots, config }) => {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
      <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-3 mb-8">
        <i className="fa-solid fa-chart-simple text-blue-500"></i> Resource Utilization
      </h3>
      <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
        {[...slots].sort((a,b) => b.usageCount - a.usageCount).map(s => {
          // Normalize usage visualization based on twice the threshold for better visual context
          const usagePercent = Math.min(100, (s.usageCount / (config.maintenanceThreshold * 2)) * 100); 
          return (
            <div key={s.id} className="group">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{s.label}</span>
                <span className="text-[10px] font-mono text-slate-400">{s.usageCount} Withdrawals</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.max(5, usagePercent)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 p-5 bg-blue-50 rounded-[24px] border border-blue-100 relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-[10px] text-blue-800 leading-relaxed">
            <span className="font-black uppercase mr-1">Smart Insight:</span>
            Withdrawal frequency analysis indicates {slots.length > 0 ? [...slots].sort((a,b) => b.usageCount - a.usageCount)[0].label : 'N/A'} is the highest-demand asset. Schedule preventive inspection for this node.
          </p>
        </div>
        <i className="fa-solid fa-lightbulb absolute -right-4 -bottom-4 text-5xl text-blue-200/50 rotate-12 group-hover:scale-110 transition-transform"></i>
      </div>
    </div>
  );
};
