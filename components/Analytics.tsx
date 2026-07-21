
import React from 'react';
import { KeySlot, LogEntry, SystemConfig, KeyStatus } from '../types';
import { MaintenanceForecast } from './MaintenanceForecast';
import { ComplianceReport } from './ComplianceReport';
import { ResourceUtilization } from './ResourceUtilization';
import { StatScorecards } from './StatScorecards';

interface AnalyticsProps {
  slots: KeySlot[];
  logs: LogEntry[];
  config: SystemConfig;
  isAdminMode: boolean;
  user: { name: string } | null;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  slots,
  logs,
  config,
  isAdminMode,
  user
}) => {
  if (!isAdminMode) return null;

  const getViolationStats = () => {
    const violations: Record<string, number> = {};
    logs.forEach(l => {
      if (l.action === 'OVERDUE VIOLATION') {
        violations[l.user] = (violations[l.user] || 0) + 1;
      }
    });
    return Object.entries(violations).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const exportAnalyticsReport = () => {
    const timestamp = new Date().toLocaleString();
    const totalViolations = logs.filter(l => l.action === 'OVERDUE VIOLATION').length;
    const systemLoad = Math.round((slots.filter(s => s.status === KeyStatus.BORROWED).length / slots.length) * 100);
    
    let report = `SMARTKEY SYSTEM ANALYTICS REPORT\nGenerated: ${timestamp}\nAdministrator: ${user?.name}\n\n--- SYSTEM HEALTH SUMMARY ---\nTotal Resources,${slots.length}\nCurrent System Load,${systemLoad}%\nTotal Recorded Violations,${totalViolations}\n\n--- TOP VIOLATION OFFENDERS ---\nUser Identity,Incident Count\n`;
    const violators = getViolationStats();
    if (violators.length === 0) report += `No violations recorded.,\n`;
    violators.forEach(([name, count]) => { report += `${name},${count}\n`; });
    report += `\n--- RESOURCE UTILIZATION ---\nResource Label,Usage Count,Mechanical Health %\n`;
    slots.sort((a,b) => b.usageCount - a.usageCount).forEach(s => {
       const health = Math.max(0, 100 - (s.usageCount / config.maintenanceThreshold * 100));
       report += `${s.label},${s.usageCount},${Math.round(health)}%\n`;
    });
    const blob = new Blob([report], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `smartkey_analytics_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const systemLoad = Math.round((slots.filter(s => s.status === KeyStatus.BORROWED).length / slots.length) * 100);
  const violationCount = logs.filter(l => l.action === 'OVERDUE VIOLATION').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Analytics</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly Performance & Compliance Review</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportAnalyticsReport} 
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3"
          >
            <i className="fa-solid fa-file-arrow-down"></i> Export Report
          </button>
        </div>
      </div>
      
      <StatScorecards 
        totalResources={slots.length}
        systemLoad={systemLoad}
        violationCount={violationCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ComplianceReport 
          slots={slots}
          logs={logs}
          config={config}
        />

        <ResourceUtilization 
          slots={slots}
          config={config}
        />
      </div>
      
      <MaintenanceForecast 
        slots={slots}
        config={config}
      />
    </div>
  );
};
