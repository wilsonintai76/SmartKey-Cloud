import React, { useState, useEffect } from 'react';
import {
  KeySlot, LogEntry, UserAccount as UserProfileData,
  SystemConfig, ControllerStatus, KeyStatus, BluetoothStatus,
} from './types';
import { INITIAL_SLOTS, DEFAULT_SYSTEM_CONFIG } from './constants';
import { bluetoothService } from './services/bluetoothService';
import { keyCabinetDB } from './services/keyCabinetDB';
import { syncLogs } from './services/syncService';

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

  // ── Init: Load local data ───────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('smartkey_config');
    if (stored) { try { setConfig(JSON.parse(stored)); setTempConfig(JSON.parse(stored)); } catch {} }
    const storedUsers = localStorage.getItem('smartkey_users');
    if (storedUsers) { try { setRegisteredUsers(JSON.parse(storedUsers)); } catch {} }
    const storedSlots = localStorage.getItem('smartkey_slots');
    if (storedSlots) { try { setSlots(JSON.parse(storedSlots)); } catch {} }
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

  // ── BLE Key Presence → IndexedDB ────────────────────────────────
  useEffect(() => {
    const unsub = bluetoothService.onKeyPresence(keyPresent => {
      const action = keyPresent ? 'RETURNED' : 'TAKEN';
      keyCabinetDB.addLog({ userId: user?.id || 'unknown', userName: user?.name || 'Unknown', action, slotLabel: 'Cabinet', timestamp: Date.now() })
        .then(() => { if (navigator.onLine) syncLogs().catch(() => {}); })
        .catch(err => console.warn('IndexedDB write failed:', err));
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
    const formattedAction = slotId !== undefined ? ${action}: Slot  -  : action;
    const newLog: LogEntry = { id: Date.now().toString(), timestamp: new Date().toLocaleString(), user: userName, userId: userId || user?.id, action: formattedAction, keyLabel, type };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLocalLogin = (staffId: string, pin: string): boolean => {
    const found = registeredUsers.find(u => (u.cabinetId === staffId || u.id === staffId) && u.offlinePin === pin);
    if (found) {
      setTimeout(() => {
        setUser(found);
        addLog(found.name, 'Local Login', 'System', 'success', found.id);
        showToast({ title: 'Local Access Granted', message: Welcome, ., type: 'success' });
        if (!isBluetoothConnected) bluetoothService.connect().catch(e => showGlobalError(e.message));
      }, 500);
      return true;
    }
    showToast({ title: 'Access Denied', message: 'Invalid credentials.', type: 'danger' });
    return false;
  };

  const handleWebAuthnLogin = (userId: string, userName: string) => {
    const found = registeredUsers.find(u => u.id === userId);
    const u = found || { id: userId, name: userName, email: '', avatar: '', status: 'active' as const, role: 'staff' as const };
    setUser(u);
    addLog(u.name, 'Biometric Login', 'System', 'success', u.id);
    showToast({ title: 'Biometric Verified', message: Welcome, ., type: 'success' });
    if (!isBluetoothConnected) bluetoothService.connect().catch(e => showGlobalError(e.message));
  };

  const handleLogout = () => { setUser(null); setView('dashboard'); };

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
        isAuthenticating={uiState.isAuthenticating} systemID={config.systemID} bluetoothStatus={bluetoothStatus} />
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
          const csv = 'data:text/csv;charset=utf-8,' + logs.map(e => ${e.timestamp},,,).join('\n');
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
        onAddModule={() => {
          setIsAddingModule(false);
          const newId = slots.length + 1;
          setSlots([...slots, ...Array.from({ length: 4 }, (_, i) => ({ id: newId + i, label: Key , status: KeyStatus.AVAILABLE, usageCount: 0, lastUpdated: new Date().toISOString() } as KeySlot))]);
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
