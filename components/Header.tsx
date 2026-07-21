
import React from 'react';
import { UserAccount as UserProfileData, BluetoothStatus } from '../types';
import { UserProfile } from './UserProfile';

interface HeaderProps {
  networkMode: 'cloud' | 'local';
  bluetoothStatus: BluetoothStatus;
  showSettings: boolean;
  view: string;
  isAdmin: boolean;
  user: UserProfileData;
  onViewChange: (view: 'dashboard' | 'admin' | 'analytics') => void;
  onOpenGuide: () => void;
  onLogout: () => void;
  onOpenSettings: (tab: 'account' | 'security') => void;
  onConnectBluetooth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  networkMode,
  bluetoothStatus,
  showSettings,
  view,
  isAdmin,
  user,
  onViewChange,
  onOpenGuide,
  onLogout,
  onOpenSettings,
  onConnectBluetooth
}) => {
  const isBluetoothConnected = bluetoothStatus === 'connected';

  return (
    <header className="px-4 md:px-6 py-2 md:py-4 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/50">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-12">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <i className="fa-solid fa-microchip text-sm md:text-lg"></i>
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-black tracking-tight leading-none text-slate-900">
                  SmartKey
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  {/* BLE Connection Indicator */}
                  <div className={`flex items-center gap-1.5 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border transition-all flex-shrink-0 ${
                    bluetoothStatus === 'connected' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                    : bluetoothStatus === 'scanning' || bluetoothStatus === 'connecting' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                    : 'bg-slate-100 border-slate-200 text-slate-600 shadow-sm'
                  }`}>
                    <i className={`fa-solid fa-bluetooth-b text-[8px] md:text-[10px] ${bluetoothStatus === 'connected' ? 'text-blue-500' : ''}`}></i>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider">
                      BLE {bluetoothStatus === 'connected' ? 'Active' : bluetoothStatus}
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop View Switcher */}
            {!showSettings ? (
              <nav className="hidden md:flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => onViewChange("dashboard")}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${view === "dashboard" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Dashboard
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => onViewChange("admin")}
                      className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${view === "admin" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Control Hub
                    </button>
                    <button
                      onClick={() => onViewChange("analytics")}
                      className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${view === "analytics" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Analytics
                    </button>
                  </>
                )}
              </nav>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-300">
                  Currently Editing:
                </span>
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  User Preferences
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenGuide}
              className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-circle-question"></i>
            </button>
            <UserProfile
              user={user}
              isAdminMode={isAdmin}
              onLogout={onLogout}
              onOpenSettings={onOpenSettings}
            />
          </div>
        </div>
      </header>
  );
};
