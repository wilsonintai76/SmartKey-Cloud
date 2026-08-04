import { useEffect } from 'react';

/**
 * Checks if a newer version of the app is available.
 * Fetches the manifest version from the server and compares with the built-in version.
 * Shows a toast when a new version is detected.
 */

// @ts-ignore — injected by Vite define
declare const __APP_VERSION__: string;
const CURRENT_VERSION = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : 'dev';

export function useVersionCheck(
  onNewVersion: (current: string, latest: string) => void,
  intervalMs = 60000
) {
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/manifest.webmanifest', { cache: 'no-store' });
        if (!res.ok) return;
        const manifest = await res.json();
        const serverVersion = manifest.version;

        if (serverVersion && serverVersion !== CURRENT_VERSION && !cancelled) {
          onNewVersion(CURRENT_VERSION, serverVersion);
        }
      } catch {
        // Network error — skip
      }
    }

    check();
    const timer = setInterval(check, intervalMs);
    return () => { cancelled = true; clearInterval(timer); };
  }, [onNewVersion, intervalMs]);
}

export { CURRENT_VERSION };
