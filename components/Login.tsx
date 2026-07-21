import React, { useState, useEffect } from 'react';
import { bluetoothService } from '../services/bluetoothService';
import { useWebAuthn } from '../hooks/useWebAuthn';

interface LoginProps {
  onLogin: () => void;
  onLocalLogin: (staffId: string, pin: string) => boolean | Promise<boolean>;
  onWebAuthnLogin?: (userId: string, userName: string) => void;
  isAuthenticating: boolean;
  systemID: string;
  isConnecting?: boolean; 
  bluetoothStatus?: string;
}

export const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  onLocalLogin,
  onWebAuthnLogin,
  isAuthenticating, 
  systemID,
  isConnecting = false,
  bluetoothStatus = 'disconnected'
}) => {
  const [mode, setMode] = useState<'offline_menu' | 'offline_pin'>('offline_menu');
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [offlineStatus, setOfflineStatus] = useState('');
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([]);
  const [fingerprintStatus, setFingerprintStatus] = useState('');
  const [fingerprintUsername, setFingerprintUsername] = useState('');

  const { isPlatformAvailable, isLoading: isFingerprintLoading, authenticate, error: fingerprintError, user: webAuthnUser } = useWebAuthn();

  // When WebAuthn hook sets a user, propagate to AppRoot
  useEffect(() => {
    if (webAuthnUser) {
      onWebAuthnLogin?.(webAuthnUser.id, webAuthnUser.username);
    }
  }, [webAuthnUser]);

  useEffect(() => {
    if (mode === 'offline_menu' && navigator.bluetooth) {
      const unsub = bluetoothService.onDiscovery((devices) => {
        setDiscoveredDevices(devices);
      });
      bluetoothService.startScanning();
      return () => unsub();
    }
  }, [mode]);

  const handleManualOfflineAuth = async () => {
    if (!staffId || !pin) return;
    setOfflineStatus('Verifying Local Identity...');
    
    try {
      const success = await Promise.resolve(onLocalLogin(staffId, pin));
      if (success) {
        setOfflineStatus('Success! Local Access Granted.');
      } else {
        setOfflineStatus('Access Denied: Invalid Credentials');
      }
    } catch (error) {
      setOfflineStatus('Access Denied: Error authenticating');
    }
  };

  const handleFingerprintLogin = async () => {
    if (!fingerprintUsername.trim()) {
      setFingerprintStatus('Please enter your username first.');
      return;
    }
    setFingerprintStatus('Waiting for fingerprint...');
    const success = await authenticate(fingerprintUsername.trim());
    if (!success) {
      setFingerprintStatus(fingerprintError || 'Fingerprint not recognized.');
    }
    // On success, the useEffect above will call onWebAuthnLogin via webAuthnUser
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
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">SmartKey Full-Stack</h1>
          <p className="text-slate-500 mb-8 text-sm font-bold uppercase tracking-widest opacity-60">Integrated IoT Control Panel</p>
          
          {mode === 'offline_menu' && (
             <div className="space-y-4 animate-fadeIn">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-800 text-xs font-medium mb-4">
                  <p className="font-black uppercase mb-1">Local Failover Protocol</p>
                  Ensure Bluetooth is enabled on your device to connect to the hardware directly.
                </div>

                 <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                     <p className="text-[10px] font-black uppercase text-slate-400">Nearby Cabinets</p>
                     {bluetoothStatus === 'scanning' && (
                       <i className="fa-solid fa-spinner animate-spin text-blue-500 text-[10px]"></i>
                     )}
                   </div>

                   {discoveredDevices.length > 0 ? (
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                       {discoveredDevices.map((device) => (
                         <button
                           key={device.id}
                           onClick={() => bluetoothService.connectToDevice(device)}
                           disabled={bluetoothStatus === 'connecting' || bluetoothStatus === 'connected'}
                           className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between gap-4 group ${
                             bluetoothStatus === 'connected' ? 'bg-slate-50 border-slate-100 opacity-60' :
                             'bg-white border-slate-100 hover:border-blue-400 hover:shadow-md'
                           }`}
                         >
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                               <i className="fa-solid fa-bluetooth-b text-blue-600"></i>
                             </div>
                             <div>
                               <p className="text-xs font-black text-slate-900 line-clamp-1">{device.name || 'Unknown Node'}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Proximity: High Signal</p>
                             </div>
                           </div>
                           <i className={`fa-solid ${bluetoothStatus === 'connected' ? 'fa-circle-check text-emerald-500' : 'fa-chevron-right text-slate-300 group-hover:text-blue-500'} transition-transform group-hover:translate-x-0.5`}></i>
                         </button>
                       ))}
                     </div>
                   ) : (
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                       <i className="fa-solid fa-rss text-slate-300 text-2xl mb-2 animate-pulse"></i>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                         Scanning for Bluetooth Smartkeys...
                       </p>
                       <button 
                         onClick={() => bluetoothService.startScanning()}
                         className="text-[9px] font-black text-blue-600 uppercase mt-2 hover:underline"
                       >
                         Refresh Scope
                       </button>
                     </div>
                   )}
                 </div>

                 {bluetoothStatus === 'connected' && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-800 text-[10px] font-bold animate-fadeIn">
                       <i className="fa-solid fa-link mr-2"></i>
                       SECure DIRECT LINK ACTIVE. CABINET UNLOCKED.
                    </div>
                 )}

                 <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                      <span className="bg-white px-4 text-slate-300">Or use fallback</span>
                    </div>
                 </div>

                 <button 
                   onClick={() => setMode('offline_pin')}
                   className="w-full py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                 >
                   <i className="fa-solid fa-keyboard"></i>
                   Manual Staff ID / PIN
                 </button>
             </div>
          )}

          {mode === 'offline_pin' && (
             <div className="space-y-4 animate-fadeIn text-left">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Staff ID / Cabinet ID</label>
                   <input 
                     type="text" 
                     placeholder="ID-001"
                     value={staffId}
                     onChange={(e) => setStaffId(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-mono font-bold text-lg outline-none focus:border-amber-400"
                   />
                </div>

                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Personal Secure PIN</label>
                   <input 
                     type="password" 
                     placeholder="•••••"
                     maxLength={6}
                     value={pin}
                     onChange={(e) => setPin(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-center font-mono font-bold text-lg outline-none focus:border-amber-400"
                   />
                </div>

                {offlineStatus && (
                  <p className={`text-[10px] font-bold text-center uppercase ${offlineStatus.includes('Success') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {offlineStatus}
                  </p>
                )}

                <button 
                   onClick={handleManualOfflineAuth}
                   className="w-full py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200 mt-2"
                 >
                   Verify Credentials
                 </button>

                 <button 
                   onClick={() => setMode('offline_menu')}
                   className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 text-center"
                 >
                   Back
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