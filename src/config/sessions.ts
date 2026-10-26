// Public Cal.com event links. Stripe payment is configured on the paid event.
function bookingUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Booking links must be public HTTPS URLs without credentials.');
  }
  if (!['cal.com', 'www.cal.com'].includes(url.hostname) || url.port || url.pathname.split('/').filter(Boolean).length < 2) {
    throw new Error('Use a Cal.com event URL such as https://cal.com/your-name/event, not a profile or Stripe payment link.');
  }
  if (url.search || url.hash) {
    throw new Error('Use the public Cal.com event link without query parameters or a fragment.');
  }
  url.hostname = 'cal.com';
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.href;
}

const discoveryUrl = bookingUrl(import.meta.env.PUBLIC_DISCOVERY_BOOKING_URL);
const privateUrl = bookingUrl(import.meta.env.PUBLIC_SESSION_BOOKING_URL);
const price = import.meta.env.PUBLIC_SESSION_PRICE_USD?.trim();
if (price && (!/^\d+(\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price)) || Number(price) <= 0)) {
  throw new Error('PUBLIC_SESSION_PRICE_USD must be a positive USD amount.');
}
if (privateUrl && !price) {
  throw new Error('Set PUBLIC_SESSION_PRICE_USD to match the paid booking event before enabling checkout.');
}

function requestEmail(subject: string, body: string) {
  return `mailto:hello@dannysullivan.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const sessions = {
  discovery: {
    title: 'Discovery call',
    duration: 20,
    page: '/book/discovery/',
    calLink: discoveryUrl ? new URL(discoveryUrl).pathname.slice(1) : undefined,
    connected: Boolean(discoveryUrl),
    href: discoveryUrl ?? requestEmail('20-minute AI discovery call', 'Hi Danny,\n\nI’d like to arrange a free 20-minute discovery call.\n\nThe problem I’d like to work on:\n\nMy time zone and a few times that work:\n'),
    cta: discoveryUrl ? 'Book a free discovery call' : 'Arrange a free discovery call',
  },
  private: {
    title: 'AI for Business Leaders',
    duration: 60,
    page: '/book/private/',
    calLink: privateUrl ? new URL(privateUrl).pathname.slice(1) : undefined,
    connected: Boolean(privateUrl),
    href: privateUrl ?? requestEmail('AI for Business Leaders — 60-minute session', 'Hi Danny,\n\nI’m interested in a 60-minute AI for Business Leaders session.\n\nMy role and the problem I’d like to work on:\n\nMy time zone and a few times that work:\n\nPlease send pricing and booking details.\n'),
    cta: privateUrl ? 'Choose a time & pay' : 'Request a private session',
    price: price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(price)) : undefined,
  },
};
