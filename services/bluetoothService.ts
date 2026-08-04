
import { ControllerStatus } from '../types';
import { SERVICE_UUID, WRITE_CHAR_UUID, STATUS_CHAR_UUID } from './bleUuids';
import {
  isNative,
  onCapacitorBleStatus,
  onCapacitorBleData,
  onCapacitorBleKeyPresence,
  connectCapacitorBle,
  sendCapacitorBleCommand,
  sendCapacitorBleUnlock,
  disconnectCapacitorBle,
} from './capacitorService';

export type BluetoothStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';
export type KeyPresenceCallback = (keyPresent: boolean) => void;

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private statusCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  public status: BluetoothStatus = 'disconnected';
  public discoveredDevices: BluetoothDevice[] = [];

  private onStatusChangeCallbacks: ((status: BluetoothStatus) => void)[] = [];
  private onDataReceivedCallbacks: ((data: string) => void)[] = [];
  private onDiscoveryCallbacks: ((devices: BluetoothDevice[]) => void)[] = [];
  private onKeyPresenceCallbacks: KeyPresenceCallback[] = [];
  private capacitorBridgeAttached = false;

  constructor() {
    // In the Capacitor native shell, route BLE through the native plugin.
    this.attachCapacitorBridge();
  }

  /** Bridge native (Capacitor) BLE events into this service's callback model. */
  private attachCapacitorBridge() {
    if (this.capacitorBridgeAttached || !isNative) return;
    this.capacitorBridgeAttached = true;

    onCapacitorBleStatus(status => {
      this.setStatus(status as BluetoothStatus);
    });

    onCapacitorBleData(data => {
      this.onDataReceivedCallbacks.forEach(cb => cb(data));
    });

    onCapacitorBleKeyPresence(keyPresent => {
      this.onKeyPresenceCallbacks.forEach(cb => cb(keyPresent));
    });
  }

  // ── Status helpers ──────────────────────────────────────────────

  private setStatus(newStatus: BluetoothStatus) {
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach(cb => cb(newStatus));
  }

  public onStatusChange(callback: (status: BluetoothStatus) => void) {
    this.onStatusChangeCallbacks.push(callback);
    callback(this.status);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter(c => c !== callback);
    };
  }

  public onDiscovery(callback: (devices: BluetoothDevice[]) => void) {
    this.onDiscoveryCallbacks.push(callback);
    callback(this.discoveredDevices);
    return () => {
      this.onDiscoveryCallbacks = this.onDiscoveryCallbacks.filter(c => c !== callback);
    };
  }

  public onDataReceived(callback: (data: string) => void) {
    this.onDataReceivedCallbacks.push(callback);
    return () => {
      this.onDataReceivedCallbacks = this.onDataReceivedCallbacks.filter(c => c !== callback);
    };
  }

  /** Subscribe to key-presence notifications (0x01 = in cabinet, 0x00 = taken) */
  public onKeyPresence(callback: KeyPresenceCallback) {
    this.onKeyPresenceCallbacks.push(callback);
    return () => {
      this.onKeyPresenceCallbacks = this.onKeyPresenceCallbacks.filter(c => c !== callback);
    };
  }

  // ── Scanning ────────────────────────────────────────────────────

  public async startScanning(): Promise<void> {
    // Capacitor native: the system BLE picker handles scan + connect in one step
    if (isNative) {
      try {
        const device = await connectCapacitorBle();
        if (device) {
          const discovered = { id: device.deviceId, name: device.name ?? 'KeyCabinet' } as unknown as BluetoothDevice;
          this.discoveredDevices = [discovered];
          this.onDiscoveryCallbacks.forEach(cb => cb(this.discoveredDevices));
        }
      } catch (err: any) {
        console.error('Native BLE scan failed:', err?.message || String(err));
      }
      return;
    }

    if (!navigator.bluetooth) {
      this.setStatus('error');
      return;
    }
    this.setStatus('scanning');
    this.discoveredDevices = [];
    this.onDiscoveryCallbacks.forEach(cb => cb([]));

    // Real BLE scanning: browser-native picker (no mock)
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });
      this.discoveredDevices = [device];
      this.onDiscoveryCallbacks.forEach(cb => cb(this.discoveredDevices));
      await this.connectToDevice(device);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('BLE scan failed:', err.message);
        this.setStatus('error');
      }
      // User cancelled — stay scanning/disconnected
    }
  }

  // ── Connect ─────────────────────────────────────────────────────

  public async connect(): Promise<void> {
    if (isNative) {
      await connectCapacitorBle();
      return;
    }

    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome or Edge on Desktop/Android.');
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: 'KeyCabinet' },
          { services: [SERVICE_UUID] },
        ],
        optionalServices: [SERVICE_UUID],
      });
      await this.connectToDevice(device);
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.log('User cancelled Bluetooth pairing');
        return;
      }
      console.error('Bluetooth requestDevice failed:', error?.message || String(error));
      this.setStatus('error');
      throw error;
    }
  }

  public async connectToDevice(device: BluetoothDevice): Promise<void> {
    // In native mode the system picker already connects during scan.
    if (isNative) {
      console.log('Native BLE already connected via requestDevice.');
      return;
    }

    try {
      this.setStatus('connecting');
      this.device = device;

      device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      this.server = await device.gatt?.connect() || null;
      if (!this.server) throw new Error('Failed to connect to GATT Server');

      const service = await this.server.getPrimaryService(SERVICE_UUID);

      // Write characteristic (PWA → ESP32: unlock command)
      this.writeCharacteristic = await service.getCharacteristic(WRITE_CHAR_UUID);

      // Status characteristic (ESP32 → PWA: key presence notifications)
      this.statusCharacteristic = await service.getCharacteristic(STATUS_CHAR_UUID);
      await this.statusCharacteristic.startNotifications();
      this.statusCharacteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleStatusNotification.bind(this),
      );

      // Read current state immediately — firmware only notifies on change, not on connect
      try {
        const currentValue = await this.statusCharacteristic.readValue();
        this.processStatusValue(currentValue);
      } catch { /* ignore if characteristic is notify-only */ }

      this.setStatus('connected');
      console.log('BLE connected to KeyCabinet:', device.name);
    } catch (error: any) {
      console.error('Bluetooth connection failed:', error?.message || String(error));
      this.setStatus('error');
      throw error;
    }
  }

  // ── Disconnect ──────────────────────────────────────────────────

  private onDisconnected() {
    console.log('KeyCabinet BLE disconnected');
    if (this.statusCharacteristic) {
      this.statusCharacteristic.removeEventListener(
        'characteristicvaluechanged',
        this.handleStatusNotification.bind(this),
      );
    }
    this.setStatus('disconnected');
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this.statusCharacteristic = null;
  }

  public disconnect() {
    if (isNative) {
      disconnectCapacitorBle();
      return;
    }
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.onDisconnected();
  }

  // ── Key Presence Notifications (ESP32 → PWA) ────────────────────

  /** Process a DataView from the STATUS characteristic (0x01 = key in, 0x00 = taken) */
  private processStatusValue(dv: DataView) {
    const byte = dv.getUint8(0);
    if (byte !== 0x00 && byte !== 0x01) return;
    const keyPresent = byte === 0x01;
    this.onKeyPresenceCallbacks.forEach(cb => cb(keyPresent));
    const statusStr = keyPresent ? 'KEY_RETURNED' : 'KEY_TAKEN';
    this.onDataReceivedCallbacks.forEach(cb => cb(statusStr));
  }

  private handleStatusNotification(event: Event) {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    if (char.value) this.processStatusValue(char.value);
  }

  // ── Unlock Command (PWA → ESP32) ────────────────────────────────

  /** Send byte 0x01 to trigger the solenoid unlock */
  public async unlock(): Promise<void> {
    if (isNative) {
      await sendCapacitorBleUnlock();
      return;
    }
    if (!this.writeCharacteristic) {
      throw new Error('Not connected to KeyCabinet');
    }
    try {
      await this.writeCharacteristic.writeValue(new Uint8Array([1]));
      console.log('Unlock command sent to KeyCabinet');
    } catch (err: any) {
      console.error('Unlock failed:', err.message);
      throw err;
    }
  }

  /** Legacy sendCommand — for backward compatibility with AppRoot.tsx */
  public async sendCommand(command: string): Promise<void> {
    if (isNative) {
      await sendCapacitorBleCommand(command);
      return;
    }
    if (!this.writeCharacteristic) {
      throw new Error('Not connected to KeyCabinet');
    }
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command + '\n');
      await this.writeCharacteristic.writeValue(data);
    } catch (error: any) {
      console.error('Failed to send command:', error?.message || String(error));
      throw error;
    }
  }

  // ── Parse status (backward compat) ──────────────────────────────

  public parseStatus(msg: string): ControllerStatus | null {
    try {
      if (msg.startsWith('{') && msg.endsWith('}')) {
        return JSON.parse(msg);
      }
      // Handle KeyCabinet binary status strings
      if (msg === 'KEY_RETURNED' || msg === 'KEY_TAKEN') {
        return {
          online: true,
          lastSeen: Date.now(),
          ip: 'BLE',
          mode: 'STA',
          doorOpen: msg === 'KEY_TAKEN',
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}

export const bluetoothService = new BluetoothService();
