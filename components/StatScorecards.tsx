
import React from 'react';

interface StatScorecardsProps {
  totalResources: number;
  systemLoad: number;
  violationCount: number;
}

export const StatScorecards: React.FC<StatScorecardsProps> = ({ 
  totalResources, 
  systemLoad, 
  violationCount 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Resources */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Resources</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{totalResources}</p>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-server text-xl"></i>
        </div>
      </div>

      {/* System Load */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Load</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{systemLoad}%</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-chart-pie text-xl"></i>
        </div>
      </div>

      {/* Violation Events */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Violation Events</p>
          <p className="text-3xl font-black text-rose-600 mt-1">{violationCount}</p>
        </div>
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-triangle-exclamation text-xl"></i>
        </div>
      </div>
    </div>
  );
};
