// Pages Function: proxies /api/* → Worker at workers.dev
// Browser sees same-origin (smartkey-7ak.pages.dev) so WebAuthn rpID matches.
const WORKER = 'https://smartkey-production.wilson-b6f.workers.dev';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.hostname = new URL(WORKER).hostname;
  return fetch(new Request(url.toString(), context.request));
}