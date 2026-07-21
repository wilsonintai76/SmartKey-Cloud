/**
 * WebAuthn API client — talks to the Cloudflare Hono backend.
 * Uses @simplewebauthn/browser on the frontend for credential creation/assertion.
 */

const API_BASE = import.meta.env.VITE_WEBAUTHN_API || '/api/webauthn';

export interface WebAuthnUser {
  id: string;
  username: string;
  displayName?: string;
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

export async function completeAuthentication(assertionResponse: any, challenge: string) {
  const res = await fetch(`${API_BASE}/auth/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assertionResponse, challenge }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Authentication failed');
  }
  return res.json();
}
