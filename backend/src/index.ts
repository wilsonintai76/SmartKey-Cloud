import { Hono } from 'hono';
import { cors } from 'hono/cors';
import registration from './webauthn/registration';
import authentication from './webauthn/authentication';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.route('/api/webauthn', registration);
app.route('/api/webauthn', authentication);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.get('/', (c) => c.json({
  name: 'SmartKey API',
  version: '3.0',
  endpoints: ['/api/webauthn/register/begin', '/api/webauthn/register/complete', '/api/webauthn/auth/begin', '/api/webauthn/auth/complete', '/api/health'],
}));

export default app;
