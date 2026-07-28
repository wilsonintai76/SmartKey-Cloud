import React, { useState, useEffect } from 'react';
import { bluetoothService } from '../services/bluetoothService';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LoginProps {
  onLogin: () => void;
  onLocalLogin: (userId: string, pin: string) => boolean | Promise<boolean>;
  onWebAuthnLogin?: (userId: string, userName: string, sessionToken?: string) => void;
  onWebAuthnRegister?: (userId: string, userName: string) => void;
  onFirstTimeSetup?: (name: string, email: string, userId: string, pin: string) => void;
  isFirstTime?: boolean;
  isAuthenticating: boolean;
  systemID: string;
  isConnecting?: boolean; 
  bluetoothStatus?: string;
  biometricEnabled?: boolean; // from SystemConfig
}

export const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  onLocalLogin,
  onWebAuthnLogin,
  onWebAuthnRegister,
  onFirstTimeSetup,
  isFirstTime = false,
  isAuthenticating, 
  systemID,
  isConnecting = false,
  bluetoothStatus = 'disconnected',
  biometricEnabled = false,
}) => {
  const [mode, setMode] = useState<'offline_menu' | 'offline_pin' | 'setup' | 'biometric_register'>(isFirstTime ? 'setup' : 'offline_menu');
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [offlineStatus, setOfflineStatus] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupUserId, setSetupUserId] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupStatus, setSetupStatus] = useState('');
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([]);
  const [fingerprintStatus, setFingerprintStatus] = useState('');
  const [fingerprintUsername, setFingerprintUsername] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const {
    isPlatformAvailable,
    isLoading: isFingerprintLoading,
    authenticate,
    register,
    error: fingerprintError,
    user: webAuthnUser,
    sessionToken,
  } = useWebAuthn();

  // Local binding to prevent minification/scope issues
  const platformAvailable = isPlatformAvailable;

  // When WebAuthn hook sets a user, propagate to AppRoot with session token
  useEffect(() => {
    if (webAuthnUser) {
      onWebAuthnLogin?.(webAuthnUser.id, webAuthnUser.username, sessionToken || undefined);
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
    if (!userId || !pin) return;
    setOfflineStatus('Verifying Local Identity...');
    
    try {
      const success = await Promise.resolve(onLocalLogin(userId, pin));
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

  const handleFingerprintRegister = async () => {
    if (!registerUsername.trim()) {
      setFingerprintStatus('Please enter a username to register.');
      return;
    }
    setFingerprintStatus('Waiting for biometric scan...');
    const success = await register(registerUsername.trim());
    if (success) {
      setFingerprintStatus('Biometric registered successfully!');
      onWebAuthnRegister?.(webAuthnUser?.id || '', registerUsername.trim());
      // Auto-switch to login mode after successful registration
      setTimeout(() => {
        setFingerprintUsername(registerUsername.trim());
        setMode('offline_menu');
      }, 1500);
    } else {
      setFingerprintStatus(fingerprintError || 'Registration failed. Please try again.');
    }
  };

  const handleFirstTimeSetupSubmit = () => {
    if (!setupName.trim() || !setupUserId || setupUserId.length !== 4 || !setupPin || setupPin.length < 4) {
      setSetupStatus('Please fill all fields. User ID must be 4 digits, PIN at least 4 digits.');
      return;
    }
    setSetupStatus('Creating admin account...');
    onFirstTimeSetup?.(setupName.trim(), setupEmail.trim(), setupUserId, setupPin);
    setSetupStatus('Account created! Redirecting to login...');
    setTimeout(() => setMode('offline_menu'), 1500);
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
          
          {mode === 'setup' && (
             <div className="space-y-4 animate-fadeIn text-left">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium mb-4">
                  <p className="font-black uppercase mb-1">🔐 First Time Setup</p>
                  Create your admin account. User ID must be exactly 4 digits, PIN at least 4 digits.
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                   <Input value={setupName} onChange={e => setSetupName(e.target.value)}
                     placeholder="e.g. Ahmad Zaki" className="min-h-[48px]" />
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email (optional)</label>
                   <Input type="email" value={setupEmail} onChange={e => setSetupEmail(e.target.value)}
                     placeholder="admin@workshop.com" className="min-h-[48px]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Staff ID (4-Digit)</label>
                     <Input maxLength={4} value={setupUserId} onChange={e => setSetupUserId(e.target.value.replace(/[^0-9]/g, ''))}
                       placeholder="0000" className="text-center font-mono text-lg min-h-[48px]" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-1">PIN (4-6 Digit)</label>
                     <Input type="password" maxLength={6} value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/[^0-9]/g, ''))}
                       placeholder="••••••" className="text-center font-mono text-lg min-h-[48px]" />
                  </div>
                </div>

                {setupStatus && (
                  <p className={`text-[10px] font-bold text-center uppercase ${setupStatus.includes('created') ? 'text-emerald-500' : setupStatus.includes('fill') ? 'text-amber-500' : 'text-blue-500'}`}>
                    {setupStatus}
                  </p>
                )}

                <Button onClick={handleFirstTimeSetupSubmit} size="lg"
                  className="w-full min-h-[52px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider">
                  Create Admin Account
                </Button>
             </div>
          )}

          {mode === 'offline_menu' && (
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

                 {/* ── Biometric Authentication (WebAuthn) ────────────── */}
                 {biometricEnabled && platformAvailable !== null && (
                   <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-100 text-left">
                     <p className="text-[10px] font-black uppercase text-purple-700 mb-3">
                       <i className="fa-solid fa-fingerprint mr-1"></i>
                       Biometric Sign-In
                     </p>

                     {platformAvailable ? (
                       <>
                         <input
                           type="text"
                           value={fingerprintUsername}
                           onChange={e => setFingerprintUsername(e.target.value)}
                           placeholder="Username"
                           className="w-full bg-white border border-purple-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-purple-400 mb-2 min-h-[48px]"
                           disabled={isFingerprintLoading}
                         />
                         <div className="flex gap-2">
                           <button
                             onClick={handleFingerprintLogin}
                             disabled={isFingerprintLoading || !fingerprintUsername.trim()}
                             className="flex-1 py-3 rounded-xl font-black uppercase text-[11px] tracking-wider bg-purple-600 text-white active:bg-purple-700 disabled:opacity-50 transition-colors duration-150 min-h-[48px]"
                           >
                             {isFingerprintLoading ? (
                               <><i className="fa-solid fa-spinner animate-spin mr-1"></i>Scanning</>
                             ) : 'Sign In'}
                           </button>
                           <button
                             onClick={() => { setRegisterUsername(fingerprintUsername); setMode('biometric_register'); }}
                             disabled={isFingerprintLoading}
                             className="px-3 py-3 rounded-xl font-black uppercase text-[11px] tracking-wider bg-white border-2 border-purple-200 text-purple-600 active:border-purple-400 transition-colors duration-150 min-h-[48px]"
                           >
                             Register
                           </button>
                         </div>
                         {fingerprintStatus && (
                           <p className={`text-[10px] font-bold mt-2 text-center ${
                             fingerprintStatus.includes('success') || fingerprintStatus.includes('Waiting')
                               ? 'text-purple-600' : 'text-rose-500'
                           }`}>
                             {fingerprintStatus}
                           </p>
                         )}
                       </>
                     ) : (
                       <p className="text-[10px] font-bold text-slate-500 text-center py-2">
                         <i className="fa-solid fa-triangle-exclamation mr-1 text-amber-500"></i>
                         No biometric enrolled on this device. Use PIN below.
                       </p>
                     )}
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
                   className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-600 active:border-blue-400 active:text-blue-600 transition-colors duration-150 min-h-[52px]"
                 >
                   <i className="fa-solid fa-keyboard"></i>
                   Sign In with Staff ID / PIN
                 </button>
             </div>
          )}

          {mode === 'offline_pin' && (
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

                {offlineStatus && (
                  <p className={`text-[10px] font-bold text-center ${offlineStatus.includes('Success') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {offlineStatus}
                  </p>
                )}

                <Button onClick={handleManualOfflineAuth} size="lg"
                   className="w-full min-h-[52px] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider">
                   Verify & Sign In
                 </Button>

                 <button 
                   onClick={() => setMode('offline_menu')}
                   className="w-full py-3 text-[11px] font-bold uppercase text-slate-400 active:text-slate-600 text-center min-h-[44px] flex items-center justify-center"
                 >
                   <i className="fa-solid fa-arrow-left mr-2"></i> Back
                 </button>
             </div>
          )}

          {mode === 'biometric_register' && (
             <div className="space-y-4 animate-fadeIn text-left">
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-purple-800 text-xs font-medium mb-4">
                  <p className="font-black uppercase mb-1">🔐 Biometric Enrollment</p>
                  Your fingerprint or face scan stays on your device. Only a public key is stored on the server.
                  {platformAvailable && (
                    <span className="block mt-1 text-emerald-600">
                      <i className="fa-solid fa-circle-check mr-1"></i>
                      Platform authenticator detected (Touch ID / Face ID / Windows Hello)
                    </span>
                  )}
                  {platformAvailable === false && (
                    <span className="block mt-1 text-amber-600">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      No platform biometric detected on this device.
                    </span>
                  )}
                </div>

                {/* Debug Panel — tap to toggle */}
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="w-full text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600 text-center"
                >
                  <i className={`fa-solid fa-${showDebug ? 'chevron-up' : 'bug'} mr-1`}></i>
                  {showDebug ? 'Hide Diagnostics' : 'Show Diagnostics'}
                </button>
                {showDebug && (
                  <div className="bg-slate-900 text-green-400 p-3 rounded-xl text-[9px] font-mono space-y-1 overflow-x-auto">
                    <div><span className="text-slate-500">isSecureContext:</span> {String(window.isSecureContext)}</div>
                    <div><span className="text-slate-500">origin:</span> {window.location.origin}</div>
                    <div><span className="text-slate-500">platformAuth:</span> {platformAvailable === null ? 'checking...' : String(platformAvailable)}</div>
                    <div><span className="text-slate-500">biometricEnabled:</span> {String(biometricEnabled)}</div>
                    <div><span className="text-slate-500">fingerprintError:</span> <span className="text-rose-400">{fingerprintError || 'none'}</span></div>
                    <div><span className="text-slate-500">fingerprintStatus:</span> {fingerprintStatus || 'idle'}</div>
                    <div><span className="text-slate-500">isLoading:</span> {String(isFingerprintLoading)}</div>
                  </div>
                )}

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Username</label>
                   <input
                     type="text"
                     value={registerUsername}
                     onChange={e => setRegisterUsername(e.target.value)}
                     placeholder="e.g. admin"
                     className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold outline-none focus:border-purple-400 min-h-[48px]"
                     disabled={isFingerprintLoading}
                   />
                </div>

                {fingerprintStatus && (
                  <p className={`text-[10px] font-bold text-center ${
                    fingerprintStatus.includes('success') ? 'text-emerald-500' :
                    fingerprintStatus.includes('Waiting') || fingerprintStatus.includes('Scanning') ? 'text-purple-500' : 'text-rose-500'
                  }`}>
                    {fingerprintStatus}
                  </p>
                )}

                <Button
                   onClick={handleFingerprintRegister}
                   disabled={isFingerprintLoading || !registerUsername.trim()}
                   size="lg"
                   className="w-full min-h-[52px] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-wider mt-2"
                 >
                   {isFingerprintLoading ? (
                     <><i className="fa-solid fa-spinner animate-spin mr-2"></i>Scanning Fingerprint...</>
                   ) : (
                     <><i className="fa-solid fa-fingerprint mr-2"></i>Enroll Biometric</>
                   )}
                 </Button>

                 <button 
                   onClick={() => setMode('offline_menu')}
                   className="w-full py-3 text-[11px] font-bold uppercase text-slate-400 active:text-slate-600 text-center min-h-[44px] flex items-center justify-center"
                 >
                   Back to Sign In
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