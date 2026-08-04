import { Hono } from 'hono';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getRegistrationOptions, getWebAuthnEnv, bytesToBase64url, base64urlToBytes } from './utils';

type Bindings = { DB: D1Database; KV: KVNamespace; RP_ID: string; RP_NAME: string; ORIGIN: string };
const app = new Hono<{ Bindings: Bindings }>();

/**
 * Decode a base64url-encoded user ID (from options.user.id) back to the raw UUID string.
 * The server encodes userID as Uint8Array and generateRegistrationOptions returns it as base64url.
 */
function decodeUserId(b64UserId: string): string {
  return new TextDecoder().decode(base64urlToBytes(b64UserId));
}

/**
 * POST /api/webauthn/register/begin
 * Generates WebAuthn registration options for a new or existing user.
 * Challenge is stored in KV with 5-minute TTL.
 */
app.post('/register/begin', async (c) => {
  const { username } = await c.req.json<{ username: string }>();
  if (!username?.trim()) return c.json({ error: 'Username required' }, 400);

  const db = c.env.DB;
  const env = getWebAuthnEnv(c);

  let user = await db.prepare('SELECT id, username, display_name FROM users WHERE username = ?')
    .bind(username).first();
  if (!user) {
    const userId = crypto.randomUUID();
    await db.prepare('INSERT INTO users (id, username, display_name, created_at) VALUES (?, ?, ?, ?)')
      .bind(userId, username, username, Date.now()).run();
    user = { id: userId, username, display_name: username };
  }

  // Query existing credentials for excludeCredentials (prevents duplicate registration)
  const existingCreds = await db.prepare(
    'SELECT credential_id, transports FROM credentials WHERE user_id = ?'
  ).bind(user.id as string).all();

  const excludeCredentials = existingCreds.results.map((c: any) => {
    let transports: AuthenticatorTransport[] = [];
    try { transports = JSON.parse(c.transports as string); } catch {}
    return { id: c.credential_id as string, transports };
  });

  const options = await getRegistrationOptions(env, {
    id: user.id as string,
    username: user.username as string,
    displayName: (user as any).display_name as string,
  }, excludeCredentials);

  // Store challenge keyed by base64url userId (what the browser sends back)
  // NOT the raw UUID — generateRegistrationOptions returns user.id as base64url
  await c.env.KV.put(`challenge:${options.user.id}`, options.challenge, { expirationTtl: 300 });
  return c.json({
    ...options,
    alreadyRegistered: existingCreds.results.length > 0,
  });
});

/**
 * POST /api/webauthn/register/complete
 * Verifies the attestation from the authenticator and stores the credential.
 * Also creates an audit log entry.
 */
app.post('/register/complete', async (c) => {
  const { userId, attestationResponse } = await c.req.json<{ userId: string; attestationResponse: any }>();
  const db = c.env.DB;
  const kv = c.env.KV;
  const env = getWebAuthnEnv(c);

  // userId from browser is base64url-encoded (from options.user.id)
  const challenge = await kv.get(`challenge:${userId}`);
  if (!challenge) return c.json({ error: 'Challenge expired. Please restart registration.' }, 400);

  // Decode base64url userId → raw UUID for D1 lookups
  const rawUserId = decodeUserId(userId);

  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challenge,
      expectedOrigin: env.origin,
      expectedRPID: env.rpId,
    });
  } catch (err: any) {
    return c.json({ error: `Verification failed: ${err.message}` }, 400);
  }

  if (!verification.verified || !verification.registrationInfo?.credential) {
    console.error('[register/complete] Verification details:', {
      verified: verification.verified,
      hasRegistrationInfo: !!verification.registrationInfo,
      hasCredential: !!verification.registrationInfo?.credential,
      origin: env.origin,
      rpId: env.rpId,
      challengeExists: !!challenge,
    });
    return c.json({ error: 'Registration verification failed — device attestation rejected' }, 400);
  }

  const { credential } = verification.registrationInfo;

  // credential.id is base64url, credential.publicKey is Uint8Array
  const credId = credential.id; // already base64url string
  const pubKeyBytes = new Uint8Array(credential.publicKey);
  const deviceType = attestationResponse.authenticatorAttachment ?? 'platform';
  const transports = JSON.stringify(attestationResponse.response?.transports ?? ['internal']);

  // Check if credential already exists (idempotent re-registration)
  const existing = await db.prepare('SELECT credential_id FROM credentials WHERE credential_id = ?')
    .bind(credId).first();
  if (existing) {
    await kv.delete(`challenge:${userId}`);
    return c.json({ success: true, userId: rawUserId, credentialId: credId });
  }

  await db.prepare(
    `INSERT INTO credentials (credential_id, user_id, public_key, counter, device_type, transports, backup_eligible, backup_state, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    credId,
    rawUserId,
    pubKeyBytes,
    0,
    deviceType,
    transports,
    (credential as any).backupEligible ? 1 : 0,
    (credential as any).backupState ? 1 : 0,
    Date.now()
  ).run();

  // Audit log
  await db.prepare(
    'INSERT INTO audit_logs (user_id, action, device_info, created_at) VALUES (?, ?, ?, ?)'
  ).bind(rawUserId, 'register', `device_type=${deviceType}`, Date.now()).run();

  await kv.delete(`challenge:${userId}`);
  return c.json({ success: true, userId: rawUserId, credentialId: credId });
});

export default app;
