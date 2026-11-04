# Personal website

## Blog

The blog lives at `/blog/`, with a feed at `/blog/rss.xml`. Add posts as Markdown files in `src/content/blog/`; the filename becomes the URL slug. Include `title`, `description`, `date` (quoted `YYYY-MM-DD`), `category`, and optional `draft: true` in YAML frontmatter. Drafts are excluded from the index, generated article routes, and feed. In a public repository, draft Markdown is still publicly readable; keep confidential drafts outside the repository. Set `draft: false` or omit it to include a post in the next build. Published posts sort newest first. Dates are shown consistently in UTC.

`src/data/blog.ts` loads posts; `src/pages/blog/[slug].astro` generates article pages; `src/layouts/BlogLayout.astro` and `src/styles/blog.css` control presentation. Rebuild and deploy to publish edits; no CMS or new service account is required.
