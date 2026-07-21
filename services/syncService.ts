import { keyCabinetDB, KeyCabinetLog } from './keyCabinetDB';

const CLOUD_API = import.meta.env.VITE_CLOUD_API || 'https://your-hono.workers.dev/api/sync';

/**
 * Attempt to POST all unsynced logs to the cloud API.
 * Each successfully synced log is marked synced: 1 locally.
 */
export async function syncLogs(): Promise<{ synced: number; failed: number }> {
  const unsynced = await keyCabinetDB.getUnsynced();
  if (unsynced.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const log of unsynced) {
    try {
      const response = await fetch(CLOUD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          slotLabel: log.slotLabel,
          timestamp: log.timestamp,
        }),
      });

      if (response.ok) {
        await keyCabinetDB.markSynced(log.id!);
        synced++;
        console.log(`Log #${log.id} synced to cloud.`);
      } else {
        failed++;
        console.error(`Failed to sync log #${log.id}: HTTP ${response.status}`);
      }
    } catch (err) {
      failed++;
      console.error(`Sync error for log #${log.id}:`, err);
    }
  }

  console.log(`Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

/**
 * Manually sync a single log entry (used for real-time sync attempts).
 */
export async function syncSingleLog(log: KeyCabinetLog): Promise<boolean> {
  try {
    const response = await fetch(CLOUD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        slotLabel: log.slotLabel,
        timestamp: log.timestamp,
      }),
    });

    if (response.ok) {
      await keyCabinetDB.markSynced(log.id!);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
