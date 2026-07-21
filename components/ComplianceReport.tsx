
import React from 'react';
import { KeySlot, LogEntry, SystemConfig, KeyStatus } from '../types';

interface ComplianceReportProps {
  slots: KeySlot[];
  logs: LogEntry[];
  config: SystemConfig;
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({ slots, logs, config }) => {
  const getViolationStats = () => {
    const violations: Record<string, number> = {};
    logs.forEach(l => {
      if (l.action === 'OVERDUE VIOLATION') {
        violations[l.user] = (violations[l.user] || 0) + 1;
      }
    });
    return Object.entries(violations).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getCurrentlyOverdue = () => {
    return slots.filter(s => {
      if (s.status !== KeyStatus.BORROWED || !s.borrowedAt) return false;
      const elapsed = (new Date().getTime() - new Date(s.borrowedAt).getTime()) / 60000;
      return elapsed >= (config.maxBorrowDuration + config.gracePeriod);
    });
  };

  const violationStats = getViolationStats();
  const overdueItems = getCurrentlyOverdue();

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
      <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-3 mb-8">
        <i className="fa-solid fa-clipboard-user text-rose-500"></i> Compliance Report
      </h3>
      <div className="space-y-8">
        <div>
          <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Currently Overdue Items</p>
          {overdueItems.length > 0 ? (
            <div className="space-y-3">
              {overdueItems.map(s => (
                <div key={s.id} className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex justify-between items-center animate-fadeIn">
                  <div>
                    <p className="text-xs font-bold text-rose-900">{s.label}</p>
                    <p className="text-[10px] text-rose-700 mt-0.5">Held by: <span className="font-black">{s.borrowedBy}</span></p>
                  </div>
                  <span className="text-[9px] font-black uppercase bg-white text-rose-600 px-2 py-1 rounded-lg shadow-sm">Overdue</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <p className="text-[10px] font-bold text-emerald-700">No Active Violations</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Top Late Return Offenders</p>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-[9px] font-black uppercase text-slate-400">User Identity</th>
                  <th className="p-4 text-right text-[9px] font-black uppercase text-slate-400">Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {violationStats.length > 0 ? violationStats.map(([name, count], idx) => (
                  <tr key={name} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">#{idx + 1}</span>
                      <span className="text-xs font-bold text-slate-700">{name}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-rose-600">{count}</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="p-4 text-center text-[10px] text-slate-400 italic">No violation history available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
