import { Hono } from 'hono';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getAuthOptions, getWebAuthnEnv, base64urlToBytes } from './utils';

type Bindings = { DB: D1Database; KV: KVNamespace; RP_ID: string; RP_NAME: string; ORIGIN: string; JWT_SECRET?: string };
const app = new Hono<{ Bindings: Bindings }>();

// ── JWT helpers (Worker-compatible, using Web Crypto) ─────────────

async function createSessionToken(
  env: { JWT_SECRET?: string },
  userId: string,
  username: string,
  db: D1Database
): Promise<string> {
  const secretStr = env.JWT_SECRET || 'smartkey-dev-secret-change-in-production';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretStr);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    username,
    iat: now,
    exp: now + 86400, // 24 hours
    jti: crypto.randomUUID(),
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: 'HMAC' }, cryptoKey, encoder.encode(signingInput)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const token = `${signingInput}.${sigB64}`;

  // Store session hash for revocation
  const tokenHashBytes = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const tokenHash = Array.from(new Uint8Array(tokenHashBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  await db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(tokenHash, userId, (now + 86400) * 1000, Date.now()).run();

  return token;
}

export async function verifySessionToken(
  env: { JWT_SECRET?: string },
  token: string,
  db: D1Database
): Promise<{ userId: string; username: string } | null> {
  try {
    const secretStr = env.JWT_SECRET || 'smartkey-dev-secret-change-in-production';
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretStr);

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    const sigBytes = base64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify(
      { name: 'HMAC' }, cryptoKey, sigBytes, encoder.encode(signingInput)
    );

    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp * 1000 < Date.now()) return null;

    // Check not revoked
    const tokenHashBytes = await crypto.subtle.digest('SHA-256', encoder.encode(token));
    const tokenHash = Array.from(new Uint8Array(tokenHashBytes))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const session = await db.prepare(
      'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?'
    ).bind(tokenHash, Date.now()).first();

    if (!session) return null;

    return { userId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

// ── Routes ────────────────────────────────────────────────────────

/**
 * POST /api/webauthn/auth/begin
 * Generates authentication challenge for an existing user.
 */
app.post('/auth/begin', async (c) => {
  const { username } = await c.req.json<{ username?: string }>();
  const db = c.env.DB;
  const env = getWebAuthnEnv(c);

  let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];

  if (username?.trim()) {
    // Username provided: look up specific user's credentials
    const user = await db.prepare('SELECT id, username FROM users WHERE username = ?')
      .bind(username).first();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const creds = await db.prepare(
      'SELECT credential_id, transports FROM credentials WHERE user_id = ?'
    ).bind((user as any).id).all();

    if (creds.results.length === 0) {
      return c.json({ error: 'No biometric credential registered. Please register first.' }, 400);
    }

    allowCredentials = creds.results.map((cr: any) => {
      let transports: AuthenticatorTransport[] = ['internal'];
      try { transports = JSON.parse(cr.transports as string); } catch {}
      return { id: cr.credential_id as string, transports };
    });
  }
  // username NOT provided: usernameless — browser shows native user picker (resident key)

  const options = await getAuthOptions(env, allowCredentials);

  // Store challenge → userId mapping (for completion lookup)
  const lookupKey = username?.trim() || '_discoverable';
  await c.env.KV.put(`auth:${options.challenge}`, lookupKey, { expirationTtl: 300 });
  return c.json(options);
});

/**
 * POST /api/webauthn/auth/complete
 * Verifies the authentication assertion and returns a session JWT.
 */
app.post('/auth/complete', async (c) => {
  const { assertionResponse, challenge } = await c.req.json<{
    assertionResponse: any; challenge: string;
  }>();
  const db = c.env.DB;
  const kv = c.env.KV;
  const env = getWebAuthnEnv(c);

  const lookupKey = await kv.get(`auth:${challenge}`);
  if (!lookupKey) return c.json({ error: 'Challenge expired. Please try again.' }, 400);

  // For usernameless (discoverable), find the credential by ID
  let cred: any;
  if (lookupKey === '_discoverable') {
    const credId = assertionResponse.id;  // credential ID from browser
    cred = await db.prepare(
      'SELECT user_id, credential_id, public_key, counter FROM credentials WHERE credential_id = ?'
    ).bind(credId).first();
    if (!cred) return c.json({ error: 'Credential not found' }, 404);
  } else {
    cred = await db.prepare(
      'SELECT user_id, credential_id, public_key, counter FROM credentials WHERE user_id = ?'
    ).bind(lookupKey).first();
    if (!cred) return c.json({ error: 'Credential not found' }, 404);
  }

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: challenge,
      expectedOrigin: env.origin,
      expectedRPID: env.rpId,
      authenticator: {
        credentialPublicKey: new Uint8Array((cred as any).public_key as ArrayBuffer),
        credentialID: (cred as any).credential_id as string,
        counter: (cred as any).counter as number,
        transports: ['internal'],
      },
    });
  } catch (err: any) {
    return c.json({ error: `Verification failed: ${err.message}` }, 400);
  }

  if (!verification.verified || !verification.authenticationInfo) {
    return c.json({ error: 'Biometric verification failed — signature mismatch' }, 400);
  }

  // Update counter (replay protection)
  await db.prepare('UPDATE credentials SET counter = ? WHERE credential_id = ?')
    .bind(verification.authenticationInfo.newCounter, (cred as any).credential_id).run();

  await kv.delete(`auth:${challenge}`);

  const resolvedUserId = cred.user_id as string;

  // Get user info
  const user = await db.prepare('SELECT id, username, display_name FROM users WHERE id = ?')
    .bind(resolvedUserId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  // Create session token
  const token = await createSessionToken(
    c.env as any, resolvedUserId, (user as any).username, db
  );

  // Audit log
  await db.prepare(
    'INSERT INTO audit_logs (user_id, action, device_info, created_at) VALUES (?, ?, ?, ?)'
  ).bind(resolvedUserId, 'login', c.req.header('User-Agent') || 'unknown', Date.now()).run();

  return c.json({
    success: true,
    token,
    user: {
      id: (user as any).id,
      username: (user as any).username,
      displayName: (user as any).display_name,
    },
  });
});

/**
 * POST /api/webauthn/auth/verify
 * Validates an existing session token (used on app reload).
 */
app.post('/auth/verify', async (c) => {
  const { token } = await c.req.json<{ token: string }>();
  if (!token) return c.json({ error: 'Token required' }, 400);

  const session = await verifySessionToken(c.env as any, token, c.env.DB);
  if (!session) return c.json({ error: 'Invalid or expired session' }, 401);

  const user = await c.env.DB.prepare('SELECT id, username, display_name FROM users WHERE id = ?')
    .bind(session.userId).first();

  return c.json({
    success: true,
    user: {
      id: (user as any).id,
      username: (user as any).username,
      displayName: (user as any).display_name,
    },
  });
});

/**
 * POST /api/webauthn/auth/logout
 * Revokes a session token.
 */
app.post('/auth/logout', async (c) => {
  const { token } = await c.req.json<{ token: string }>();
  if (!token) return c.json({ error: 'Token required' }, 400);

  const encoder = new TextEncoder();
  const tokenHashBytes = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const tokenHash = Array.from(new Uint8Array(tokenHashBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
  return c.json({ success: true });
});

export default app;
