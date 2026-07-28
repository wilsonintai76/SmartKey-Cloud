/**
 * WebAuthn API client — talks to the Cloudflare Hono backend.
 * Uses @simplewebauthn/browser on the frontend for credential creation/assertion.
 *
 * Session tokens are stored in sessionStorage (cleared on tab close)
 * and used to authenticate audit log writes and BLE door commands.
 */

const API_BASE = import.meta.env.VITE_WEBAUTHN_API || '/api/webauthn';
const AUDIT_API = import.meta.env.VITE_AUDIT_API || '/api/audit';

export interface WebAuthnUser {
  id: string;
  username: string;
  displayName?: string;
}

export interface AuthResult {
  success: boolean;
  token: string;
  user: WebAuthnUser;
}

// ── Token storage ─────────────────────────────────────────────────

const TOKEN_KEY = 'smartkey_session_token';

export function getSessionToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── Registration ──────────────────────────────────────────────────

export async function beginRegistration(username: string) {
  const res = await fetch(`${API_BASE}/register/begin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Registration start failed');
  }
  return res.json();
}

export async function completeRegistration(userId: string, attestationResponse: any) {
  const res = await fetch(`${API_BASE}/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, attestationResponse }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Registration verification failed');
  }
  return res.json();
}

// ── Authentication ────────────────────────────────────────────────

export async function beginAuthentication(username: string) {
  const res = await fetch(`${API_BASE}/auth/begin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Auth start failed');
  }
  return res.json();
}

export async function completeAuthentication(
  assertionResponse: any,
  challenge: string
): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assertionResponse, challenge }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Biometric verification failed');
  }
  const data = await res.json();
  if (data.token) {
    setSessionToken(data.token);
  }
  return data;
}

/**
 * Verify an existing session token (e.g., on app reload).
 */
export async function verifySession(): Promise<AuthResult | null> {
  const token = getSessionToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      clearSessionToken();
      return null;
    }
    return await res.json();
  } catch {
    clearSessionToken();
    return null;
  }
}

/**
 * Revoke the current session token (logout).
 */
export async function logoutSession(): Promise<void> {
  const token = getSessionToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch {}
  }
  clearSessionToken();
}

// ── Cross-device PIN auth (cloud-backed) ──────────────────────────

const USERS_API = import.meta.env.VITE_CLOUD_API?.replace('/sync', '') || '/api';

export interface CloudUser {
  id: string;
  name: string;
  staffId: string;
  username?: string;
  display_name?: string;
}

export interface PinAuthResult {
  success: boolean;
  user: CloudUser;
}

/** Fetch all registered users from D1 (for login screen on new devices) */
export async function fetchCloudUsers(): Promise<CloudUser[]> {
  try {
    const res = await fetch(`${USERS_API}/users`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.users || []).map((u: any) => ({
      id: u.id,
      name: u.display_name || u.username,
      staffId: u.staff_id,
      username: u.username,
      display_name: u.display_name,
    }));
  } catch {
    return [];
  }
}

/** Verify PIN against D1 (cross-device fallback) */
export async function verifyCloudPin(staffId: string, pin: string): Promise<PinAuthResult | null> {
  try {
    const res = await fetch(`${USERS_API}/auth/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, pin }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Sync first-time setup user to D1 */
export async function registerCloudUser(name: string, staffId: string, pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${USERS_API}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, staffId, pin }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Audit logging (authenticated) ─────────────────────────────────

export async function recordAuditEvent(
  action: string,
  slotLabel?: string,
  pegStateBefore?: string,
  pegStateAfter?: string
): Promise<boolean> {
  const token = getSessionToken();
  if (!token) return false;

  try {
    const res = await fetch(`${AUDIT_API}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action, slotLabel, pegStateBefore, pegStateAfter }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
