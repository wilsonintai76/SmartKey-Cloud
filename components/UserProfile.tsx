
import React, { useState, useRef, useEffect } from 'react';
import { UserAccount as UserProfileData } from '../types';

interface UserProfileProps {
  user: UserProfileData | null;
  isAdminMode: boolean;
  onLogout: () => void;
  onOpenSettings: (tab: 'account' | 'security') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, isAdminMode, onLogout, onOpenSettings }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setShowProfileMenu(!showProfileMenu)} 
        className="flex items-center gap-3 bg-white/10 px-3 md:px-4 py-2 rounded-2xl border border-white/20 hover:bg-white/20 transition-all group"
      >
        <div className="relative">
          <img 
            src={user.avatar} 
            className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-emerald-400 shadow-sm transition-transform group-hover:scale-105" 
            alt="Profile" 
          />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-[10px] font-black leading-none text-white">{user.name}</p>
          <p className="text-[8px] text-white/50 uppercase mt-0.5 font-bold tracking-wider">
            {isAdminMode ? 'Super Admin' : 'Auth Node'}
          </p>
        </div>
        <i className={`fa-solid fa-chevron-down text-[8px] text-white/30 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`}></i>
      </button>

      {showProfileMenu && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-[40px] shadow-2xl p-6 text-slate-900 z-[100] border border-slate-100 animate-fadeIn overflow-hidden">
          {/* Header Section from Screenshot */}
          <div className="flex items-center gap-4 mb-5">
            <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-slate-50 shadow-sm" alt="" />
            <div>
              <p className="text-sm font-black text-slate-900">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-bold">Authorized Personnel</p>
            </div>
          </div>

          {/* Email Capsule from Screenshot */}
          <div className="bg-slate-50 rounded-2xl p-3 mb-6 flex items-center gap-3 border border-slate-50">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
              <i className="fa-solid fa-envelope text-[10px]"></i>
            </div>
            <p className="text-[10px] text-slate-500 font-bold truncate">{user.email}</p>
          </div>
          
          <div className="space-y-3">
            {/* Consolidated Profile & Settings Button */}
            <button 
              onClick={() => {
                setShowProfileMenu(false);
                onOpenSettings('account');
              }}
              className="w-full px-4 py-4 rounded-3xl bg-slate-50 text-slate-700 text-[11px] font-black flex items-center justify-between group transition-all hover:bg-slate-100 border border-slate-100/50"
            >
              <div className="flex items-center gap-4">
                <i className="fa-solid fa-user-gear text-blue-500"></i>
                Profile & Settings
              </div>
              <i className="fa-solid fa-chevron-right text-[8px] text-slate-400 group-hover:translate-x-1 transition-transform"></i>
            </button>

            {/* Enroll Biometric */}
            <button 
              onClick={() => {
                setShowProfileMenu(false);
                onOpenSettings('account');
              }}
              className="w-full px-4 py-4 rounded-3xl bg-purple-50 text-purple-700 text-[11px] font-black flex items-center justify-between group transition-all hover:bg-purple-100 border border-purple-100/50"
            >
              <div className="flex items-center gap-4">
                <i className="fa-solid fa-fingerprint text-purple-500"></i>
                Enroll Biometric
              </div>
              <i className="fa-solid fa-chevron-right text-[8px] text-purple-400 group-hover:translate-x-1 transition-transform"></i>
            </button>

            <div className="h-px bg-slate-100 my-2 mx-2"></div>

            {/* Terminate Session Style from Screenshot */}
            <button 
              onClick={() => {
                setShowProfileMenu(false);
                onLogout();
              }} 
              className="w-full px-4 py-4 rounded-3xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-black flex items-center gap-4 transition-colors shadow-sm border border-rose-100/50"
            >
              <i className="fa-solid fa-power-off"></i> 
              Terminate Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
