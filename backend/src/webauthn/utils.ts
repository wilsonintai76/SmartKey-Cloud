import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';

/**
 * Worker-compatible base64url encode/decode (no Node.js Buffer).
 * In Workers, @simplewebauthn/server v10+ handles Uint8Array natively,
 * but credential IDs and public keys stored in D1 need BLOB ↔ base64url conversion.
 */

export function base64urlToBytes(b64: string): Uint8Array {
  // Normalize base64url → base64
  const base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64 + padding);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Environment-aware config ──────────────────────────────────────

export interface WebAuthnEnv {
  rpId: string;
  rpName: string;
  origin: string;
}

export function getWebAuthnEnv(c: any): WebAuthnEnv {
  const origin = c.req.header('Origin') || c.env.ORIGIN || 'http://localhost:3000';
  // Derive rpId from the origin if no explicit RP_ID set (or it's still "localhost")
  const rpId = (c.env.RP_ID && c.env.RP_ID !== 'localhost')
    ? c.env.RP_ID
    : (() => {
        try {
          const url = new URL(origin);
          // For *.pages.dev, use the parent domain so all deploy hashes share the same RP
          if (url.hostname.endsWith('.pages.dev')) {
            const parts = url.hostname.split('.');
            // e.g. 026aad8f.smartkey-7ak.pages.dev → smartkey-7ak.pages.dev
            if (parts.length >= 4) return parts.slice(-3).join('.');
            return url.hostname;
          }
          return url.hostname;
        } catch { return 'localhost'; }
      })();
  return {
    rpId,
    rpName: c.env.RP_NAME || 'Key Cabinet',
    origin,
  };
}

export function getRegistrationOptions(
  env: WebAuthnEnv,
  user: { id: string; username: string; displayName: string }
) {
  // @simplewebauthn/server v10+ requires userID as Uint8Array
  const encoder = new TextEncoder();
  return generateRegistrationOptions({
    rpName: env.rpName,
    rpID: env.rpId,
    userID: encoder.encode(user.id),
    userName: user.username,
    userDisplayName: user.displayName,
    authenticatorSelection: {
      // No authenticatorAttachment = allow both biometric + USB keys
      residentKey: 'preferred',
      userVerification: 'preferred',  // 'preferred' = try biometric, fall back gracefully
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 + RS256
  });
}

export function getAuthOptions(
  env: WebAuthnEnv,
  allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[]
) {
  return generateAuthenticationOptions({
    rpID: env.rpId,
    allowCredentials: allowCredentials as any,
    userVerification: 'preferred',
  });
}
