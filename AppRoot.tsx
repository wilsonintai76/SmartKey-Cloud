import React, { useState, useEffect } from 'react';
// @ts-ignore
const APP_VERSION = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : 'dev';
console.log('[SecureKey] v' + APP_VERSION);
import { useVersionCheck } from './hooks/useVersionCheck';
import {
  KeySlot, LogEntry, UserAccount as UserProfileData,
  SystemConfig, ControllerStatus, KeyStatus, BluetoothStatus,
} from './types';
import { INITIAL_SLOTS, DEFAULT_SYSTEM_CONFIG } from './constants';
import { bluetoothService } from './services/bluetoothService';
import { queueAuditEvent, flushAuditQueue, getQueueLength } from './services/offlineQueue';
import { getSessionToken, clearSessionToken, recordAuditEvent, verifySession, logoutSession } from './services/webauthnService';
import { fetchCloudUsers, verifyCloudPin, deleteCloudUser, registerCloudUser } from './services/webauthnService';

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
    if (stored) { try { const parsed = JSON.parse(stored); parsed.biometricEnabled = true; setConfig(parsed); setTempConfig(parsed); } catch {} }
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
                role: (cu as any).role === 'admin' ? 'admin' as const : 'staff' as const,
                userId: cu.staffId,
                contact: (cu as any).contact || '',
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

  // ── Version check: detect new deployments ──────────────────────
  useVersionCheck((current, latest) => {
    showToast({
      title: 'Update Available',
      message: `New version ${latest} available (you're on ${current}). Tap to refresh.`,
      type: 'info',
      action: () => window.location.reload(),
    });
  });

  // ── Online/Offline + Offline Queue Flush ────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Flush any queued audit events to D1
      flushAuditQueue(async (event) => {
        const token = getSessionToken();
        if (!token) return false;
        try {
          const res = await fetch('/api/audit/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              action: event.action,
              slotLabel: event.slotLabel,
              pegStateBefore: event.pegStateBefore,
              pegStateAfter: event.pegStateAfter,
            }),
          });
          return res.ok;
        } catch { return false; }
      }).then(({ flushed }) => {
        if (flushed > 0) showToast({ title: 'Queue Flushed', message: `${flushed} offline event(s) synced to cloud.`, type: 'success' });
      }).catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // ── BLE Lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = bluetoothService.onStatusChange(status => {
      setBluetoothStatus(status);
      if (status === 'connected') showToast({ title: 'Bluetooth Linked', message: 'Secure peer-to-peer connection established.', type: 'success' });
      else if (status === 'disconnected' || status === 'error') setControllerStatus(undefined); // clear stale telemetry
      if (status === 'error') showToast({ title: 'Bluetooth Error', message: 'Pairing failed.', type: 'danger' });
    });
    bluetoothService.onDataReceived(data => {
      const status = bluetoothService.parseStatus(data);
      if (status) setControllerStatus(status);
    });
    return () => unsub();
  }, []);

  // ── BLE Key Presence → Slot State + Cloud Audit (D1 SQLite) ──
  useEffect(() => {
    const unsub = bluetoothService.onKeyPresence(keyPresent => {
      const action = keyPresent ? 'cabinet_close' : 'cabinet_open';
      const pegBefore = keyPresent ? 'BORROWED' : 'AVAILABLE';
      const pegAfter = keyPresent ? 'AVAILABLE' : 'BORROWED';

      if (sessionToken && user?.id) {
        if (navigator.onLine) {
          // Online → send directly to D1
          recordAuditEvent(action, 'Cabinet', pegBefore, pegAfter).catch(() => {});
        } else {
          // Offline → queue for later delivery
          queueAuditEvent({ action, slotLabel: 'Cabinet', pegStateBefore: pegBefore, pegStateAfter: pegAfter });
        }
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
    // Source of truth: D1 (cloud) first
    if (navigator.onLine) {
      const result = await verifyCloudPin(userId, pin);
      if (result?.user) {
        const cloudUser: UserProfileData = {
          id: result.user.id,
          name: result.user.name,
          email: '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.user.name)}&background=6366f1&color=fff&size=128`,
          status: 'active',
          role: (result.user as any).role === 'admin' ? 'admin' : 'staff',
          userId: result.user.staffId,
          offlinePin: pin, // cache PIN locally for offline use
        };
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

    // Offline fallback: verify against cached users
    const found = registeredUsers.find(u => (u.userId === userId || u.id === userId) && u.offlinePin === pin);
    if (found) {
      completeLocalLogin(found);
      return true;
    }

    showToast({ title: 'Access Denied', message: 'Invalid credentials. Check Staff ID and PIN.', type: 'danger' });
    return false;
  };

  const completeLocalLogin = (found: UserProfileData) => {
    setTimeout(() => {
      setUser(found);
      addLog(found.name, 'PIN Login', 'System', 'success', found.id);
      showToast({ title: 'Access Granted', message: `Welcome, ${found.name}`, type: 'success' });
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

  const handleSelfRegister = async (name: string, staffId: string, pin: string): Promise<boolean> => {
    const ok = await registerCloudUser(name, staffId, pin);
    if (ok) {
      showToast({ title: 'Account Created', message: `${name} registered.`, type: 'success' });
    }
    return ok;
  };

  const handleAdminAddUser = async (name: string, staffId: string, pin: string, role: 'staff' | 'admin'): Promise<boolean> => {
    const ok = await registerCloudUser(name, staffId, pin);
    if (ok) {
      showToast({ title: 'User Added', message: `${name} added as ${role}.`, type: 'success' });
    }
    return ok;
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
      <Login onLogin={() => {}} onPinLogin={handleLocalLogin} onWebAuthnLogin={handleWebAuthnLogin}
        onWebAuthnRegister={handleWebAuthnRegister} onSelfRegister={handleSelfRegister}
        isAuthenticating={uiState.isAuthenticating} systemID={config.systemID} bluetoothStatus={bluetoothStatus}
        biometricEnabled={config.biometricEnabled} />
    </>);
  }

  const isAdmin = user.role === 'admin';
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 flex flex-col relative overflow-hidden pb-20 md:pb-0">
      <ToastContainer toast={uiState.toast} globalError={uiState.globalError} onClearToast={clearToast} onClearGlobalError={clearGlobalError} />
      <Header networkMode="local" bluetoothStatus={bluetoothStatus} showSettings={uiState.showSettings}
        view={uiState.view} isAdmin={isAdmin} user={user} onViewChange={setView}
        onOpenGuide={() => updateUI({ showGuide: true })} onLogout={handleLogout}
        onOpenSettings={tab => updateUI({ settingsTab: tab, showSettings: true })}
        onConnectBluetooth={() => bluetoothService.connect().catch(e => showGlobalError(e.message))} />
      <MainContent view={uiState.view} showSettings={uiState.showSettings} settingsTab={uiState.settingsTab}
        user={user} setUser={setUser} config={config} setConfig={setConfig} tempConfig={tempConfig} setTempConfig={setTempConfig}
        registeredUsers={registeredUsers} slots={slots} logs={logs} isAdmin={isAdmin} isSystemLocked={isSystemLocked}
        setIsSystemLocked={setIsSystemLocked} bluetoothStatus={bluetoothStatus}
        isCloudConnected={false} isBluetoothConnected={isBluetoothConnected}
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
        onDeleteUser={id => {
          setRegisteredUsers(prev => prev.filter(u => u.id !== id));
          deleteCloudUser(id).catch(() => {});
        }}
        onUpdateUserCredentials={updated => setRegisteredUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
        onAddUser={handleAdminAddUser}
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
