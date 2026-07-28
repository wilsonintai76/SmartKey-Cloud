import { Hono } from 'hono';
import { cors } from 'hono/cors';
import registration from './webauthn/registration';
import authentication, { verifySessionToken } from './webauthn/authentication';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: R2Bucket;
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

// ── Global error handler ──────────────────────────────────────────

app.onError((err, c) => {
  console.error('Worker error:', err.message, err.stack);
  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500);
});

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

// ── User sync & PIN auth (cross-device) ───────────────────────────

/**
 * POST /api/users/sync
 * Returns all registered users (no auth needed for login screen).
 * Excludes sensitive data — only returns id, name, staff_id, role.
 */
app.get('/api/users', async (c) => {
  const users = await c.env.DB.prepare(
    'SELECT id, username, display_name, staff_id FROM users ORDER BY created_at DESC'
  ).all();
  return c.json({ users: users.results });
});

/**
 * POST /api/auth/pin
 * Cross-device PIN verification. Takes staff_id + pin, verifies against D1.
 */
app.post('/api/auth/pin', async (c) => {
  const { staffId, pin } = await c.req.json<{ staffId: string; pin: string }>();
  if (!staffId || !pin) return c.json({ error: 'Staff ID and PIN required' }, 400);

  const user = await c.env.DB.prepare(
    'SELECT id, username, display_name, staff_id FROM users WHERE staff_id = ? AND pin = ?'
  ).bind(staffId, pin).first();

  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  return c.json({
    success: true,
    user: {
      id: user.id,
      name: user.display_name || user.username,
      staffId: user.staff_id,
    },
  });
});

/**
 * POST /api/users/register
 * Sync local first-time setup to D1. Creates or updates user with PIN.
 */
app.post('/api/users/register', async (c) => {
  const { name, email, staffId, pin } = await c.req.json<{
    name: string; email?: string; staffId: string; pin: string;
  }>();
  if (!name || !staffId || !pin) return c.json({ error: 'Name, staff ID, and PIN required' }, 400);

  const db = c.env.DB;
  const id = crypto.randomUUID();
  const username = staffId; // use staff_id as username for WebAuthn compatibility

  // Check if staff_id already exists
  const existing = await db.prepare('SELECT id FROM users WHERE staff_id = ? OR username = ?')
    .bind(staffId, username).first();

  if (existing) {
    // Update existing user's PIN
    await db.prepare('UPDATE users SET pin = ?, display_name = ? WHERE id = ?')
      .bind(pin, name, existing.id).run();
    return c.json({ success: true, userId: existing.id, existed: true });
  }

  await db.prepare(
    'INSERT INTO users (id, username, display_name, staff_id, pin, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, username, name, staffId, pin, Date.now()).run();

  return c.json({ success: true, userId: id, existed: false });
});

// ── R2 Asset serving ──────────────────────────────────────────────

/**
 * GET /assets/:filename
 * Serves assets (logos, icons) from R2 with caching headers.
 */
app.get('/assets/:filename', async (c) => {
  const filename = c.req.param('filename');
  const object = await c.env.ASSETS.get(filename);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=86400, immutable');
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
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
    '/api/auth/pin',
    '/api/users',
    '/api/users/register',
    '/api/audit/logs',
    '/api/audit/event',
    '/assets/:filename',
    '/api/health',
  ],
}));

export default app;
