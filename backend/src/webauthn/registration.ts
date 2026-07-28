import { Hono } from 'hono';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getRegistrationOptions, getWebAuthnEnv, bytesToBase64url } from './utils';

type Bindings = { DB: D1Database; KV: KVNamespace; RP_ID: string; RP_NAME: string; ORIGIN: string };
const app = new Hono<{ Bindings: Bindings }>();

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

  const options = await getRegistrationOptions(env, {
    id: user.id as string,
    username: user.username as string,
    displayName: (user as any).display_name as string,
  });

  await c.env.KV.put(`challenge:${(user as any).id}`, options.challenge, { expirationTtl: 300 });
  return c.json(options);
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

  const challenge = await kv.get(`challenge:${userId}`);
  if (!challenge) return c.json({ error: 'Challenge expired. Please restart registration.' }, 400);

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

  if (!verification.verified || !verification.registrationInfo) {
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
    return c.json({ success: true, userId, credentialId: credId });
  }

  await db.prepare(
    `INSERT INTO credentials (credential_id, user_id, public_key, counter, device_type, transports, backup_eligible, backup_state, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    credId,
    userId,
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
  ).bind(userId, 'register', `device_type=${deviceType}`, Date.now()).run();

  await kv.delete(`challenge:${userId}`);
  return c.json({ success: true, userId, credentialId: credId });
});

export default app;
