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

## Client billing

- `/clients/` links to the business's live Stripe-hosted customer portal. Stripe verifies the client's billing email before showing their information. The public portal login URL is configured in `src/pages/clients/index.astro`.
- `/clients/manage/` is an owner launchpad for Stripe customers, subscriptions, invoices, and payment links. This page contains only generic links; private data and management actions require signing in to Stripe. It is excluded from search indexing, but is not itself an authenticated dashboard.
- Configure portal capabilities in [Stripe portal settings](https://dashboard.stripe.com/settings/billing/portal). Review cancellation and subscription-change settings for your business.
- Existing subscriptions must be updated in Stripe. Editing this website does not change a client's price or create a subscription. For a rate change at the next renewal, keep the billing cycle unchanged, turn off proration, and verify the next invoice preview before saving.

No Stripe secret key, customer records, or payment details are stored in this static site. Client authentication and billing are handled by Stripe; there is no local copy of billing data to synchronize.

## Main content

- `src/pages/index.astro` — homepage copy, work, stack, and experience
- `src/styles/global.css` — complete visual system and responsive styles
- `public/danny-sullivan.jpg` — portrait
