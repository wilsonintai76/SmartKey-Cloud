/**
 * Capacitor native service wrapper.
 * Detects if running inside Capacitor and provides native APIs.
 * Falls back to Web APIs when running in browser/PWA mode.
 */
import { Capacitor } from '@capacitor/core';

// ── Platform detection ────────────────────────────────────────────

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';

// ── Biometrics (native Face ID / fingerprint) ─────────────────────

import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function verifyBiometrics(
  reason: string = 'Authenticate to access SecureKey'
): Promise<BiometricResult> {
  if (!isNative) {
    // Fall back to WebAuthn in browser
    return { success: false, error: 'Use WebAuthn in browser mode' };
  }

  try {
    const isAvailable = await NativeBiometric.isAvailable();
    if (!isAvailable.isAvailable) {
      return { success: false, error: 'Biometrics not available on this device' };
    }

    const result = await NativeBiometric.verifyIdentity({
      reason,
      title: 'SecureKey Authentication',
      subtitle: 'Verify your identity',
      description: 'Use biometrics to unlock the app',
    });
    return { success: result.verified };
  } catch (err: any) {
    return { success: false, error: err.message || 'Biometric verification failed' };
  }
}

export async function checkBiometricsAvailable(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

// ── BLE (cross-platform) ──────────────────────────────────────────

import { BleClient, BleDevice, numbersToDataView, dataViewToNumbers } from '@capacitor-community/bluetooth-le';

let connectedDevice: BleDevice | null = null;
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export type CapacitorBleStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';

type BleStatusCallback = (status: CapacitorBleStatus) => void;
type BleDataCallback = (data: string) => void;

let statusCallbacks: BleStatusCallback[] = [];
let dataCallbacks: BleDataCallback[] = [];

export function onCapacitorBleStatus(cb: BleStatusCallback) {
  statusCallbacks.push(cb);
  return () => { statusCallbacks = statusCallbacks.filter(c => c !== cb); };
}

export function onCapacitorBleData(cb: BleDataCallback) {
  dataCallbacks.push(cb);
  return () => { dataCallbacks = dataCallbacks.filter(c => c !== cb); };
}

function notifyStatus(status: CapacitorBleStatus) {
  statusCallbacks.forEach(cb => cb(status));
}

export async function connectCapacitorBle(): Promise<void> {
  if (!isNative) {
    notifyStatus('error');
    throw new Error('BLE not available in browser mode. Use Web Bluetooth API.');
  }

  try {
    await BleClient.initialize();
    notifyStatus('scanning');

    const device = await BleClient.requestDevice({
      services: [SERVICE_UUID],
      namePrefix: 'KeyCabinet',
    });

    if (!device) {
      notifyStatus('error');
      throw new Error('No device selected');
    }

    notifyStatus('connecting');
    await BleClient.connect(device.deviceId);
    connectedDevice = device;

    await BleClient.startNotifications(device.deviceId, SERVICE_UUID, CHAR_UUID, (value) => {
      const decoder = new TextDecoder('utf-8');
      const data = decoder.decode(value);
      dataCallbacks.forEach(cb => cb(data));
    });

    notifyStatus('connected');
  } catch (err: any) {
    notifyStatus('error');
    throw err;
  }
}

export async function sendCapacitorBleCommand(command: string): Promise<void> {
  if (!connectedDevice) throw new Error('Not connected');
  const encoder = new TextEncoder();
  const data = encoder.encode(command);
  await BleClient.write(connectedDevice.deviceId, SERVICE_UUID, CHAR_UUID, data);
}

export function disconnectCapacitorBle(): void {
  if (connectedDevice) {
    BleClient.disconnect(connectedDevice.deviceId).catch(() => {});
    connectedDevice = null;
  }
  notifyStatus('disconnected');
}

// ── SQLite (local database) ───────────────────────────────────────

import { CapacitorSQLite, SQLiteDBConnection, capSQLiteChanges } from '@capacitor-community/sqlite';

let db: SQLiteDBConnection | null = null;

export async function initLocalDatabase(): Promise<void> {
  if (!isNative) return;

  try {
    const info = await CapacitorSQLite.createConnection({
      database: 'smartkey',
      version: 1,
      readOnly: false,
    });
    db = info;
    await db.open();

    // Create local tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        slot_label TEXT,
        peg_state_before TEXT,
        peg_state_after TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'staff',
        staff_id TEXT,
        offline_pin TEXT,
        avatar TEXT
      );
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  } catch (err) {
    console.warn('Failed to initialize local SQLite:', err);
  }
}

export async function queueAuditLocal(action: string, slotLabel?: string, pegBefore?: string, pegAfter?: string): Promise<void> {
  if (!db) return;
  try {
    await db.run(
      'INSERT INTO audit_queue (action, slot_label, peg_state_before, peg_state_after, created_at) VALUES (?, ?, ?, ?, ?)',
      [action, slotLabel || null, pegBefore || null, pegAfter || null, Date.now()]
    );
  } catch (err) {
    console.warn('SQLite queue failed:', err);
  }
}

export async function flushAuditQueueLocal(sendFn: (event: any) => Promise<boolean>): Promise<number> {
  if (!db) return 0;
  try {
    const rows = await db.query('SELECT * FROM audit_queue ORDER BY created_at ASC');
    let flushed = 0;

    for (const row of rows.values!) {
      const ok = await sendFn({
        action: row.action,
        slotLabel: row.slot_label,
        pegStateBefore: row.peg_state_before,
        pegStateAfter: row.peg_state_after,
      });
      if (ok) {
        await db.run('DELETE FROM audit_queue WHERE id = ?', [row.id]);
        flushed++;
      }
    }
    return flushed;
  } catch {
    return 0;
  }
}

export async function saveConfigLocal(key: string, value: any): Promise<void> {
  if (!db) return;
  try {
    await db.run(
      'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    );
  } catch {}
}

export async function getConfigLocal(key: string): Promise<any | null> {
  if (!db) return null;
  try {
    const rows = await db.query('SELECT value FROM config WHERE key = ?', [key]);
    if (rows.values && rows.values.length > 0) {
      return JSON.parse(rows.values[0].value);
    }
  } catch {}
  return null;
}

export async function saveUsersLocal(users: any[]): Promise<void> {
  if (!db) return;
  try {
    await db.execute('DELETE FROM users');
    for (const u of users) {
      await db.run(
        'INSERT OR REPLACE INTO users (id, name, email, role, staff_id, offline_pin, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email || '', u.role || 'staff', u.userId || '', u.offlinePin || '', u.avatar || '']
      );
    }
  } catch {}
}

export async function getUsersLocal(): Promise<any[]> {
  if (!db) return [];
  try {
    const rows = await db.query('SELECT * FROM users');
    return rows.values?.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      userId: r.staff_id,
      offlinePin: r.offline_pin,
      avatar: r.avatar,
      status: 'active' as const,
    })) || [];
  } catch {
    return [];
  }
}
