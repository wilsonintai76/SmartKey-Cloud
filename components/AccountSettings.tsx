
import React, { useState } from 'react';
import { useWebAuthn } from '../hooks/useWebAuthn';

interface AccountSettingsProps {
  user: any;
  setUser: (user: any) => void;
  onShowToast: (toast: any) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user, setUser, onShowToast }) => {
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email); // Read-only for now
  const [phone, setPhone] = useState(user.phone || '');
  const [macAddress, setMacAddress] = useState(user.macAddress || '');
  const [userId, setUserId] = useState(user.userId || '');
  const [offlinePin, setOfflinePin] = useState(user.offlinePin || '');
  const [biometricStatus, setBiometricStatus] = useState('');
  const [biometricUsername, setBiometricUsername] = useState(user.name || '');

  const { register, isLoading: isBioLoading, error: bioError, isPlatformAvailable } = useWebAuthn();

  const handleSave = () => {
    setUser({ ...user, name, phone, macAddress, userId, offlinePin });
    onShowToast({
      title: 'Profile Updated',
      message: 'Identity and Digital Binding credentials synchronized.',
      type: 'success'
    });
  };

  const handleEnrollBiometric = async () => {
    const username = biometricUsername.trim() || name;
    if (!username) {
      setBiometricStatus('Please enter a username for biometric enrollment.');
      return;
    }
    setBiometricStatus('Starting biometric enrollment...');
    const success = await register(username);
    if (success) {
      setBiometricStatus('Biometric enrolled successfully!');
      onShowToast({ title: 'Biometric Enrolled', message: `Fingerprint/Face ID registered for "${username}".`, type: 'success' });
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
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                readOnly
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed outline-none" 
              />
              <i className="fa-solid fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Hand Phone Number</label>
            <div className="relative">
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60 12-345 6789"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
              />
              <i className="fa-solid fa-phone absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1 flex items-center gap-2">
               Device MAC Address
               <i className="fa-solid fa-circle-info text-blue-400" title="Required for Offline/Emergency Access. Input the MAC address of the device you will use during internet outages."></i>
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                placeholder="00:1A:2B:3C:4D:5E"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
              />
              <i className="fa-solid fa-network-wired absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            </div>
          </div>
        </div>

        {/* Offline Fallback Section */}
        <div className="pt-6 border-t border-slate-100">
           <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-4">Manual Offline Credentials (Fallback)</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">User ID (4-Digit)</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 1024"
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Offline PIN (6-Digit)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    maxLength={6}
                    value={offlinePin}
                    onChange={(e) => setOfflinePin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="******"
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all outline-none" 
                  />
                  <i className="fa-solid fa-key absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                </div>
              </div>
           </div>
           <p className="text-[9px] text-slate-400 mt-2 ml-1">
             Used for manual login at the physical terminal if the internet is down and MAC address binding fails.
           </p>
        </div>

        {/* Biometric Enrollment Section */}
        <div className="pt-6 border-t border-slate-100">
           <h4 className="text-[10px] font-black uppercase text-purple-500 tracking-widest mb-4">
             <i className="fa-solid fa-fingerprint mr-1"></i>
             Biometric Enrollment (WebAuthn)
           </h4>
           {isPlatformAvailable === false ? (
             <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
               <p className="text-[10px] font-bold text-amber-700">
                 No platform authenticator detected. Fingerprint/Face ID requires a device with biometric hardware.
               </p>
             </div>
           ) : (
             <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-3">
               <p className="text-[10px] text-purple-700 font-medium">
                 Enroll your fingerprint or face for passwordless sign-in. This is optional — you can still use your offline PIN.
               </p>
               <input
                 type="text"
                 value={biometricUsername}
                 onChange={e => setBiometricUsername(e.target.value)}
                 placeholder="Username for biometric login"
                 className="w-full bg-white border border-purple-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-purple-400"
                 disabled={isBioLoading}
               />
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
               {biometricStatus && (
                 <p className={`text-[9px] font-bold text-center uppercase ${
                   biometricStatus.includes('success') ? 'text-emerald-600' : 'text-rose-500'
                 }`}>
                   {biometricStatus}
                 </p>
               )}
             </div>
           )}
        </div>

        <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
            <span className="font-black uppercase">Digital Binding:</span> Your credentials are cached on the Controller's Internal Flash (LittleFS). This allows you to access the system via Emergency Hotspot even when the internet is down.
          </p>
        </div>

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
