import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/config/sessions.ts', import.meta.url), 'utf8');
async function loadSessions(env = {}) {
  const { outputText } = ts.transpileModule(source.replaceAll('import.meta.env', JSON.stringify(env)), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)).sessions;
}

const paid = { PUBLIC_SESSION_BOOKING_URL: 'https://cal.com/danny/ai-business-leaders', PUBLIC_SESSION_PRICE_USD: '250' };

test('unconfigured sessions offer email requests, never a fake calendar or payment', async () => {
  const sessions = await loadSessions();
  for (const session of Object.values(sessions)) {
    assert.equal(session.connected, false);
    assert.equal(session.calLink, undefined);
    assert.match(session.href, /^mailto:hello@dannysullivan.ai\?/);
  }
  assert.equal(sessions.private.price, undefined);
  assert.equal(sessions.discovery.duration, 20);
  assert.equal(sessions.private.duration, 60);
});

test('each configured session resolves to its own calendar and shareable local page', async () => {
  const sessions = await loadSessions({ ...paid, PUBLIC_DISCOVERY_BOOKING_URL: 'https://www.cal.com/danny/discovery/' });
  assert.equal(sessions.discovery.href, 'https://cal.com/danny/discovery');
  assert.equal(sessions.discovery.calLink, 'danny/discovery');
  assert.equal(sessions.discovery.page, '/book/discovery/');
  assert.equal(sessions.private.calLink, 'danny/ai-business-leaders');
  assert.equal(sessions.private.page, '/book/private/');
  assert.equal(sessions.private.price, '$250');
  assert.equal(sessions.private.cta, 'Choose a time & pay');
});

test('free booking can launch independently of paid booking', async () => {
  const sessions = await loadSessions({ PUBLIC_DISCOVERY_BOOKING_URL: 'https://cal.com/danny/discovery' });
  assert.equal(sessions.discovery.connected, true);
  assert.equal(sessions.private.connected, false);
});

test('a paid calendar requires an explicitly configured price', async () => {
  await assert.rejects(() => loadSessions({ PUBLIC_SESSION_BOOKING_URL: paid.PUBLIC_SESSION_BOOKING_URL }), /Set PUBLIC_SESSION_PRICE_USD/);
});

test('rejects unsafe URLs, profile pages, and standalone Stripe payment links', async () => {
  // Build the dummy credential fixture explicitly so secret scanners do not
  // mistake a literal authenticated URL for a real credential.
  const authenticatedUrl = new URL('https://cal.com/danny/session');
  authenticatedUrl.username = 'test-user';
  authenticatedUrl.password = 'test-password';
  for (const url of [
    'javascript:alert(1)', 'http://cal.com/danny/session', authenticatedUrl.href,
    'https://cal.com/danny', 'https://cal.com.evil.example/danny/session', 'https://buy.stripe.com/example',
    'https://cal.com:444/danny/session', 'https://cal.com/danny/session?name=Someone',
  ]) {
    await assert.rejects(() => loadSessions({ PUBLIC_DISCOVERY_BOOKING_URL: url }), undefined, url);
  }
});

test('rejects invalid prices rather than rendering an incorrect checkout amount', async () => {
  for (const price of ['0', '-1', 'abc', '250.001', '9'.repeat(400)]) {
    await assert.rejects(() => loadSessions({ ...paid, PUBLIC_SESSION_PRICE_USD: price }), /positive USD amount/);
  }
});
