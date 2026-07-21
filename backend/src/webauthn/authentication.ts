import { Hono } from 'hono';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getAuthOptions } from './utils';

type Bindings = { DB: D1Database; KV: KVNamespace };
const app = new Hono<{ Bindings: Bindings }>();

// POST /api/webauthn/auth/begin
app.post('/auth/begin', async (c) => {
  const { username } = await c.req.json<{ username: string }>();
  if (!username?.trim()) return c.json({ error: 'Username required' }, 400);

  const db = c.env.DB;
  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const creds = await db.prepare('SELECT id FROM webauthn_credentials WHERE user_id = ?')
    .bind((user as any).id).all();

  if (creds.results.length === 0) {
    return c.json({ error: 'No fingerprint registered for this user' }, 400);
  }

  const allowCredentials = creds.results.map((c: any) => ({
    id: c.id as string,
    transports: ['internal'] as AuthenticatorTransport[],
  }));

  const options = await getAuthOptions(allowCredentials);

  await c.env.KV.put(`auth:${options.challenge}`, (user as any).id as string, { expirationTtl: 300 });
  return c.json(options);
});

// POST /api/webauthn/auth/complete
app.post('/auth/complete', async (c) => {
  const { assertionResponse, challenge } = await c.req.json<{ assertionResponse: any; challenge: string }>();
  const db = c.env.DB;
  const kv = c.env.KV;

  const userId = await kv.get(`auth:${challenge}`);
  if (!userId) return c.json({ error: 'Challenge expired' }, 400);

  const cred = await db.prepare(
    'SELECT id, public_key, counter FROM webauthn_credentials WHERE user_id = ?'
  ).bind(userId).first();
  if (!cred) return c.json({ error: 'Credential not found' }, 404);

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: challenge,
    expectedOrigin: 'http://localhost:3000',
    expectedRPID: 'localhost',
    authenticator: {
      credentialPublicKey: Buffer.from((cred as any).public_key as string, 'base64url'),
      credentialID: Buffer.from((cred as any).id as string, 'base64url'),
      counter: (cred as any).counter as number,
    },
  });

  if (!verification.verified || !verification.authenticationInfo) {
    return c.json({ error: 'Fingerprint verification failed' }, 400);
  }

  await db.prepare('UPDATE webauthn_credentials SET counter = ? WHERE id = ?')
    .bind(verification.authenticationInfo.newCounter, (cred as any).id).run();

  await kv.delete(`auth:${challenge}`);

  const user = await db.prepare('SELECT id, username, display_name FROM users WHERE id = ?')
    .bind(userId).first();

  return c.json({ success: true, user });
});

export default app;
