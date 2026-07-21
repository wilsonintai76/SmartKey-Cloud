
import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';

interface AuditTrailProps {
  logs: LogEntry[];
  isAdminMode: boolean;
  onExport: () => void;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs, isAdminMode, onExport }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Extract unique users for the dropdown
  const uniqueUsers = useMemo(() => {
    const users = new Set(logs.map(l => l.user));
    return Array.from(users).sort();
  }, [logs]);

  // Apply filtering logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter by User
      if (filterUser && log.user !== filterUser) return false;
      
      // Filter by Type
      if (filterType !== 'all' && log.type !== filterType) return false;

      // Filter by Date Range
      // Note: We use toLocaleString in addLog, so we need to parse it for comparison
      if (filterStartDate || filterEndDate) {
        const logDate = new Date(log.timestamp).getTime();
        
        if (filterStartDate) {
          const start = new Date(filterStartDate).setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        
        if (filterEndDate) {
          const end = new Date(filterEndDate).setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      return true;
    });
  }, [logs, filterUser, filterType, filterStartDate, filterEndDate]);

  const clearFilters = () => {
    setFilterUser('');
    setFilterType('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const activeFilterCount = [filterUser, filterType !== 'all', filterStartDate, filterEndDate].filter(Boolean).length;

  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Audit Trail</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
              {activeFilterCount} Active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
              showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
            }`}
            title="Toggle Filters"
          >
            <i className="fa-solid fa-filter text-[10px]"></i>
          </button>
          {isAdminMode && (
            <button 
              onClick={onExport} 
              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              title="Export CSV"
            >
              <i className="fa-solid fa-download text-[10px]"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filter UI Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4 animate-fadeIn shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">User</label>
              <select 
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
              >
                <option value="">All Users</option>
                {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Event Type</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
              >
                <option value="all">All Events</option>
                <option value="success">Success</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Start Date</label>
              <input 
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">End Date</label>
              <input 
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button 
              onClick={clearFilters}
              className="w-full py-2 text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Log List */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
        {filteredLogs.length > 0 ? filteredLogs.map(l => (
          <div 
            key={l.id} 
            className={`flex flex-col p-4 rounded-[24px] border transition-all hover:scale-[1.01] ${
              l.action === 'TIME LIMIT EXCEEDED' || l.action === 'OVERDUE VIOLATION' 
              ? 'bg-rose-50/50 border-rose-100 text-rose-800' 
              : 'bg-slate-50 border-slate-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-[9px] font-black uppercase tracking-tight ${
                l.type === 'success' 
                ? 'text-emerald-600' 
                : (l.action === 'TIME LIMIT EXCEEDED' || l.action === 'OVERDUE VIOLATION' || l.type === 'warning') 
                  ? 'text-rose-600' 
                  : 'text-blue-600'
              }`}>
                {l.action}
              </span>
              <span className="text-[8px] font-mono text-slate-400 font-bold">{l.timestamp}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-700 leading-tight">
              <span className="text-slate-400 uppercase tracking-widest text-[8px] mr-1">Actor:</span> {l.user} 
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-slate-400 uppercase tracking-widest text-[8px] mr-1">Target:</span> {l.keyLabel}
            </p>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-6">
            <i className="fa-solid fa-filter-circle-xmark text-3xl mb-3 opacity-20"></i>
            <p className="text-[10px] font-black uppercase tracking-widest">No Logs Match Filters</p>
            <button onClick={clearFilters} className="mt-2 text-blue-500 text-[9px] font-bold hover:underline">Reset Selection</button>
          </div>
        )}
      </div>
      
      {/* Footer Stat */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center shrink-0">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
          Showing {filteredLogs.length} of {logs.length} entries
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
};
