# Danny Sullivan — AI Education & Consulting

An Astro site for private AI education and consulting for business leaders.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run build
npm test
```

The build runs Astro's type checks and generates the static site in `dist/`.

## Sessions and booking

The homepage and `/book/` share two offers:

- **Discovery call:** free, 20 minutes, one-to-one and remote, focused on one small real problem.
- **AI for Business Leaders:** 60 minutes, one-to-one and remote. No technical background required.

The launch price is **$249 per 60-minute session**, collected through Stripe at booking. The paid event is configured for refunds when cancelled at least one business day beforehand. The public event URLs and price are included in `netlify.toml` for deployment and `.env.example` for local use. No credentials are stored in either file. Without booking URLs, the site offers clearly labeled email requests. With no price configured, it shows “Pricing on request.”

To enable online scheduling and payment:

1. Create a free 20-minute event and a paid 60-minute event in Cal.com.
2. Connect your calendar, availability, time zone, and video meeting provider. Connect Stripe to the paid event and require payment as part of booking. Set preparation questions and your cancellation/rescheduling policy in the scheduler.
3. Copy `.env.example` to `.env` for local use. Set the same three public build-time variables in Netlify:

   | Variable | Value |
   | --- | --- |
   | `PUBLIC_DISCOVERY_BOOKING_URL` | Public Cal.com URL of the free event, e.g. `https://cal.com/your-name/discovery` |
   | `PUBLIC_SESSION_BOOKING_URL` | Public Cal.com URL of the paid event, e.g. `https://cal.com/your-name/ai-business-leaders` |
   | `PUBLIC_SESSION_PRICE_USD` | `249`, matching the paid event price in USD |

4. Rebuild. The cards link to `/book/discovery/` and `/book/private/`, each with the matching inline Cal.com calendar. The paid button says “Choose a time & pay.”
5. Verify both event durations, displayed price, time zone, actual availability, payment requirement, confirmation email, meeting link, and cancellation/rescheduling flow in the provider before launch.

Use a **scheduling event URL**, not a standalone Stripe payment link: payment by itself does not reserve calendar availability. The provider owns availability, payment, confirmations, and rescheduling. This static site does not infer a successful booking from a redirect or store customer/payment data. Provider accounts and their policies must be configured separately; no checkout or calendar account is created by a site build.

Configuration lives in `src/config/sessions.ts`. The official `@calcom/embed-snippet` loads a calendar only on an individual session page with a configured event. No Stripe secret key or calendar credentials belong in this site. A direct Cal.com link is always available for browsers without JavaScript or when the embed fails; loading failures also display a clear message. Rates and links are baked into the static build, so changes require a rebuild. A paid URL without a price fails the build. Profile URLs, standalone payment links, and event links containing query parameters are rejected.

The website does not mark a session paid based on iframe events. Cal.com handles payment and booking confirmation. Configure and verify that the 60-minute event requires an upfront payment in Stripe; merely displaying a price on this website does not enforce payment in Cal.com.

## Deploy to Netlify

The existing `netlify.toml` configures `npm run build`, the `dist` publish directory, Node.js 22, baseline security headers, and the public booking configuration. Netlify UI environment overrides, if any, must match these values.

## Client billing

- `/clients/` links to the existing Stripe-hosted customer portal. Stripe verifies the client's billing email before showing information. The public login URL lives in `src/pages/clients/index.astro`.
- `/clients/manage/` is an owner launchpad for Stripe customers, subscriptions, invoices, and payment links. It contains only generic links. Private data and management actions require signing in to Stripe. It is excluded from search indexing but is not itself an authenticated dashboard.
- Portal capabilities are configured in [Stripe portal settings](https://dashboard.stripe.com/settings/billing/portal).
- Existing subscriptions are managed in Stripe. Editing this site does not change a client's price or create a subscription.

## Main files

- `src/pages/index.astro` — positioning, approach, background, and session offers
- `src/pages/book.astro` — session selection, process, and FAQs
- `src/pages/book/[session].astro` — individual session booking pages
- `src/components/BookingCalendar.astro` — inline calendar and direct booking fallback
- `src/scripts/booking.ts` — official Cal.com embed setup and loading/error states
- `src/components/SessionCards.astro` — shared offer cards
- `src/config/sessions.ts` — booking URLs, rate, and honest email fallbacks
- `src/layouts/MarketingLayout.astro` — public navigation and footer
- `src/styles/global.css` — responsive visual system and shared client-page styles
- `public/danny-sullivan.jpg` — existing portrait
- `tests/sessions.test.mjs` — booking configuration and checkout guard tests
- `tests/booking-runtime.test.mjs` — calendar loading, failure, timeout, and recovery tests
