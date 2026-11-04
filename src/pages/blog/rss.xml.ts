import { posts } from '../../data/blog';
const escape = (value: string) => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!);
export function GET() {
  const items = posts.map(post => {
    const url = new URL(post.href, 'https://dannysullivan.ai').href;
    return `<item><title>${escape(post.title)}</title><description>${escape(post.description)}</description><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><category>${escape(post.category)}</category></item>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Danny Sullivan — Field Notes</title><link>https://dannysullivan.ai/blog/</link><description>Notes on applied AI, engineering, and adoption.</description><language>en-us</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
