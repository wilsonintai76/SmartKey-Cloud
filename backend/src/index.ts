import { Hono } from 'hono';
import { cors } from 'hono/cors';
import registration from './webauthn/registration';
import authentication, { verifySessionToken } from './webauthn/authentication';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  RP_ID?: string;
  RP_NAME?: string;
  ORIGIN?: string;
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: { userId?: string; username?: string } }>();

// ── CORS ──────────────────────────────────────────────────────────

app.use('/*', cors({
  origin: (origin) => {
    // Allow localhost dev origins + your production domain
    const allowed = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8787'];
    if (origin && (origin.startsWith('http://localhost') || origin.endsWith('.pages.dev'))) return origin;
    return allowed[0];
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: [],
  maxAge: 86400,
}));

// ── Auth middleware (inject userId/username from Bearer token) ────

app.use('/api/audit/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = await verifySessionToken(c.env as any, token, c.env.DB);
    if (session) {
      c.set('userId', session.userId);
      c.set('username', session.username);
    }
  }
  await next();
});

// ── Routes ────────────────────────────────────────────────────────

app.route('/api/webauthn', registration);
app.route('/api/webauthn', authentication);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// ── Audit log endpoints ───────────────────────────────────────────

/**
 * GET /api/audit/logs
 * Returns recent audit log entries. Requires Bearer token.
 * Optional query params: ?action=cabinet_open&limit=50&before=timestamp
 */
app.get('/api/audit/logs', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const action = c.req.query('action');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const before = c.req.query('before');

  let sql = 'SELECT id, user_id, action, slot_label, peg_state_before, peg_state_after, created_at FROM audit_logs WHERE user_id = ?';
  const params: any[] = [userId];

  if (action) { sql += ' AND action = ?'; params.push(action); }
  if (before) { sql += ' AND created_at < ?'; params.push(parseInt(before)); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const logs = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ logs: logs.results });
});

/**
 * POST /api/audit/event
 * Records an audit event (cabinet open/close, etc.). Requires Bearer token.
 * Body: { action, slotLabel, pegStateBefore, pegStateAfter }
 */
app.post('/api/audit/event', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const { action, slotLabel, pegStateBefore, pegStateAfter } = await c.req.json<{
    action: string;
    slotLabel?: string;
    pegStateBefore?: string;
    pegStateAfter?: string;
  }>();

  if (!action) return c.json({ error: 'Action required' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO audit_logs (user_id, action, slot_label, peg_state_before, peg_state_after, device_info, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    action,
    slotLabel || null,
    pegStateBefore || null,
    pegStateAfter || null,
    c.req.header('User-Agent') || 'unknown',
    Date.now()
  ).run();

  return c.json({ success: true });
});

// Root
app.get('/', (c) => c.json({
  name: 'SmartKey API',
  version: '3.0',
  endpoints: [
    '/api/webauthn/register/begin',
    '/api/webauthn/register/complete',
    '/api/webauthn/auth/begin',
    '/api/webauthn/auth/complete',
    '/api/webauthn/auth/verify',
    '/api/webauthn/auth/logout',
    '/api/audit/logs',
    '/api/audit/event',
    '/api/health',
  ],
}));

export default app;
