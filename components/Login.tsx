import React, { useState, useEffect } from 'react';
import { bluetoothService } from '../services/bluetoothService';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LoginProps {
  onLogin: () => void;
  onPinLogin: (userId: string, pin: string) => boolean | Promise<boolean>;
  onWebAuthnLogin?: (userId: string, userName: string, sessionToken?: string) => void;
  onWebAuthnRegister?: (userId: string, userName: string) => void;
  onSelfRegister?: (name: string, staffId: string, pin: string) => Promise<boolean>;
  isAuthenticating: boolean;
  systemID: string;
  bluetoothStatus?: string;
  biometricEnabled?: boolean;
}

export const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  onPinLogin,
  onWebAuthnLogin,
  onWebAuthnRegister,
  onSelfRegister,
  isAuthenticating, 
  systemID,
  bluetoothStatus = 'disconnected',
  biometricEnabled = false,
}) => {
  const [mode, setMode] = useState<'main' | 'pin_login' | 'self_register'>('main');
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([]);
  // Self-register state
  const [regName, setRegName] = useState('');
  const [regStaffId, setRegStaffId] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regStatus, setRegStatus] = useState('');

  // WebAuthn — for biometric sign-in and profile enrollment
  const { isPlatformAvailable, authenticateUsernameless, register, error: bioError, user: webAuthnUser, sessionToken } = useWebAuthn();

  const platformAvailable = isPlatformAvailable;
  const [bioStatus, setBioStatus] = useState('');

  // When WebAuthn hook sets a user, propagate to AppRoot with session token
  useEffect(() => {
    if (webAuthnUser) {
      onWebAuthnLogin?.(webAuthnUser.id, webAuthnUser.username, sessionToken || undefined);
    }
  }, [webAuthnUser]);

  useEffect(() => {
    if (mode === 'main' && navigator.bluetooth) {
      const unsub = bluetoothService.onDiscovery((devices) => {
        setDiscoveredDevices(devices);
      });
      bluetoothService.startScanning();
      return () => unsub();
    }
  }, [mode]);

  const handlePinLogin = async () => {
    if (!userId || !pin) return;
    setLoginStatus('Verifying credentials...');
    
    try {
      const success = await Promise.resolve(onPinLogin(userId, pin));
      if (success) {
        setLoginStatus('Access Granted');
      } else {
        setLoginStatus('Invalid credentials');
      }
    } catch (error) {
      setLoginStatus('Connection error. Try again.');
    }
  };

  const handleSelfRegister = async () => {
    if (!regName.trim() || !regStaffId || regStaffId.length !== 4 || !regPin || regPin.length < 4) {
      setRegStatus('Staff ID must be 4 digits, PIN at least 4 digits.');
      return;
    }
    setRegStatus('Registering...');
    const ok = onSelfRegister ? await onSelfRegister(regName.trim(), regStaffId, regPin) : false;
    if (ok) {
      setRegStatus('Account created! You can now sign in.');
      setTimeout(() => { setMode('main'); setRegStatus(''); }, 2000);
    } else {
      setRegStatus('Registration failed. Staff ID may already exist.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-md w-full text-center animate-fadeIn border-t-8 border-blue-600 relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-slate-50 rounded-full opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <i className="fa-solid fa-tower-broadcast text-4xl text-blue-600"></i>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">SecureKey</h1>
          <p className="text-slate-500 mb-8 text-sm font-bold uppercase tracking-widest opacity-60">Key Management System</p>
          
          {mode === 'main' && (
             <div className="space-y-4 animate-fadeIn">
                {/* BLE Status — distinct states */}
                <div className={`p-4 rounded-2xl border text-xs font-medium mb-4 ${
                  bluetoothStatus === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                  bluetoothStatus === 'connecting' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                  bluetoothStatus === 'scanning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                  'bg-slate-50 border-slate-100 text-slate-500'
                }`}>
                  <p className="font-black uppercase mb-1">
                    <i className={`fa-solid mr-1 ${
                      bluetoothStatus === 'connected' ? 'fa-link text-emerald-500' :
                      bluetoothStatus === 'connecting' ? 'fa-spinner animate-spin text-blue-500' :
                      bluetoothStatus === 'scanning' ? 'fa-rss animate-pulse text-amber-500' :
                      'fa-bluetooth-b'
                    }`}></i>
                    {bluetoothStatus === 'connected' ? 'Cabinet Connected' :
                     bluetoothStatus === 'connecting' ? 'Connecting to cabinet...' :
                     bluetoothStatus === 'scanning' ? 'Scanning for cabinets...' :
                     'Bluetooth Disconnected'}
                  </p>
                  {bluetoothStatus === 'disconnected' && (
                    <button onClick={() => bluetoothService.startScanning()}
                      className="text-[10px] font-bold text-blue-600 underline mt-1 min-h-[44px] flex items-center">
                      <i className="fa-solid fa-magnifying-glass mr-1"></i> Tap to Scan
                    </button>
                  )}
                  {bluetoothStatus === 'connected' && (
                    <p className="text-[10px] font-bold mt-1">Secure link active — ready to unlock</p>
                  )}
                </div>

                 <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                   {discoveredDevices.map((device) => (
                     <button
                       key={device.id}
                       onClick={() => bluetoothService.connectToDevice(device)}
                       disabled={bluetoothStatus === 'connecting' || bluetoothStatus === 'connected'}
                       className={`w-full p-3.5 rounded-2xl border-2 transition-all duration-150 text-left flex items-center justify-between gap-3 min-h-[52px] active:scale-[0.98] ${
                         bluetoothStatus === 'connected' ? 'bg-slate-50 border-slate-100 opacity-60' :
                         'bg-white border-slate-200 active:border-blue-400 active:shadow-md'
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-bluetooth-b text-blue-600"></i>
                         </div>
                         <div>
                           <p className="text-xs font-black text-slate-900 line-clamp-1">{device.name || 'Unknown Node'}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Tap to connect</p>
                         </div>
                       </div>
                       <i className={`fa-solid ${bluetoothStatus === 'connected' ? 'fa-circle-check text-emerald-500' : 'fa-chevron-right text-slate-300'}`}></i>
                     </button>
                   ))}
                 </div>

                 {/* Biometric Sign-In — only on devices with platform authenticator */}
                 {biometricEnabled && platformAvailable === true && (window as any).Capacitor?.isNativePlatform?.() !== true && (
                   <button onClick={async () => {
                     setBioStatus('Scanning...');
                     const ok = await authenticateUsernameless();
                     if (!ok) setBioStatus(bioError || 'Not recognized');
                   }}
                   className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 bg-purple-600 text-white active:bg-purple-700 transition-colors duration-150 min-h-[52px]"
                   >
                     <i className="fa-solid fa-fingerprint text-lg"></i>
                     {bioStatus || 'Sign In with Biometric'}
                   </button>
                 )}

                 <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                      <span className="bg-white px-4 text-slate-300">Sign in</span>
                    </div>
                 </div>

                 <button 
                   onClick={() => setMode('pin_login')}
                   className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-600 active:border-blue-400 active:text-blue-600 transition-colors duration-150 min-h-[52px]"
                 >
                   <i className="fa-solid fa-keyboard"></i>
                   Sign In with Staff ID + PIN
                 </button>

                 <button 
                   onClick={() => setMode('self_register')}
                   className="w-full py-3 text-[11px] font-bold uppercase text-slate-400 hover:text-emerald-500 text-center"
                 >
                   <i className="fa-solid fa-user-plus mr-1"></i> Register as New User
                 </button>
             </div>
          )}

          {mode === 'pin_login' && (
             <div className="space-y-4 animate-fadeIn text-left">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Staff ID (4-Digit)</label>
                   <input 
                     type="text" 
                     maxLength={4}
                     placeholder="0000"
                     value={userId}
                     onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ''))}
                     className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center font-mono font-bold text-lg outline-none focus:border-amber-400 min-h-[48px]"
                   />
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">PIN</label>
                   <input 
                     type="password" 
                     placeholder="••••••"
                     maxLength={6}
                     value={pin}
                     onChange={(e) => setPin(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center font-mono font-bold text-lg outline-none focus:border-amber-400 min-h-[48px]"
                   />
                </div>

                {loginStatus && (
                  <p className={`text-[10px] font-bold text-center ${loginStatus.includes('Granted') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {loginStatus}
                  </p>
                )}

                <button onClick={handlePinLogin}
                   className="w-full min-h-[52px] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider rounded-2xl">
                   Verify & Sign In
                 </button>

                 <button 
                   onClick={() => setMode('main')}
                   className="w-full py-3 text-[11px] font-bold uppercase text-slate-400 active:text-slate-600 text-center min-h-[44px] flex items-center justify-center"
                 >
                   <i className="fa-solid fa-arrow-left mr-2"></i> Back
                 </button>
             </div>
          )}
          {mode === 'self_register' && (
             <div className="space-y-4 animate-fadeIn text-left">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium mb-4">
                  <p className="font-black uppercase mb-1">📝 Register New Account</p>
                  Create your account. Staff ID must be 4 digits, PIN at least 4 digits.
                </div>

                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                  <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="Your name" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold outline-none focus:border-emerald-400 min-h-[48px]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Staff ID (4-Digit)</label>
                    <input maxLength={4} value={regStaffId} onChange={e => setRegStaffId(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0000" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center font-mono font-bold text-lg outline-none focus:border-emerald-400 min-h-[48px]" />
                  </div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">PIN (4-6 Digit)</label>
                    <input type="password" maxLength={6} value={regPin} onChange={e => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••••" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center font-mono font-bold text-lg outline-none focus:border-emerald-400 min-h-[48px]" />
                  </div>
                </div>

                {regStatus && (
                  <p className={`text-[10px] font-bold text-center ${regStatus.includes('created') ? 'text-emerald-500' : regStatus.includes('fill') || regStatus.includes('failed') ? 'text-rose-500' : 'text-blue-500'}`}>
                    {regStatus}
                  </p>
                )}

                <button onClick={handleSelfRegister}
                  className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white min-h-[52px]">
                  Create Account
                </button>

                <button onClick={() => setMode('offline_menu')}
                  className="w-full py-3 text-[11px] font-bold uppercase text-slate-400 active:text-slate-600 text-center min-h-[44px] flex items-center justify-center">
                  <i className="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
             </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center gap-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Workshop Node ID
            </p>
            <div className="bg-slate-900 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-mono font-black border border-blue-900/30">
              {systemID}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};