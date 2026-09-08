# Danny Sullivan — Portfolio

A static Astro portfolio for Danny Sullivan, Product Engineer and AI product builder.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run build
```

The production output is generated in `dist/`.

## Deploy to Netlify

Import this repository into Netlify. The included `netlify.toml` configures:

- build command: `npm run build`
- publish directory: `dist`
- Node.js 22
- baseline security headers

No environment variables are required.

## Main content

- `src/pages/index.astro` — homepage copy, work, stack, and experience
- `src/styles/global.css` — complete visual system and responsive styles
- `public/danny-sullivan.jpg` — portrait
