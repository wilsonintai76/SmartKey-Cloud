
import React from 'react';
import { AccountSettings } from './AccountSettings';
import { SecuritySettings } from './SecuritySettings';
import { SystemConfig } from '../types';

interface SettingsViewProps {
  user: any;
  setUser: (user: any) => void;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  subTab: 'account' | 'security';
  setSubTab: (tab: 'account' | 'security') => void;
  onClose: () => void;
  onShowToast: (toast: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  setUser,
  config,
  setConfig,
  subTab,
  setSubTab,
  onClose,
  onShowToast
}) => {
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-1">Settings</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personal Preferences</p>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setSubTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                subTab === 'account' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <i className="fa-solid fa-user-gear"></i>
              Account
            </button>
            <button 
              onClick={() => setSubTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                subTab === 'security' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <i className="fa-solid fa-shield-halved"></i>
              Security
            </button>
            <div className="h-px bg-slate-200 my-4 mx-2"></div>
            <button 
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
            >
              <i className="fa-solid fa-arrow-left"></i>
              Back to Terminal
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
          {subTab === 'account' ? (
            <AccountSettings user={user} setUser={setUser} onShowToast={onShowToast} />
          ) : (
            <SecuritySettings user={user} config={config} setConfig={setConfig} onShowToast={onShowToast} />
          )}
        </div>
      </div>
    </div>
  );
};
