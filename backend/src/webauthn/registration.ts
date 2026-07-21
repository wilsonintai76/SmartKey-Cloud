import { Hono } from 'hono';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getRegistrationOptions } from './utils';

type Bindings = { DB: D1Database; KV: KVNamespace };
const app = new Hono<{ Bindings: Bindings }>();

// POST /api/webauthn/register/begin
app.post('/register/begin', async (c) => {
  const { username } = await c.req.json<{ username: string }>();
  if (!username?.trim()) return c.json({ error: 'Username required' }, 400);

  const db = c.env.DB;

  let user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user) {
    const userId = crypto.randomUUID();
    await db.prepare('INSERT INTO users (id, username, display_name, created_at) VALUES (?, ?, ?, ?)')
      .bind(userId, username, username, Date.now()).run();
    user = { id: userId, username, display_name: username };
  }

  const options = await getRegistrationOptions({
    id: user.id as string,
    username: user.username as string,
    displayName: (user as any).display_name as string,
  });

  await c.env.KV.put(`challenge:${(user as any).id}`, options.challenge, { expirationTtl: 300 });
  return c.json(options);
});

// POST /api/webauthn/register/complete
app.post('/register/complete', async (c) => {
  const { userId, attestationResponse } = await c.req.json<{ userId: string; attestationResponse: any }>();
  const db = c.env.DB;
  const kv = c.env.KV;

  const challenge = await kv.get(`challenge:${userId}`);
  if (!challenge) return c.json({ error: 'Challenge expired' }, 400);

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge: challenge,
    expectedOrigin: 'http://localhost:3000',
    expectedRPID: 'localhost',
  });

  if (!verification.verified || !verification.registrationInfo) {
    return c.json({ error: 'Registration verification failed' }, 400);
  }

  const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

  await db.prepare(
    'INSERT INTO webauthn_credentials (id, user_id, public_key, counter, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    Buffer.from(credentialID).toString('base64url'),
    userId,
    Buffer.from(credentialPublicKey).toString('base64url'),
    counter,
    Date.now()
  ).run();

  await kv.delete(`challenge:${userId}`);
  return c.json({ success: true, userId });
});

export default app;
