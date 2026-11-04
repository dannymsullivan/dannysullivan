import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const blogSource = readFileSync(new URL('../src/data/blog.ts', import.meta.url), 'utf8');
const feedSource = readFileSync(new URL('../src/pages/blog/rss.xml.ts', import.meta.url), 'utf8');

async function load(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

function entry(title, date, draft) {
  return { frontmatter: { title, description: `${title} summary`, date, category: 'Engineering', ...(draft === undefined ? {} : { draft }) }, Content: null };
}

async function loadBlog(entries) {
  return load(blogSource.replace(/^const entries = .*;$/m, `const entries = ${JSON.stringify(entries)};`));
}

async function loadFeed(posts) {
  return load(feedSource.replace(/^import \{ posts \} from .*;$/m, `const posts = ${JSON.stringify(posts)};`));
}

test('only published posts enter the shared route/feed list, ordered newest first with filename slugs', async () => {
  const { posts } = await loadBlog({
    '../content/blog/older-post.md': entry('Older', '2025-12-31'),
    '../content/blog/private-draft.md': entry('Private draft', '2027-01-01', true),
    '../content/blog/latest-post.md': entry('Latest', '2026-11-04', false),
  });
  assert.deepEqual(posts.map(post => post.title), ['Latest', 'Older']);
  assert.deepEqual(posts.map(post => post.href), ['/blog/latest-post/', '/blog/older-post/']);
  assert.deepEqual(posts.map(post => post.slug), ['latest-post', 'older-post']);
});

test('an empty or entirely draft collection produces no public posts', async () => {
  assert.deepEqual((await loadBlog({})).posts, []);
  const { posts } = await loadBlog({ '../content/blog/draft.md': entry('Draft', '2026-11-04', true) });
  assert.deepEqual(posts, []);
});

test('calendar dates render consistently at year boundaries regardless of local timezone', async () => {
  const { formatPostDate } = await loadBlog({});
  const original = process.env.TZ;
  try {
    for (const zone of ['Pacific/Honolulu', 'Pacific/Kiritimati']) {
      process.env.TZ = zone;
      assert.equal(formatPostDate('2026-01-01'), 'January 1, 2026');
      assert.equal(formatPostDate('2026-11-04'), 'November 4, 2026');
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('RSS escapes article metadata and supplies canonical URLs, dates and content type', async () => {
  const { GET } = await loadFeed([{
    title: 'Cameras & <geometry> "notes"', description: "A > B & C's examples", category: 'AI & R&D',
    href: '/blog/camera-notes/', date: '2026-11-04',
  }]);
  const response = GET();
  assert.equal(response.headers.get('content-type'), 'application/rss+xml; charset=utf-8');
  const xml = await response.text();
  assert.match(xml, /<title>Cameras &amp; &lt;geometry&gt; &quot;notes&quot;<\/title>/);
  assert.match(xml, /<description>A &gt; B &amp; C&apos;s examples<\/description>/);
  assert.match(xml, /<category>AI &amp; R&amp;D<\/category>/);
  assert.match(xml, /<link>https:\/\/dannysullivan.ai\/blog\/camera-notes\/<\/link>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/dannysullivan.ai\/blog\/camera-notes\/<\/guid>/);
  assert.match(xml, /<pubDate>Wed, 04 Nov 2026 00:00:00 GMT<\/pubDate>/);
  assert.equal((xml.match(/<item>/g) ?? []).length, 1);
  assert.doesNotMatch(xml, /<geometry>/);
});

test('RSS remains a complete channel when there are no published posts', async () => {
  const { GET } = await loadFeed([]);
  const xml = await GET().text();
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<channel>.*<\/channel><\/rss>$/);
  assert.doesNotMatch(xml, /<item>/);
});
