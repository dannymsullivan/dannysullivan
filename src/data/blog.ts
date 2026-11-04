import type { MarkdownInstance } from 'astro';

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  draft?: boolean;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
}

const entries = import.meta.glob<MarkdownInstance<BlogFrontmatter>>('../content/blog/*.md', { eager: true });

export const posts = Object.entries(entries)
  .filter(([, entry]) => !entry.frontmatter.draft)
  .map(([file, entry]) => {
    const slug = file.split('/').pop()!.replace(/\.md$/, '');
    return { ...entry.frontmatter, slug, href: `/blog/${slug}/`, Content: entry.Content };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`));
}
