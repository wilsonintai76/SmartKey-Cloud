/**
 * Lightweight offline audit event queue using localStorage.
 * Replaces the old Dexie/IndexedDB buffer — no dependencies.
 *
 * When offline, audit events are queued in localStorage.
 * When connectivity returns, the queue is flushed to Cloudflare D1.
 */

const STORAGE_KEY = 'smartkey_audit_queue';

export interface QueuedAuditEvent {
  action: string;
  slotLabel?: string;
  pegStateBefore?: string;
  pegStateAfter?: string;
  timestamp: number;
}

/** Read the pending queue from localStorage */
function getQueue(): QueuedAuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Write the pending queue to localStorage */
function setQueue(queue: QueuedAuditEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to write offline queue to localStorage:', e);
  }
}

/** Queue an audit event for later delivery */
export function queueAuditEvent(event: Omit<QueuedAuditEvent, 'timestamp'>): void {
  const queue = getQueue();
  queue.push({ ...event, timestamp: Date.now() });
  setQueue(queue);
  console.log(`📦 Queued audit event (${queue.length} pending): ${event.action}`);
}

/** Flush all queued events to the cloud API */
export async function flushAuditQueue(
  sendFn: (event: QueuedAuditEvent) => Promise<boolean>
): Promise<{ flushed: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;
  const remaining: QueuedAuditEvent[] = [];

  for (const event of queue) {
    try {
      const ok = await sendFn(event);
      if (ok) {
        flushed++;
      } else {
        remaining.push(event);
        failed++;
      }
    } catch {
      remaining.push(event);
      failed++;
    }
  }

  setQueue(remaining);
  console.log(`🔄 Offline queue flushed: ${flushed} sent, ${failed} remain`);
  return { flushed, failed };
}

/** Get the number of pending events in the queue */
export function getQueueLength(): number {
  return getQueue().length;
}
