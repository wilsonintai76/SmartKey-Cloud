import React, { useState, useEffect } from 'react';
import {
  KeySlot, LogEntry, UserAccount as UserProfileData,
  SystemConfig, ControllerStatus, KeyStatus, BluetoothStatus,
} from './types';
import { INITIAL_SLOTS, DEFAULT_SYSTEM_CONFIG } from './constants';
import { bluetoothService } from './services/bluetoothService';
import { keyCabinetDB } from './services/keyCabinetDB';
import { syncLogs } from './services/syncService';
import { getSessionToken, clearSessionToken, recordAuditEvent, verifySession, logoutSession } from './services/webauthnService';
import { fetchCloudUsers, verifyCloudPin, registerCloudUser } from './services/webauthnService';

import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminHub } from './components/AdminHub';
import { Analytics } from './components/Analytics';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SettingsView } from './components/SettingsView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { UserProfile } from './components/UserProfile';
import { SystemGuide } from './components/SystemGuide';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { MobileNavigation } from './components/MobileNavigation';
import { MainContent } from './components/MainContent';

interface Toast {
  title: string; message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  action?: () => void;
}

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(getSessionToken());
  const [registeredUsers, setRegisteredUsers] = useState<UserProfileData[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);

  const [uiState, setUiState] = useState({
    view: 'dashboard' as 'dashboard' | 'admin' | 'analytics',
    showSettings: false,
    settingsTab: 'account' as 'account' | 'security',
    showGuide: false,
    toast: null as Toast | null,
    isAuthenticating: false,
    isGlobalLoading: false,
    globalError: null as string | null,
  });

  const updateUI = (updates: Partial<typeof uiState>) => setUiState(prev => ({ ...prev, ...updates }));
  const showToast = (toast: Toast) => updateUI({ toast });
  const clearToast = () => updateUI({ toast: null });
  const setView = (view: 'dashboard' | 'admin' | 'analytics') => updateUI({ view, showSettings: false });
  const showGlobalError = (message: string) => {
    updateUI({ globalError: message });
    setTimeout(() => setUiState(prev => prev.globalError === message ? { ...prev, globalError: null } : prev), 5000);
  };
  const clearGlobalError = () => updateUI({ globalError: null });

  const [slots, setSlots] = useState<KeySlot[]>(INITIAL_SLOTS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothStatus>('disconnected');
  const isBluetoothConnected = bluetoothStatus === 'connected';
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [controllerStatus, setControllerStatus] = useState<ControllerStatus | undefined>(undefined);

  const [tempConfig, setTempConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeAdminModuleIndex, setActiveAdminModuleIndex] = useState(0);
  const [isAddingModule, setIsAddingModule] = useState(false);

  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [unlockQueue, setUnlockQueue] = useState<number[]>([]);
  const [isEmergencySequencing, setIsEmergencySequencing] = useState(false);
  const [sequenceProgress, setSequenceProgress] = useState('');
  const [isHardwareTriggerActive, setIsHardwareTriggerActive] = useState(false);
  const [isPostEmergency, setIsPostEmergency] = useState(false);
  const [recentlyMaintained, setRecentlyMaintained] = useState<number | null>(null);

  // ── Init: Load local data + try session recovery ────────────────
  useEffect(() => {
    const stored = localStorage.getItem('smartkey_config');
    if (stored) { try { setConfig(JSON.parse(stored)); setTempConfig(JSON.parse(stored)); } catch {} }
    const storedUsers = localStorage.getItem('smartkey_users');
    if (storedUsers) { try { setRegisteredUsers(JSON.parse(storedUsers)); } catch {} }
    const storedSlots = localStorage.getItem('smartkey_slots');
    if (storedSlots) { try { setSlots(JSON.parse(storedSlots)); } catch {} }

    // Fetch cloud users from D1 and merge with localStorage (cross-device sync)
    if (navigator.onLine) {
      fetchCloudUsers().then(cloudUsers => {
        if (cloudUsers.length > 0) {
          const localUsers: UserProfileData[] = storedUsers ? JSON.parse(storedUsers) : [];
          const merged = [...localUsers];
          for (const cu of cloudUsers) {
            if (!merged.find(u => u.id === cu.id)) {
              merged.push({
                id: cu.id,
                name: cu.name,
                email: '',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cu.name)}&background=6366f1&color=fff&size=128`,
                status: 'active' as const,
                role: 'staff' as const,
                userId: cu.staffId,
                offlinePin: '', // PIN stays server-side, verified via API
              });
            }
          }
          setRegisteredUsers(merged);
          localStorage.setItem('smartkey_users', JSON.stringify(merged));
        }
      }).catch(() => {});
    }

    // Try to recover a previous WebAuthn session
    const token = getSessionToken();
    if (token) {
      setSessionToken(token);
      // Attempt token verification
      verifySession().then(result => {
          if (result && result.user) {
            const recoveredUser: UserProfileData = {
              id: result.user.id,
              name: result.user.displayName || result.user.username,
              email: '',
              avatar: '',
              status: 'active',
              role: 'staff',
            };
            setUser(recoveredUser);
            showToast({ title: 'Session Restored', message: `Welcome back, ${recoveredUser.name}`, type: 'info' });
          }
        }).catch(() => {});
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { localStorage.setItem('smartkey_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('smartkey_users', JSON.stringify(registeredUsers)); }, [registeredUsers]);
  useEffect(() => { localStorage.setItem('smartkey_slots', JSON.stringify(slots)); }, [slots]);

  // ── Online/Offline ──────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncLogs().catch(() => {}); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) syncLogs().catch(() => {});
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // ── BLE Lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = bluetoothService.onStatusChange(status => {
      setBluetoothStatus(status);
      if (status === 'connected') showToast({ title: 'Bluetooth Linked', message: 'Secure peer-to-peer connection established.', type: 'success' });
      else if (status === 'error') showToast({ title: 'Bluetooth Error', message: 'Pairing failed.', type: 'danger' });
    });
    bluetoothService.onDataReceived(data => {
      const status = bluetoothService.parseStatus(data);
      if (status) setControllerStatus(status);
    });
    return () => unsub();
  }, []);

  // ── BLE Key Presence → IndexedDB + Slot State + Cloud Audit ────
  useEffect(() => {
    const unsub = bluetoothService.onKeyPresence(keyPresent => {
      const action = keyPresent ? 'RETURNED' : 'TAKEN';
      keyCabinetDB.addLog({ userId: user?.id || 'unknown', userName: user?.name || 'Unknown', action, slotLabel: 'Cabinet', timestamp: Date.now() })
        .then(() => { if (navigator.onLine) syncLogs().catch(() => {}); })
        .catch(err => console.warn('IndexedDB write failed:', err));

      // ── Cloud audit log (if session token is active) ────────────
      if (sessionToken && navigator.onLine && user?.id) {
        recordAuditEvent(
          keyPresent ? 'cabinet_close' : 'cabinet_open',
          'Cabinet',
          keyPresent ? 'BORROWED' : 'AVAILABLE',
          keyPresent ? 'AVAILABLE' : 'BORROWED'
        ).catch(() => {});
      }

      // ── Update slot state from hardware microswitch ─────────────
      setSlots(prev => {
        if (!keyPresent) {
          // Key physically removed: transition UNLOCKED → BORROWED (or AVAILABLE → BORROWED for forced removal)
          const targetIdx = prev.findIndex(s => s.status === KeyStatus.UNLOCKED);
          if (targetIdx === -1) {
            // Fallback: if no unlocked slot, mark first AVAILABLE as BORROWED (forced removal)
            const availIdx = prev.findIndex(s => s.status === KeyStatus.AVAILABLE);
            if (availIdx === -1) return prev;
            const updated = [...prev];
            updated[availIdx] = {
              ...updated[availIdx],
              status: KeyStatus.BORROWED,
              borrowedBy: user?.name || 'Unknown',
              borrowerId: user?.id || 'unknown',
              borrowedAt: new Date().toISOString(),
              usageCount: updated[availIdx].usageCount + 1,
            };
            return updated;
          }
          const updated = [...prev];
          updated[targetIdx] = {
            ...updated[targetIdx],
            status: KeyStatus.BORROWED,
            borrowedBy: user?.name || 'Unknown',
            borrowerId: user?.id || 'unknown',
            borrowedAt: new Date().toISOString(),
            usageCount: updated[targetIdx].usageCount + 1,
          };
          return updated;
        } else {
          // Key physically returned: transition BORROWED → AVAILABLE (or UNLOCKED → AVAILABLE)
          const targetIdx = prev.findIndex(s => s.status === KeyStatus.BORROWED);
          if (targetIdx === -1) {
            // Fallback: if no borrowed slot, reset first UNLOCKED to AVAILABLE
            const unlockedIdx = prev.findIndex(s => s.status === KeyStatus.UNLOCKED);
            if (unlockedIdx === -1) return prev;
            const updated = [...prev];
            updated[unlockedIdx] = {
              ...updated[unlockedIdx],
              status: KeyStatus.AVAILABLE,
              borrowedBy: undefined,
              borrowerId: undefined,
              borrowedAt: undefined,
            };
            return updated;
          }
          const updated = [...prev];
          updated[targetIdx] = {
            ...updated[targetIdx],
            status: KeyStatus.AVAILABLE,
            borrowedBy: undefined,
            borrowerId: undefined,
            borrowedAt: undefined,
          };
          return updated;
        }
      });
    });
    return () => unsub();
  }, [user]);

  // ── Cleanup on exit ─────────────────────────────────────────────
  useEffect(() => {
    const cleanup = () => { bluetoothService.disconnect(); };
    const onHidden = () => { if (document.visibilityState === 'hidden') cleanup(); };
    window.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', cleanup);
    return () => { window.removeEventListener('visibilitychange', onHidden); window.removeEventListener('pagehide', cleanup); };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────
  const addLog = (userName: string, action: string, keyLabel: string, type: 'success' | 'warning' | 'info', userId?: string, slotId?: number) => {
    const formattedAction = slotId !== undefined ? `${action}: Slot ${slotId}` : action;
    const newLog: LogEntry = { id: Date.now().toString(), timestamp: new Date().toLocaleString(), user: userName, userId: userId || user?.id, action: formattedAction, keyLabel, type };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLocalLogin = async (userId: string, pin: string): Promise<boolean> => {
    // First try local (offline) verification
    const found = registeredUsers.find(u => (u.userId === userId || u.id === userId) && u.offlinePin === pin);
    if (found) {
      completeLocalLogin(found);
      return true;
    }

    // Fallback: try cloud PIN verification (for cross-device login)
    if (navigator.onLine) {
      const result = await verifyCloudPin(userId, pin);
      if (result?.user) {
        const cloudUser: UserProfileData = {
          id: result.user.id,
          name: result.user.name,
          email: '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.user.name)}&background=6366f1&color=fff&size=128`,
          status: 'active',
          role: 'staff',
          userId: result.user.staffId,
          offlinePin: pin, // cache PIN locally for offline use
        };
        // Save to local state + localStorage for future offline use
        setRegisteredUsers(prev => {
          const updated = prev.filter(u => u.id !== cloudUser.id);
          return [...updated, cloudUser];
        });
        setTimeout(() => {
          localStorage.setItem('smartkey_users', JSON.stringify(
            [...registeredUsers.filter(u => u.id !== cloudUser.id), cloudUser]
          ));
        }, 0);
        completeLocalLogin(cloudUser);
        return true;
      }
    }

    showToast({ title: 'Access Denied', message: 'Invalid credentials. Check Staff ID and PIN.', type: 'danger' });
    return false;
  };

  const completeLocalLogin = (found: UserProfileData) => {
    setTimeout(() => {
      setUser(found);
      addLog(found.name, 'Local Login', 'System', 'success', found.id);
      showToast({ title: 'Local Access Granted', message: `Welcome, ${found.name}`, type: 'success' });
      if (!isBluetoothConnected) bluetoothService.connect().catch(e => showGlobalError(e.message));
    }, 500);
  };

  const handleWebAuthnLogin = (userId: string, userName: string, token?: string) => {
    if (token) setSessionToken(token);
    const found = registeredUsers.find(u => u.id === userId);
    const u = found || { id: userId, name: userName, email: '', avatar: '', status: 'active' as const, role: 'staff' as const };
    setUser(u);
    addLog(u.name, 'Biometric Login', 'System', 'success', u.id);
    showToast({ title: 'Biometric Verified', message: `Welcome, ${u.name}`, type: 'success' });
    if (!isBluetoothConnected) bluetoothService.connect().catch(e => showGlobalError(e.message));
  };

  const handleWebAuthnRegister = (userId: string, userName: string) => {
    // After biometric enrollment, create a local user record for the PWA
    const newUser: UserProfileData = {
      id: userId,
      name: userName,
      email: '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff&size=128`,
      status: 'active',
      role: 'staff',
    };
    setRegisteredUsers(prev => {
      if (prev.find(u => u.id === userId)) return prev;
      return [...prev, newUser];
    });
    addLog(userName, 'Biometric Enrollment', 'System', 'success', userId);
    showToast({ title: 'Biometric Enrolled', message: `${userName} can now sign in with fingerprint/face.`, type: 'success' });
  };

  const handleLogout = () => {
    // Revoke cloud session
    if (sessionToken && navigator.onLine) {
      logoutSession().catch(() => {});
    }
    clearSessionToken();
    setSessionToken(null);
    setUser(null);
    setView('dashboard');
  };

  const handleFirstTimeSetup = (name: string, email: string, userId: string, pin: string) => {
    const newAdmin: UserProfileData = {
      id: crypto.randomUUID(),
      name,
      email: email || `${userId}@smartkey.local`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff&size=128`,
      status: 'active',
      role: 'admin',
      userId,
      offlinePin: pin,
    };
    setRegisteredUsers(prev => [...prev, newAdmin]);
    addLog(name, 'First Time Setup', 'System', 'success', newAdmin.id);
    showToast({ title: 'Setup Complete', message: `Admin account created. Welcome, ${name}!`, type: 'success' });

    // Sync to D1 so the account works on other devices too
    registerCloudUser(name, userId, pin).catch(() => {});
  };

  const handleAddUser = (name: string, userId: string, pin: string, role: 'staff' | 'admin') => {
    const newUser: UserProfileData = {
      id: crypto.randomUUID(),
      name,
      email: `${userId}@smartkey.local`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=475569&color=fff&size=128`,
      status: 'active',
      role,
      userId,
      offlinePin: pin,
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    addLog(user?.name || 'System', 'User Created', name, 'success', newUser.id);
    showToast({ title: 'User Added', message: `${name} (${userId}) created as ${role}.`, type: 'success' });
  };

  // ── Slot Actions (BLE-only) ─────────────────────────────────────
  const initiateUnlock = (id: number) => {
    const slot = slots.find(s => s.id === id);
    if (!slot || !user) return;
    if (isBluetoothConnected) bluetoothService.sendCommand(JSON.stringify({ action: 'unlock', slotId: id, user: user.name })).catch(() => {});
    const updated = slots.map(s => s.id === id ? { ...s, status: KeyStatus.UNLOCKED } : s);
    setSlots(updated);
    addLog(user.name, 'Key Unlocked', slot.label, 'info', user.id, id);
  };

  const handleForceReturn = (id: number) => {
    const slot = slots.find(s => s.id === id);
    if (!slot || !user) return;
    if (isBluetoothConnected) bluetoothService.sendCommand(JSON.stringify({ action: 'force_return', slotId: id, user: user.name })).catch(() => {});
    setSlots(prev => prev.map(s => s.id === id ? { ...s, status: KeyStatus.AVAILABLE, borrowedBy: undefined, borrowerId: undefined, borrowedAt: undefined } : s));
    addLog(user.name, 'Force Return', slot.label, 'warning', user.id, id);
  };

  const handleMaintenanceRequest = (id: number) => {
    setRecentlyMaintained(id);
    if (isBluetoothConnected) bluetoothService.sendCommand(JSON.stringify({ action: 'maintenance', slotId: id, type: 'cycle_test' })).catch(() => {});
    setTimeout(() => setRecentlyMaintained(null), 3000);
    if (user) addLog(user.name, 'Maintenance Cycle', Slot , 'info', user.id, id);
  };

  const handleUnlockDoor = () => {
    if (!user) return;
    if (isBluetoothConnected) bluetoothService.sendCommand(JSON.stringify({ action: 'unlock_door', user: user.name })).catch(() => {});
    addLog(user.name, 'Cabinet Unlock', 'Main Door', 'success', user.id);
    showToast({ title: 'Command Sent', message: 'Unlock signal transmitted.', type: 'info' });
  };

  const saveConfig = () => {
    if (!tempConfig) return;
    setConfig(tempConfig);
    if (isBluetoothConnected) bluetoothService.sendCommand(JSON.stringify({ action: 'config_sync', data: tempConfig })).catch(() => {});
    addLog(user?.name || 'System', 'Config Updated', 'Global Policy', 'info', user?.id);
    showToast({ title: 'Configuration Saved', message: 'System policies updated.', type: 'success' });
  };

  const handleUpdateSlot = (id: number, updates: Partial<KeySlot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // ── Render ──────────────────────────────────────────────────────
  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (<>
      <ToastContainer toast={uiState.toast} globalError={uiState.globalError} onClearToast={clearToast} onClearGlobalError={clearGlobalError} />
      <Login onLogin={() => {}} onLocalLogin={handleLocalLogin} onWebAuthnLogin={handleWebAuthnLogin}
        onWebAuthnRegister={handleWebAuthnRegister}
        onFirstTimeSetup={handleFirstTimeSetup} isFirstTime={registeredUsers.length === 0}
        isAuthenticating={uiState.isAuthenticating} systemID={config.systemID} bluetoothStatus={bluetoothStatus}
        biometricEnabled={config.biometricEnabled} />
    </>);
  }

  const isAdmin = user.role === 'admin';
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 flex flex-col relative overflow-hidden">
      <ToastContainer toast={uiState.toast} globalError={uiState.globalError} onClearToast={clearToast} onClearGlobalError={clearGlobalError} />
      <Header networkMode="local" mqttStatus="disconnected" bluetoothStatus={bluetoothStatus} showSettings={uiState.showSettings}
        view={uiState.view} isAdmin={isAdmin} user={user} onViewChange={setView}
        onOpenGuide={() => updateUI({ showGuide: true })} onLogout={handleLogout}
        onOpenSettings={tab => updateUI({ settingsTab: tab, showSettings: true })}
        onConnectBluetooth={() => bluetoothService.connect().catch(e => showGlobalError(e.message))} />
      <MainContent view={uiState.view} showSettings={uiState.showSettings} settingsTab={uiState.settingsTab}
        user={user} setUser={setUser} config={config} setConfig={setConfig} tempConfig={tempConfig} setTempConfig={setTempConfig}
        registeredUsers={registeredUsers} slots={slots} logs={logs} isAdmin={isAdmin} isSystemLocked={isSystemLocked}
        setIsSystemLocked={setIsSystemLocked} mqttStatus="disconnected" bluetoothStatus={bluetoothStatus}
        isCloudConnected={false} isMqttConnected={false} isBluetoothConnected={isBluetoothConnected}
        controllerStatus={controllerStatus} activeModuleIndex={activeModuleIndex} setActiveModuleIndex={setActiveModuleIndex}
        activeAdminModuleIndex={activeAdminModuleIndex} setActiveAdminModuleIndex={setActiveAdminModuleIndex}
        isAddingModule={isAddingModule} setIsAddingModule={setIsAddingModule} recentlyMaintained={recentlyMaintained}
        unlockQueue={unlockQueue} isEmergencySequencing={isEmergencySequencing} sequenceProgress={sequenceProgress}
        isPostEmergency={isPostEmergency} setIsPostEmergency={setIsPostEmergency} isHardwareTriggerActive={isHardwareTriggerActive}
        onViewChange={setView} onUpdateUI={updateUI} onShowToast={showToast} onAddLog={addLog}
        onExportLogs={() => {
          const csv = 'data:text/csv;charset=utf-8,' + logs.map(e => `${e.timestamp},${e.user},${e.action},${e.keyLabel},${e.type}`).join('\n');
          window.open(encodeURI(csv));
        }}
        onInitiateUnlock={initiateUnlock} onUnlockDoor={handleUnlockDoor}
        handleForceReturn={handleForceReturn} handleMaintenanceRequest={handleMaintenanceRequest} onSaveConfig={saveConfig}
        onApproveUser={id => setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u))}
        onToggleUserRole={id => setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, role: u.role === 'admin' ? 'staff' : 'admin' } : u))}
        onDeactivateUser={id => setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'inactive' } : u))}
        onActivateUser={id => setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u))}
        onUnlockUser={id => setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u))}
        onDeleteUser={id => setRegisteredUsers(prev => prev.filter(u => u.id !== id))}
        onUpdateUserCredentials={updated => setRegisteredUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
        onAddUser={handleAddUser}
        onAddModule={() => {
          setIsAddingModule(false);
          const newId = slots.length + 1;
          setSlots([...slots, ...Array.from({ length: 4 }, (_, i) => ({ id: newId + i, label: `Slot ${newId + i}`, status: KeyStatus.AVAILABLE, usageCount: 0, lastUpdated: new Date().toISOString() } as KeySlot))]);
        }}
        onDeleteModule={idx => { const start = idx * 4; setSlots(prev => { const n = [...prev]; n.splice(start, 4); return n; }); }}
        onUpdateSlotLabel={(id, label) => setSlots(prev => prev.map(s => s.id === id ? { ...s, label } : s))}
        onUpdateSlot={handleUpdateSlot}
        onToggleSlotLock={id => setSlots(prev => prev.map(s => s.id === id ? { ...s, isLocked: !s.isLocked } : s))}
        onSwitchToLocalMode={() => {}}
        onConnectBluetooth={() => bluetoothService.connect().catch(e => showGlobalError(e.message))}
        onConnectCloud={async () => {}}
        onDisconnectCloud={() => {}}
        networkMode="local" setNetworkMode={() => {}} />
      <SystemGuide isOpen={uiState.showGuide} onClose={() => updateUI({ showGuide: false })} />
      <MobileNavigation view={uiState.view} isAdmin={isAdmin} showSettings={uiState.showSettings}
        onViewChange={setView} onShowSettings={show => updateUI({ showSettings: show })} />
    </div>
  );
};
