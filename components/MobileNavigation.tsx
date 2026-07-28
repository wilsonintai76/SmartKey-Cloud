
import React from 'react';

interface TabNavigationProps {
  view: 'dashboard' | 'admin' | 'analytics';
  isAdmin: boolean;
  showSettings: boolean;
  onViewChange: (view: 'dashboard' | 'admin' | 'analytics') => void;
  onShowSettings: (show: boolean) => void;
}

export const MobileNavigation: React.FC<TabNavigationProps> = ({
  view,
  isAdmin,
  showSettings,
  onViewChange,
  onShowSettings
}) => {
  const tabs = [
    { id: 'dashboard' as const, icon: 'fa-grip', label: 'Home' },
    ...(isAdmin ? [
      { id: 'admin' as const, icon: 'fa-shield-halved', label: 'Admin' },
      { id: 'analytics' as const, icon: 'fa-chart-line', label: 'Stats' },
    ] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Safe area background for notched phones */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/80">
        <nav className="flex items-center justify-around px-2 pt-1.5 pb-[env(safe-area-inset-bottom,8px)] max-w-lg mx-auto">
          {tabs.map(tab => {
            const active = view === tab.id && !showSettings;
            return (
              <button
                key={tab.id}
                onClick={() => { onViewChange(tab.id); onShowSettings(false); }}
                className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-2 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-0.5 transition-all ${
                  active ? 'bg-blue-50' : ''
                }`}>
                  <i className={`fa-solid ${tab.icon}`}></i>
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${
                  active ? 'text-blue-600' : 'text-slate-500'
                }`}>
                  {tab.label}
                </span>
                {active && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>
                )}
              </button>
            );
          })}

          {/* Settings / Profile tab */}
          <button
            onClick={() => onShowSettings(!showSettings)}
            className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-2 rounded-xl transition-all duration-200 ${
              showSettings
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-0.5 transition-all ${
              showSettings ? 'bg-blue-50' : ''
            }`}>
              <i className={`fa-solid ${showSettings ? 'fa-times' : 'fa-user-gear'}`}></i>
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${
              showSettings ? 'text-blue-600' : 'text-slate-500'
            }`}>
              {showSettings ? 'Close' : 'Settings'}
            </span>
            {showSettings && (
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};
