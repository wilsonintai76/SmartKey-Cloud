import Dexie, { Table } from 'dexie';

export interface KeyCabinetLog {
  id?: number;
  userId: string;
  userName: string;
  action: 'TAKEN' | 'RETURNED';
  slotLabel?: string;
  timestamp: number;
  synced: 0 | 1; // 0 = pending sync, 1 = synced to cloud
}

class KeyCabinetDB extends Dexie {
  logs!: Table<KeyCabinetLog>;

  constructor() {
    super('KeyCabinetDB');
    this.version(1).stores({
      logs: '++id, userId, action, timestamp, synced',
    });
  }

  /** Add a log entry and return its id */
  async addLog(entry: Omit<KeyCabinetLog, 'id' | 'synced'>): Promise<number> {
    return this.logs.add({ ...entry, synced: 0 });
  }

  /** Get all unsynced logs */
  async getUnsynced(): Promise<KeyCabinetLog[]> {
    return this.logs.where('synced').equals(0).toArray();
  }

  /** Mark a log as synced */
  async markSynced(id: number): Promise<void> {
    await this.logs.update(id, { synced: 1 });
  }

  /** Get recent logs (last N entries, most recent first) */
  async getRecent(limit = 50): Promise<KeyCabinetLog[]> {
    return this.logs.orderBy('timestamp').reverse().limit(limit).toArray();
  }

  /** Count unsynced logs */
  async unsyncedCount(): Promise<number> {
    return this.logs.where('synced').equals(0).count();
  }
}

export const keyCabinetDB = new KeyCabinetDB();
