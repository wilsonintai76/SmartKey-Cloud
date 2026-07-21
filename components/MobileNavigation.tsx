
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
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <nav className="bg-slate-900/90 backdrop-blur-lg border border-white/10 rounded-[28px] p-1.5 shadow-2xl flex items-center justify-between">
        {!showSettings ? (
          <>
            <button
              onClick={() => onViewChange("dashboard")}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                view === "dashboard" ? "bg-white text-blue-600" : "text-slate-400"
              }`}
            >
              <i className="fa-solid fa-grid-2 text-lg mb-1"></i>
              <span className="text-[8px] font-black uppercase tracking-widest">Dashboard</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onViewChange("admin")}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                    view === "admin" ? "bg-white text-blue-600" : "text-slate-400"
                  }`}
                >
                  <i className="fa-solid fa-shield-halved text-lg mb-1"></i>
                  <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                </button>
                <button
                  onClick={() => onViewChange("analytics")}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${
                    view === "analytics" ? "bg-white text-blue-600" : "text-slate-400"
                  }`}
                >
                  <i className="fa-solid fa-chart-simple text-lg mb-1"></i>
                  <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
                </button>
              </>
            )}

            <button
              onClick={() => onShowSettings(true)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-slate-400"
            >
              <i className="fa-solid fa-user-gear text-lg mb-1"></i>
              <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => onShowSettings(false)}
            className="flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl bg-white text-rose-500 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Exit Preferences
          </button>
        )}
      </nav>
    </div>
  );
};
