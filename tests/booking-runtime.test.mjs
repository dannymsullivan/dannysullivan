import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/scripts/booking.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(
  source.replace("import EmbedSnippet from '@calcom/embed-snippet';", 'const EmbedSnippet = globalThis.embedSnippet;'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
);
function browser(configured = true) {
  const host = { hidden: false, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
  const status = { hidden: false, textContent: 'Loading available times…' };
  const listeners = new Map();
  const calls = [];
  const timers = new Map();
  let loads = 0;
  const cal = (command, namespace, config) => {
    calls.push([command, namespace, config]);
    if (command === 'init') cal.ns[namespace] = (method, options) => {
      calls.push([method, options]);
      if (method === 'on') listeners.set(options.action, options.callback);
    };
  };
  cal.ns = {};
  const container = {
    dataset: { calLink: 'danny-sullivan/discovery', calNamespace: 'danny-discovery' },
    querySelector: (selector) => selector === '[data-cal-host]' ? host : status,
  };
  runInNewContext(outputText, {
    document: { querySelector: () => configured ? container : null },
    embedSnippet: () => { loads++; return cal; },
    setTimeout: (callback) => { timers.set(1, callback); return 1; },
    clearTimeout: (id) => timers.delete(id),
  });
  return { host, status, listeners, calls, timers, loads };
}

test('does not load a third-party calendar without a configured event', () => {
  assert.equal(browser(false).loads, 0);
});

test('embeds the selected event with its details visible', () => {
  const state = browser();
  assert.equal(state.calls.find(([command]) => command === 'init')[2].origin, 'https://app.cal.com');
  assert.equal(state.calls.find(([command]) => command === 'inline')[1].calLink, 'danny-sullivan/discovery');
  assert.equal(state.calls.find(([command]) => command === 'ui')[1].hideEventTypeDetails, false);
  state.listeners.get('linkReady')();
  assert.equal(state.status.hidden, true);
  assert.equal(state.host.attrs['aria-busy'], 'false');
  assert.equal(state.timers.size, 0);
});

test('provider failure offers the direct booking link instead of an endless loader', () => {
  const state = browser();
  state.listeners.get('linkFailed')();
  assert.equal(state.host.hidden, true);
  assert.equal(state.status.hidden, false);
  assert.match(state.status.textContent, /Open in Cal.com/);
  assert.equal(state.timers.size, 0);
});

test('a stalled script shows a fallback and can recover if the calendar arrives late', () => {
  const state = browser();
  state.timers.get(1)();
  assert.equal(state.host.hidden, true);
  assert.match(state.status.textContent, /couldn’t load/);
  state.listeners.get('linkReady')();
  assert.equal(state.host.hidden, false);
  assert.equal(state.status.hidden, true);
});
