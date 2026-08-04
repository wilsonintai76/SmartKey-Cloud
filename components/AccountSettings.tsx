
import React, { useState, useEffect } from 'react';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { checkExistingCredentials } from '../services/webauthnService';

interface AccountSettingsProps {
  user: any;
  setUser: (user: any) => void;
  onShowToast: (toast: any) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user, setUser, onShowToast }) => {
  const [name, setName] = useState(user.name);
  const [contact, setContact] = useState(user.contact || '');
  const [userId, setUserId] = useState(user.userId || '');
  const [offlinePin, setOfflinePin] = useState(user.offlinePin || '');
  const [biometricStatus, setBiometricStatus] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);

  // Check D1 for existing credentials on mount
  useEffect(() => {
    const username = user.name || user.id || 'user';
    checkExistingCredentials(username).then(exists => setHasBiometric(exists));
  }, [user.name, user.id]);

  const { register, isLoading: isBioLoading, error: bioError, isPlatformAvailable } = useWebAuthn();

  const handleSave = () => {
    setUser({ ...user, name, contact, userId, offlinePin });
    onShowToast({
      title: 'Profile Updated',
      message: 'Your account details have been saved.',
      type: 'success'
    });
  };

  const handleEnrollBiometric = async () => {
    const username = user.name || user.id || 'user';
    setBiometricStatus('Starting biometric enrollment...');
    const success = await register(username);
    if (success) {
      setBiometricStatus('Biometric enrolled successfully!');
      setHasBiometric(true);
      onShowToast({ title: 'Biometric Enrolled', message: `Fingerprint/Face ID registered.`, type: 'success' });
    } else {
      setBiometricStatus(bioError || 'Enrollment failed. Please try again.');
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Account Information</h3>
        <p className="text-xs text-slate-500 font-medium">Manage your identity profile and Digital Binding credentials.</p>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer">
            <img 
              src={user.avatar} 
              className="w-24 h-24 rounded-[32px] border-4 border-slate-50 shadow-xl group-hover:opacity-80 transition-opacity" 
              alt="Profile" 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <i className="fa-solid fa-camera text-white text-xl"></i>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Profile Avatar</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-xl hover:bg-slate-200 transition-colors">Change Photo</button>
              <button className="px-4 py-2 text-rose-500 text-[10px] font-black uppercase rounded-xl hover:bg-rose-50 transition-colors">Remove</button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Contact No.</label>
            <div className="relative">
              <input 
                type="text" 
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+60 12-345 6789"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
              />
              <i className="fa-solid fa-phone absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            </div>
          </div>
        </div>

        {/* Staff ID & PIN */}
        <div className="pt-6 border-t border-slate-100">
           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Staff ID & PIN</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Staff ID (4-Digit)</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0000"
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">PIN (4-6 Digit)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    maxLength={6}
                    value={offlinePin}
                    onChange={(e) => setOfflinePin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
                  />
                  <i className="fa-solid fa-key absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                </div>
              </div>
           </div>
        </div>

        {/* Biometric Enrollment — only on devices with platform authenticator */}
        {isPlatformAvailable === true && (
        <div className="pt-6 border-t border-slate-100">
           <h4 className="text-[10px] font-black uppercase text-purple-500 tracking-widest mb-4">
             <i className="fa-solid fa-fingerprint mr-1"></i>
             Biometric Enrollment
           </h4>
             <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-3">
               <p className="text-[10px] text-purple-700 font-medium">
                 {hasBiometric
                   ? 'Biometric is already enrolled. You can sign in with fingerprint.'
                   : `Enroll your fingerprint for passwordless sign-in as ${user.name || user.id}.`}
               </p>
               {!hasBiometric && (
               <button
                 onClick={handleEnrollBiometric}
                 disabled={isBioLoading}
                 className="w-full py-3 px-4 rounded-xl font-black uppercase text-[10px] tracking-wider bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
               >
                 {isBioLoading ? (
                   <><i className="fa-solid fa-spinner animate-spin mr-2"></i>Scanning...</>
                 ) : (
                   <><i className="fa-solid fa-fingerprint mr-2"></i>Enroll Biometric</>
                 )}
               </button>
               )}
               {biometricStatus && (
                 <p className={`text-[9px] font-bold text-center uppercase ${
                   biometricStatus.includes('success') ? 'text-emerald-600' : 'text-rose-500'
                 }`}>
                   {biometricStatus}
                 </p>
               )}
             </div>
        </div>
        )}

        <button 
          onClick={handleSave}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
        >
          Save Identity Changes
        </button>
      </div>
    </div>
  );
};
