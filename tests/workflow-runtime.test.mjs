import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const page = readFileSync(new URL('../src/pages/work/seatview.astro', import.meta.url), 'utf8');
const script = page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Seatview workflow script must be present');
const { outputText } = ts.transpileModule(script, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});

function browser(hash = '', withExplorer = true) {
  const ids = ['prioritize', 'sources', 'generate', 'review', 'publish'];
  const links = ids.map(id => ({
    dataset: { stageLink: id },
    hash: `#stage-${id}`,
    attrs: new Map(),
    listeners: new Map(),
    setAttribute(name, value) { this.attrs.set(name, value); },
    removeAttribute(name) { this.attrs.delete(name); },
    addEventListener(name, listener) { this.listeners.set(name, listener); },
  }));
  const panels = ids.map(id => ({ dataset: { stagePanel: id }, hidden: false }));
  const explorer = {
    querySelectorAll(selector) {
      if (selector === '[data-stage-link]') return links;
      if (selector === '[data-stage-panel]') return panels;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    classList: { add() {} },
  };
  const location = { hash };
  const replacements = [];
  const listeners = new Map();
  runInNewContext(outputText, {
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, '[data-workflow]');
        return withExplorer ? [explorer] : [];
      },
    },
    location,
    history: {
      replaceState(state, title, url) {
        replacements.push(url);
        location.hash = url;
      },
    },
    window: { addEventListener(name, callback) { listeners.set(name, callback); } },
  });
  return {
    links, panels, location, replacements, listeners,
    selected: () => links.filter(link => link.attrs.get('aria-current') === 'step').map(link => link.dataset.stageLink),
    visible: () => panels.filter(panel => !panel.hidden).map(panel => panel.dataset.stagePanel),
    click(id) {
      let prevented = false;
      links.find(link => link.dataset.stageLink === id).listeners.get('click')({
        preventDefault() { prevented = true; },
      });
      return prevented;
    },
    changeHash(next) {
      location.hash = next;
      listeners.get('hashchange')();
    },
  };
}

test('shows one default workflow stage and marks its navigation link current', () => {
  const state = browser();
  assert.deepEqual(state.visible(), ['prioritize']);
  assert.deepEqual(state.selected(), ['prioritize']);
  assert.deepEqual(state.replacements, []);
});

test('opens the stage requested by a direct link', () => {
  const state = browser('#stage-review');
  assert.deepEqual(state.visible(), ['review']);
  assert.deepEqual(state.selected(), ['review']);
  assert.deepEqual(state.replacements, []);
});

test('unrelated or unknown initial hashes retain the default visible stage', () => {
  for (const hash of ['#safeguards', '#stage-missing']) {
    const state = browser(hash);
    assert.deepEqual(state.visible(), ['prioritize']);
    assert.deepEqual(state.selected(), ['prioritize']);
    assert.equal(state.location.hash, hash);
  }
});

test('clicking stages updates the visible content, current link, and shareable hash', () => {
  const state = browser();
  assert.equal(state.click('publish'), true);
  assert.deepEqual(state.visible(), ['publish']);
  assert.deepEqual(state.selected(), ['publish']);
  assert.equal(state.location.hash, '#stage-publish');
  assert.deepEqual(state.replacements, ['#stage-publish']);

  assert.equal(state.click('sources'), true);
  assert.deepEqual(state.visible(), ['sources']);
  assert.deepEqual(state.selected(), ['sources']);
  assert.equal(state.links.find(link => link.dataset.stageLink === 'publish').attrs.has('aria-current'), false);
  assert.deepEqual(state.replacements, ['#stage-publish', '#stage-sources']);
});

test('hash navigation changes stages while unrelated anchors preserve the current stage', () => {
  const state = browser();
  state.changeHash('#stage-generate');
  assert.deepEqual(state.visible(), ['generate']);
  assert.deepEqual(state.selected(), ['generate']);
  state.changeHash('#agents');
  assert.deepEqual(state.visible(), ['generate']);
  assert.deepEqual(state.selected(), ['generate']);
  assert.deepEqual(state.replacements, []);
});

test('pages without a workflow explorer leave navigation untouched', () => {
  const state = browser('#experience', false);
  assert.equal(state.location.hash, '#experience');
  assert.equal(state.listeners.size, 0);
  assert.deepEqual(state.replacements, []);
});
