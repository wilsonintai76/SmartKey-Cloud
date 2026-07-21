
export enum KeyStatus {
  AVAILABLE = 'Available',
  BORROWED = 'Borrowed',
  UNLOCKED = 'Unlocked'
}

export interface KeySlot {
  id: number;
  label: string;
  status: KeyStatus;
  lastUpdated: string;
  borrowedBy?: string; // Still used for display
  borrowerId?: string; // New: Foreign Key to User
  borrowedAt?: string;
  usageCount: number;
  isLocked?: boolean;
  voltage?: number; 
  networkLatency?: number; // Replaced signalStrength with ms latency for Ethernet
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string; // Still used for display
  userId?: string; // New: Foreign Key to User
  action: string;
  keyLabel: string;
  type: 'success' | 'warning' | 'info';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'locked' | 'pending' | 'inactive';
  role: 'staff' | 'admin' | '';
  avatar: string;
  phone?: string;
  macAddress?: string; // Digital Binding for Offline Access
  userId?: string;  // 4-Digit User ID for Manual Offline Login
  offlinePin?: string; // New: Simple PIN for Manual Offline
}

export interface SystemConfig {
  maxBorrowDuration: number;
  gracePeriod: number;
  officeOpenTime: string;
  officeCloseTime: string;
  maintenanceThreshold: number;
  systemID: string;
  sessionTimeout: number;
  offlineStorage: 'browser' | 'board';
  adminEmail?: string;
}

export type BluetoothStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';

export interface ControllerStatus {
  online: boolean;
  lastSeen: number;
  ip: string;
  mac?: string;
  mode: 'STA' | 'AP';
  voltage?: number; // Real RTC Battery Voltage
  rssi?: number;    // WiFi Signal Strength
  uptime?: string;  // System Uptime
  doorOpen: boolean; 
  emergencyTrigger?: boolean;
}